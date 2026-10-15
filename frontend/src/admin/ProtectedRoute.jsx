import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner, ErrorMessage } from "../components/UI";
export default function ProtectedRoute() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner label="Checking your session…" />;
  if (error)
    return (
      <div className="container">
        <ErrorMessage
          message="We could not verify your session. Please try again."
          retry={refresh}
        />
      </div>
    );
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}
