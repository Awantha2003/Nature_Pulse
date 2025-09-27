import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleRedirect = ({ requiredRole }) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (hasRole(requiredRole)) {
    return <Navigate to={`/app/${requiredRole}/dashboard`} replace />;
  }

  // Redirect to appropriate role dashboard
  if (hasRole('patient')) {
    return <Navigate to="/app/patient/dashboard" replace />;
  } else if (hasRole('doctor')) {
    return <Navigate to="/app/doctor/dashboard" replace />;
  } else if (hasRole('admin')) {
    return <Navigate to="/app/admin/overview" replace />;
  }

  return <Navigate to="/" replace />;
};

export default RoleRedirect;
