import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import { ConfigProvider, Spin } from "antd";
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
import AcessoNegado from "./pages/AcessoNegado";
import Pagina404 from "./pages/Pagina404";
import Home from "./pages/Home";
import Perfil from "./pages/Perfil";

const RotasProtegidas = ({ children }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin/>
      </div>
    );
  }

  return usuario ? <>{children}</> : <Navigate to="/login" />;
};

const RotasPublicas = ({ children }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin />
      </div>
    );
  }

  return !usuario ? <>{children}</> : <Navigate to="/login" />;
};

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
                  <RotasPublicas>
                    <Login />
                  </RotasPublicas>
                }
              />
              <Route
                path="/especie"
                element={
                  <RotasProtegidas>
                    <Especie />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RotasProtegidas>
                    <Dashboard />
                  </RotasProtegidas>
                }
              />
              <Route path="/acessoNegado" element={<AcessoNegado />} />
              <Route
                path="/raca"
                element={
                  <RotasProtegidas>
                    <Raca />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/usuario"
                element={
                  <RotasProtegidas>
                    <Usuario />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/pet"
                element={
                  <RotasProtegidas>
                    <Pet />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/vacina"
                element={
                  <RotasProtegidas>
                    <Vacina />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/marca"
                element={
                  <RotasProtegidas>
                    <Marca />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/atendimento"
                element={
                  <RotasProtegidas>
                    <Atendimento />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/pet/:petId"
                element={
                  <RotasProtegidas>
                    <PetMoreInfo />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/pet/:petId/vacinas"
                element={
                  <RotasProtegidas>
                    <PetVacinas />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/pet/:petId/vermifugos"
                element={
                  <RotasProtegidas>
                    <PetVermifugo />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/perfil"
                element={
                  <RotasProtegidas>
                    <Perfil />
                  </RotasProtegidas>
                }
              />
              <Route
                path="/"
                element={
                  <RotasProtegidas>
                    <Home />
                  </RotasProtegidas>
                }
              />
              <Route path="*" element={<Pagina404 />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}
