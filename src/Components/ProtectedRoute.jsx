import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <p className="text-lg font-medium animate-pulse">Checking Authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }


  return children;
};

export default ProtectedRoute;
