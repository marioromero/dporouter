import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { GuidanceSessionProvider } from "./guidance/session";
import { HomePage } from "./pages/Home";
import { DiagnosticoPage } from "./pages/Diagnostico";
import { MapaPage } from "./pages/Mapa";
import { DominiosPage } from "./pages/Dominios";
import { DominioDetallePage } from "./pages/DominioDetalle";
import { ActividadPage } from "./pages/Actividad";
import { GuiaPage } from "./pages/Guia";
import { BuscarPage } from "./pages/Buscar";
import { FuentesPage } from "./pages/Fuentes";
import { NotFoundPage } from "./pages/NotFound";

export function App() {
  return (
    <GuidanceSessionProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/diagnostico" element={<DiagnosticoPage />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/dominios" element={<DominiosPage />} />
          <Route path="/dominios/:domainKey" element={<DominioDetallePage />} />
          <Route path="/actividad/:activityKey" element={<ActividadPage />} />
          <Route path="/actividad/:activityKey/guia" element={<GuiaPage />} />
          <Route path="/actividad/:activityKey/guia/:nodeKey" element={<GuiaPage />} />
          <Route path="/buscar" element={<BuscarPage />} />
          <Route path="/fuentes" element={<FuentesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </GuidanceSessionProvider>
  );
}
