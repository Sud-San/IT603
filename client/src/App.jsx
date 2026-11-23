import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';

// Customer Pages
import HomePage from './pages/customer/HomePage.jsx';
import JoinQueuePage from './pages/customer/JoinQueuePage.jsx';
import TrackQueuePage from './pages/customer/TrackQueuePage.jsx';
import LiveBoardPage from './pages/customer/LiveBoardPage.jsx';

// Staff & Auth Pages
import LoginPage from './pages/auth/LoginPage.jsx';
import ReceptionDashboard from './pages/reception/ReceptionDashboard.jsx';
import BarberDashboard from './pages/barber/BarberDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinQueuePage />} />
        <Route path="/track" element={<TrackQueuePage />} />
        <Route path="/board" element={<LiveBoardPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Staff Protected Routes */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <ReceptionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barber"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'BARBER']}>
              <BarberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
