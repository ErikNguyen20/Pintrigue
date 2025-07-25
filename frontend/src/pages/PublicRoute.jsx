import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import { useEffect, useState } from "react";

export default function PublicRoute() {
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

  if (loggedIn) {
    // If not logged in, redirect to the login page
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}
