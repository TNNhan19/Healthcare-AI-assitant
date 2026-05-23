import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  roles: Array<'admin' | 'pharmacist' | 'client'>;
  children: React.ReactNode;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ roles, children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const loginPath = roles.length === 1
    ? (roles[0] === 'admin' ? '/admin-login' : roles[0] === 'pharmacist' ? '/pharmacist-login' : '/login')
    : '/login';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!user || !roles.includes((user.userType as any) || 'client')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
