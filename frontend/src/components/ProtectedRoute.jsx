import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute
 * --------------
 * Wraps any route that requires a logged-in user. Without this, visiting
 * "/" (or any app page) with no token would still render the page and let
 * it fire API calls that fail with 401 — instead of sending the person to
 * login. The backend still independently enforces auth on every request
 * (this is a UX guard, not the security boundary).
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
