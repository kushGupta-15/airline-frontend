import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3005';

const apiClient = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 10000,
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

// Request Interceptor: Injects auth token and correlation ID
apiClient.interceptors.request.use(
  (config) => {
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

    return response;
  },
  (error) => {
    const correlationId = error.config?.headers?.['x-correlation-id'];
    let errorMessage = 'An unexpected error occurred';
    let statusCode = error.response?.status;

    if (error.response) {
      const data = error.response.data;
      errorMessage = data?.err || data?.message || `Gateway returned error (${statusCode})`;

      if (statusCode === 401) {
        // Token expired or invalid
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

    return Promise.reject(error);
  }
);

// Unified microservice API wrappers communicating through API Gateway
export const authApi = {
  signup: (payload) => apiClient.post('/authservice/api/v1/signup', payload),
  signin: (payload) => apiClient.post('/authservice/api/v1/signin', payload),
  isAuthenticated: () => apiClient.get('/authservice/api/v1/isauthenticated'),
};

export const flightApi = {
  getFlights: (params) => apiClient.get('/flightservice/api/v1/flights', { params }),
  getFlightById: (id) => apiClient.get(`/flightservice/api/v1/flights/${id}`),
  getCities: () => apiClient.get('/flightservice/api/v1/city'),
  getAirports: () => apiClient.get('/flightservice/api/v1/airports'),
};

export const bookingApi = {
  createBooking: (payload) => apiClient.post('/bookingservice/api/v1/bookings', payload),
};

export const systemApi = {
  getHealth: () => apiClient.get('/health'),
  getMetrics: () => apiClient.get('/metrics'),
};

export default apiClient;
