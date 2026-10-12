import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FlightSearch } from './pages/FlightSearch';
import { HomePage } from './pages/HomePage';
import { BookingsPage } from './pages/BookingsPage';
import { MyBookings } from './pages/MyBookings';
import { HealthDashboard } from './pages/HealthDashboard';
import { TelemetryPage } from './pages/TelemetryPage';
import { AuthPage } from './pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<FlightSearch />} />
            <Route path="search" element={<FlightSearch />} />
            <Route path="overview" element={<HomePage />} />
            <Route path="offers" element={<HomePage />} />
            <Route
              path="bookings"
              element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route path="telemetry" element={<HealthDashboard />} />
            <Route path="health" element={<HealthDashboard />} />
            <Route path="auth" element={<AuthPage />} />
            <Route path="login" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
