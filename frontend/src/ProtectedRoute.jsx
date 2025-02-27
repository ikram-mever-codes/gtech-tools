import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const EXPIRY_DAYS = 3;

const setAuthWithExpiry = (value) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
  const authData = {
    value,
    expiry: expiryDate.getTime(),
  };
  localStorage.setItem("isAuthenticated", JSON.stringify(authData));
};

export const getAuthWithExpiry = () => {
  const authDataStr = localStorage.getItem("isAuthenticated");
  if (!authDataStr) return null;
  const authData = JSON.parse(authDataStr);
  const now = new Date().getTime();
  if (now > authData.expiry) {
    localStorage.removeItem("isAuthenticated");
    return null;
  }
  return authData.value;
};

const ProtectedRoute = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = getAuthWithExpiry();
    if (storedAuth === null) {
      const username = prompt("Enter your Username:");
      const password = prompt("Enter your Password:");
      const correctUsername = "misgtech";
      const correctPassword = "Mis@Gtech";

      if (username === correctUsername && password === correctPassword) {
        setAuthWithExpiry(true);
        setIsAuthenticated(true);
      } else {
        localStorage.setItem(
          "isAuthenticated",
          JSON.stringify({ value: false })
        );
        window.location.href = "/wrong-credentials";
      }
    } else {
      setIsAuthenticated(storedAuth);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? element : <Navigate to="/wrong-credentials" />;
};

export default ProtectedRoute;
