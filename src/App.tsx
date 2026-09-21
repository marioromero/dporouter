import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { DiagnosticoPage } from "./pages/Diagnostico";
import { MapaPage } from "./pages/Mapa";
import { DominiosPage } from "./pages/Dominios";
import { DominioDetallePage } from "./pages/DominioDetalle";
import { ActividadPage } from "./pages/Actividad";
import { BuscarPage } from "./pages/Buscar";
import { FuentesPage } from "./pages/Fuentes";
import { NotFoundPage } from "./pages/NotFound";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostico" element={<DiagnosticoPage />} />
        <Route path="/mapa" element={<MapaPage />} />
        <Route path="/dominios" element={<DominiosPage />} />
        <Route path="/dominios/:domainKey" element={<DominioDetallePage />} />
        <Route path="/actividad/:activityKey" element={<ActividadPage />} />
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/fuentes" element={<FuentesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
