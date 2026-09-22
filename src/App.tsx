import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { WorkspaceProvider } from "./workspace/context";
import { GuidanceSessionProvider } from "./guidance/session";
import { HomePage } from "./pages/Home";
import { EmpresaPage } from "./pages/Empresa";
import { TrabajoPage } from "./pages/Trabajo";
import { DiagnosticoPage } from "./pages/Diagnostico";
import { DominioDetallePage } from "./pages/DominioDetalle";
import { ActividadPage } from "./pages/Actividad";
import { GuiaPage } from "./pages/Guia";
import { BuscarPage } from "./pages/Buscar";
import { ReferenciasPage } from "./pages/Referencias";
import { NotFoundPage } from "./pages/NotFound";

export function App() {
  return (
    <WorkspaceProvider>
      <GuidanceSessionProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/empresa" element={<EmpresaPage />} />
            <Route path="/trabajo" element={<TrabajoPage />} />
            <Route path="/trabajo/:domainKey" element={<DominioDetallePage />} />
            <Route path="/diagnostico" element={<DiagnosticoPage />} />
            <Route path="/actividad/:activityKey" element={<ActividadPage />} />
            <Route path="/actividad/:activityKey/guia" element={<GuiaPage />} />
            <Route path="/actividad/:activityKey/guia/:nodeKey" element={<GuiaPage />} />
            <Route path="/buscar" element={<BuscarPage />} />
            <Route path="/referencias" element={<ReferenciasPage />} />
            {/* Redirects de la navegación anterior: los deep links se conservan. */}
            <Route path="/mapa" element={<Navigate to="/trabajo" replace />} />
            <Route path="/dominios" element={<Navigate to="/trabajo" replace />} />
            <Route
              path="/dominios/:domainKey"
              element={<DominioRedirect />}
            />
            <Route path="/fuentes" element={<Navigate to="/referencias" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </GuidanceSessionProvider>
    </WorkspaceProvider>
  );
}

function DominioRedirect() {
  // Preserva /dominios/:domainKey redirigiendo al detalle en Trabajo.
  const { domainKey } = useParams<{ domainKey: string }>();
  return <Navigate to={`/trabajo/${domainKey ?? ""}`} replace />;
}
