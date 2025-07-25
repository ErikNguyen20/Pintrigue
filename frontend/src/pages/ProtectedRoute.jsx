import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

export default function ProtectedRoute() {
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    async function checkLogin() {
      const result = await isLoggedIn();
      setLoggedIn(result);
    }
    checkLogin();
  }, []);

  if (loggedIn === null) {
    // Optionally show a loading spinner while checking
    return null;
  }

  if (!loggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}