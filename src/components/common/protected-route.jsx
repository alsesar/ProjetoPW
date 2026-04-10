import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/app-config';
import { hasActiveSession } from '../../utils/session';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasActiveSession()) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}
