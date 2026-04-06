import { Navigate } from "react-router-dom";
import { getStoredAuthSession, isAuthSessionValid } from "@/lib/supabaseClient";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = getStoredAuthSession();

  if (!isAuthSessionValid(session)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
