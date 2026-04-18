import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, onlyPersonal = false }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (onlyPersonal && user.rol !== "personal")
    return <Navigate to="/mis-prestamos" replace />;
  return children;
}
