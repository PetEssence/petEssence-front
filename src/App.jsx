import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import "./App.css";
import Especie from "./pages/Especie";
import Dashboard from "./pages/Dashboard";
import Raca from "./pages/Raca";
import Usuario from "./pages/Usuario";
import Pet from "./pages/Pet/Pet";
import PetMoreInfo from "./pages/Pet/PetMoreInfo";
import Vacina from "./pages/Vacina";
import PetVacinas from "./pages/Pet/PetVacinas";
import PetVermifugo from "./pages/Pet/PetVermifugo";
import Marca from "./pages/Marca";
import Atendimento from "./pages/Atendimento";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  return !user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#29C28D",
          colorPrimaryHover: "#22A478",
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <div className="w-full h-full">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/especie"
                element={
                  <ProtectedRoute>
                    <Especie />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/raca"
                element={
                  <ProtectedRoute>
                    <Raca />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuario"
                element={
                  <ProtectedRoute>
                    <Usuario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pet"
                element={
                  <ProtectedRoute>
                    <Pet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacina"
                element={
                  <ProtectedRoute>
                    <Vacina />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marca"
                element={
                  <ProtectedRoute>
                    <Marca />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/atendimento"
                element={
                  <ProtectedRoute>
                    <Atendimento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:petId"
                element={
                  <ProtectedRoute>
                    <PetMoreInfo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:petId/vacinas"
                element={
                  <ProtectedRoute>
                    <PetVacinas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:petId/vermifugos"
                element={
                  <ProtectedRoute>
                    <PetVermifugo />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}
