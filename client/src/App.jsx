import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Libros from './pages/Libros';
import Prestamos from './pages/Prestamos';
import Usuarios from './pages/Usuarios';
import Registro from './pages/Registro';
import MisPrestamos from './pages/MisPrestamos';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

      <Route path="/dashboard" element={
        <PrivateRoute onlyPersonal><Layout><Dashboard /></Layout></PrivateRoute>
      } />
      <Route path="/libros" element={
        <PrivateRoute onlyPersonal><Layout><Libros /></Layout></PrivateRoute>
      } />
      <Route path="/prestamos" element={
        <PrivateRoute onlyPersonal><Layout><Prestamos /></Layout></PrivateRoute>
      } />
      <Route path="/usuarios" element={
        <PrivateRoute onlyPersonal><Layout><Usuarios /></Layout></PrivateRoute>
      } />
      <Route path="/registro" element={
        <PrivateRoute onlyPersonal><Layout><Registro /></Layout></PrivateRoute>
      } />
      <Route path="/mis-prestamos" element={
        <PrivateRoute><MisPrestamos /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to={user ? (user.rol === 'personal' ? '/dashboard' : '/mis-prestamos') : '/login'} />} />
    </Routes>
  );
}
