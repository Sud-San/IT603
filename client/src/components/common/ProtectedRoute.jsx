import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If barber lands on reception/admin, route to barber portal; if reception lands on admin, route to reception
    if (user.role === 'BARBER') return <Navigate to="/barber" replace />;
    if (user.role === 'RECEPTIONIST') return <Navigate to="/reception" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
