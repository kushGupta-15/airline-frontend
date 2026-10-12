# SkyFlow Airlines — Frontend Application

Modern Single-Page Application (SPA) providing an interactive user interface for the **SkyFlow Airline Microservices Architecture**. Built with React, Vite, and Tailwind CSS, interfacing directly with the centralized **API Gateway** on port `3005`.

---

## 🛠️ Tech Stack & Key Features

- **Runtime & Build Engine**: [Vite](https://vite.dev/) + React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
  - **Request Interceptor**: Injects `x-access-token` JWT and auto-generates/propagates `x-correlation-id` for distributed end-to-end tracing.
  - **Response Interceptor**: Extracts correlation headers and provides centralized downstream error handling (503 Service Unavailable, 504 Gateway Timeout).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```env
VITE_GATEWAY_URL=http://localhost:3005
```

### 3. Launch Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

---

## 🌐 API Gateway Routing Contract

The frontend connects **exclusively** to the API Gateway at `http://localhost:3005`:

| Endpoint Path | Destination Microservice | Purpose |
| :--- | :--- | :--- |
| `/authservice/api/v1/signup` | `Airline_auth_service` (:3001) | User registration |
| `/authservice/api/v1/signin` | `Airline_auth_service` (:3001) | User authentication & JWT issuance |
| `/authservice/api/v1/isauthenticated` | `Airline_auth_service` (:3001) | JWT token verification |
| `/flightservice/api/v1/flights` | `Airline-Search-Service-` (:3000) | Search flights (Redis-cached) |
| `/flightservice/api/v1/city` | `Airline-Search-Service-` (:3000) | Origin/Destination airport cities |
| `/bookingservice/api/v1/bookings` | `Airline_Booking_Service` (:3002) | Create booking (Saga & Circuit Breaker) |
| `/health` | `API_Gateway` (:3005) | Gateway cluster health |
| `/metrics` | `API_Gateway` (:3005) | Telemetry, uptime & heap memory |
