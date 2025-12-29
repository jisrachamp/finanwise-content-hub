import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
