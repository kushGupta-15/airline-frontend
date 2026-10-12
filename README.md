# SkyFlow Airlines — Frontend Application

Modern Single-Page Application (SPA) providing an interactive user interface for the **SkyFlow Airline Microservices Architecture**. Built with React, Vite, and Tailwind CSS, interfacing directly with the centralized **API Gateway** on port `3005`.

---

## 🛠️ Tech Stack & Key Features

- **Runtime & Build Engine**: [Vite](https://vite.dev/) + React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Real-Time Flight Status Radar (`/flight-status`)**: 
  - Live flight search by flight number (e.g. `AI-999`, `UK-820`) or origin/destination route.
  - Multi-stage flight progression milestones (`Scheduled` ➔ `Check-in Open` ➔ `Security & Gate` ➔ `Boarding` ➔ `Airborne` ➔ `Arrived`).
  - Real-time ground & in-flight telemetry: Departure Gate, Arrivals Baggage Carousel, Destination Weather, Aircraft Specifications, and Airborne progress percentage.
- **Operations Command Center & Flight Dispatcher (`/admin`)**:
  - **Operational Status Dispatcher**: Airline dispatchers can update live operational flight statuses (`ON TIME`, `BOARDING`, `DELAYED (15m/30m/60m)`, `AIRBORNE`, `ARRIVED`, `CANCELLED`) synchronized in real time with passenger radars.
  - **Passenger Manifest & Seat Allocations Inspector**: Full manifest overview displaying passenger account IDs, assigned seats, ticket statuses, gross revenue collections, and flight load factor calculations.
  - **Route & Fleet Manager**: Dispatch new flights, assign aircraft types, define departure/arrival hubs, and configure new destinations.
- **Interactive 2D Aircraft Cabin Seat Map**: Visual fuselage floorplan (Airbus A320neo) featuring Business Class (2-2 configuration), Economy Class (3-3 configuration), Emergency Exit extra legroom rows, deterministic real-time occupancy indicators, and multi-passenger interactive seat assignment.
- **Multi-Passenger Travel Manifest**: Collects full legal name, title, age category, seat selection, and dietary preferences for all traveling passengers with instant boarding pass generation.
- **Self-Service Trip Cancellation & Saga Restock**: Allows passengers to cancel confirmed trips directly with reason attribution, real-time refund calculation breakdown (90% net refund), and automatic seat inventory replenishment in the Flights service.
- **Round-Trip Itinerary Selector**: Dual-date picker with interactive Outbound & Inbound leg switching and combined price consolidation.
- **Ancillary Add-ons & Travel Protection**: Baggage allowance tiers (+15kg check-in, +25kg heavy load), SkyAssure comprehensive travel insurance, and Priority Boarding passes.
- **Promo Discount Voucher Engine**: Real-time coupon validator with instant savings deduction (`SKYFLOW10`, `FLYFIRST`, `SUMMER2026`).
- **Global Toast Notification System**: Animated, non-intrusive status notifications for bookings, seat assignments, voucher validations, cancellations, and flight dispatch actions.
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
| `/authservice/api/v1/signin` | `Airline_auth_service` (:3001) | User authentication & JWT issuance (Brute-force protected) |
| `/authservice/api/v1/isauthenticated` | `Airline_auth_service` (:3001) | JWT token verification |
| `/flightservice/api/v1/flights` | `Airline-Search-Service-` (:3000) | Search flights (Redis-cached) & Admin route mutations |
| `/flightservice/api/v1/city` | `Airline-Search-Service-` (:3000) | Origin/Destination airport cities |
| `/bookingservice/api/v1/bookings` | `Airline_Booking_Service` (:3002) | Create booking, Admin Passenger Manifest, User Bookings |
| `/bookingservice/api/v1/bookings/:id/cancel` | `Airline_Booking_Service` (:3002) | Self-service cancellation & Saga seat restock |
| `/health` | `API_Gateway` (:3005) | Gateway cluster health |
| `/metrics` | `API_Gateway` (:3005) | Telemetry, uptime & heap memory |
