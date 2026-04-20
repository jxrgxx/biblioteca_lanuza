import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Libros from './pages/Libros';
import Prestamos from './pages/Prestamos';
import Usuarios from './pages/Usuarios';
import Registro from './pages/Registro';
import MisPrestamos from './pages/MisPrestamos';
import Catalogo from './pages/Catalogo';

function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Catalogo />} />

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" />}
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute onlyPersonal>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/libros"
        element={
          <PrivateRoute onlyPersonal>
            <Layout>
              <Libros />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/prestamos"
        element={
          <PrivateRoute onlyPersonal>
            <Layout>
              <Prestamos />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <PrivateRoute onlyPersonal>
            <Layout>
              <Usuarios />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/registro"
        element={
          <PrivateRoute onlyPersonal>
            <Layout>
              <Registro />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mis-prestamos"
        element={
          <PrivateRoute>
            <MisPrestamos />
          </PrivateRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate to="/"
          />
        }
      />
    </Routes>
  );
}
