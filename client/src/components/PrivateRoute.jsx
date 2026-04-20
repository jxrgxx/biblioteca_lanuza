import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES_GESTION = ["admin", "biblioteca"];
export const esGestion = (rol) => ROLES_GESTION.includes(rol);

export default function PrivateRoute({ children, onlyPersonal = false }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (onlyPersonal && !esGestion(user.rol))
    return <Navigate to="/mi-espacio" replace />;
  return children;
}
