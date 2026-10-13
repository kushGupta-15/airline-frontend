import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3005';

const apiClient = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to generate UUID in browser
const generateCorrelationId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'corr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

// In-memory trace history store for Inspector
const MAX_TRACES = 50;
export const traceHistory = [];
const traceListeners = new Set();

export const subscribeToTraces = (callback) => {
  traceListeners.add(callback);
  callback([...traceHistory]);
  return () => traceListeners.delete(callback);
};

const recordTrace = (trace) => {
  traceHistory.unshift(trace);
  if (traceHistory.length > MAX_TRACES) {
    traceHistory.pop();
  }
  traceListeners.forEach((listener) => {
    try { listener([...traceHistory]); } catch (_) {}
  });
};

// Request Interceptor: Injects auth token, correlation ID, and tracks timestamp
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: performance.now() };

    // 1. Inject JWT access token if present in localStorage
    const token = localStorage.getItem('airline_token');
    if (token) {
      config.headers['x-access-token'] = token;
    }

    // 2. Inject or propagate distributed correlation ID
    const correlationId = config.headers['x-correlation-id'] || generateCorrelationId();
    config.headers['x-correlation-id'] = correlationId;

    return config;
  },
  (error) => {
    console.error('[API Gateway Client] Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling and tracing extraction
apiClient.interceptors.response.use(
  (response) => {
    const latency = response.config?.metadata ? Math.round(performance.now() - response.config.metadata.startTime) : 0;

    // Track returned correlation ID from API Gateway
    const traceId = response.headers['x-correlation-id'];
    if (traceId) {
      response.correlationId = traceId;
    }

    // Track Redis cache performance status header
    const cacheHeader = response.headers['x-cache'] || response.headers['X-Cache'];
    if (cacheHeader) {
      response.cacheStatus = cacheHeader.toUpperCase();
    } else if (response.data?.message?.toLowerCase().includes('cached')) {
      response.cacheStatus = 'HIT';
    } else {
      response.cacheStatus = 'MISS';
    }

    recordTrace({
      id: traceId || response.config?.headers?.['x-correlation-id'] || 'trace-' + Date.now(),
      method: (response.config?.method || 'GET').toUpperCase(),
      url: response.config?.url,
      status: response.status,
      statusText: response.statusText,
      duration: latency,
      timestamp: new Date().toLocaleTimeString(),
      cacheStatus: response.cacheStatus,
      success: true,
    });

    return response;
  },
  (error) => {
    const correlationId = error.config?.headers?.['x-correlation-id'] || 'trace-err';
    const latency = error.config?.metadata ? Math.round(performance.now() - error.config.metadata.startTime) : 0;
    let errorMessage = 'An unexpected error occurred';
    let statusCode = error.response?.status;

    if (error.response) {
      const data = error.response.data;
      errorMessage = data?.err || data?.message || `Gateway returned error (${statusCode})`;

      if (statusCode === 401) {
        console.warn(`[Tracing: ${correlationId}] Unauthorized request to ${error.config?.url}`);
      } else if (statusCode === 503) {
        errorMessage = 'Downstream microservice is temporarily unavailable (503 Service Unavailable)';
      } else if (statusCode === 504) {
        errorMessage = 'Downstream service request timed out (504 Gateway Timeout)';
      }
    } else if (error.request) {
      errorMessage = 'Cannot reach API Gateway at ' + GATEWAY_URL + '. Check if backend is active.';
    }

    // Attach enriched metadata
    error.formattedMessage = errorMessage;
    error.correlationId = correlationId;

    recordTrace({
      id: correlationId,
      method: (error.config?.method || 'GET').toUpperCase(),
      url: error.config?.url || 'unknown',
      status: statusCode || 500,
      statusText: error.message,
      duration: latency,
      timestamp: new Date().toLocaleTimeString(),
      cacheStatus: 'MISS',
      success: false,
      error: errorMessage,
    });

    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (payload) => apiClient.post('/authservice/api/v1/signup', payload),
  signin: (payload) => apiClient.post('/authservice/api/v1/signin', payload),
  isAuthenticated: () => apiClient.get('/authservice/api/v1/isauthenticated'),
  isAdmin: (id) => apiClient.get('/authservice/api/v1/isAdmin', { params: { id } }),
};

export const flightApi = {
  getFlights: (params) => apiClient.get('/flightservice/api/v1/flights', { params }),
  getFlightById: (id) => apiClient.get(`/flightservice/api/v1/flights/${id}`),
  createFlight: (payload) => apiClient.post('/flightservice/api/v1/flights', payload),
  getCities: () => apiClient.get('/flightservice/api/v1/city'),
  createCity: (payload) => apiClient.post('/flightservice/api/v1/city', payload),
  getAirports: () => apiClient.get('/flightservice/api/v1/airports'),
  createAirport: (payload) => apiClient.post('/flightservice/api/v1/airports', payload),
};

export const bookingApi = {
  createBooking: (payload) => apiClient.post('/bookingservice/api/v1/bookings', payload),
  getUserBookings: () => apiClient.get('/bookingservice/api/v1/bookings'),
  getAllBookings: () => apiClient.get('/bookingservice/api/v1/bookings'),
  getBookingById: (id) => apiClient.get(`/bookingservice/api/v1/bookings/${id}`),
  cancelBooking: (id) => apiClient.patch(`/bookingservice/api/v1/bookings/${id}/cancel`),
};

export const systemApi = {
  getHealth: () => apiClient.get('/health'),
  getMetrics: () => apiClient.get('/metrics'),
  getClusterOverview: () => apiClient.get('/system/overview'),
};

export default apiClient;
