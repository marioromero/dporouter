import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { WorkspaceProvider, useWorkspace } from "./workspace/context";
import { GuidanceSessionProvider } from "./guidance/session";
import { HomePage } from "./pages/Home";
import { EmpresaPage } from "./pages/Empresa";
import { TrabajoPage } from "./pages/Trabajo";
import { DiagnosticoPage } from "./pages/Diagnostico";
import { DominioDetallePage } from "./pages/DominioDetalle";
import { ActividadPage } from "./pages/Actividad";
import { GuiaPage } from "./pages/Guia";
import { BuscarPage } from "./pages/Buscar";
import { GlosarioPage } from "./pages/Glosario";
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
            <Route path="/trabajo" element={<RequireCompany><TrabajoPage /></RequireCompany>} />
            <Route path="/trabajo/:domainKey" element={<RequireCompany><DominioDetallePage /></RequireCompany>} />
            <Route path="/diagnostico" element={<RequireCompany><DiagnosticoPage /></RequireCompany>} />
            <Route path="/actividad/:activityKey" element={<RequireCompany><ActividadPage /></RequireCompany>} />
            <Route path="/actividad/:activityKey/guia" element={<RequireCompany><GuiaPage /></RequireCompany>} />
            <Route path="/actividad/:activityKey/guia/:nodeKey" element={<RequireCompany><GuiaPage /></RequireCompany>} />
            <Route path="/buscar" element={<BuscarPage />} />
            <Route path="/glosario" element={<GlosarioPage />} />
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

/**
 * Hilo de trabajo Stage 1: sin asesor logueado no hay acciones; sin
 * empresa seleccionada tampoco. Las vistas de referencia
 * (Buscar/Glosario/Referencias/Inicio) quedan abiertas por ser
 * solo lectura.
 */
function RequireCompany({ children }: { children: ReactNode }) {
  const { profile, company } = useWorkspace();
  if (!profile) {
    return (
      <>
        <h1>Se requiere sesión</h1>
        <p className="lede">
          Inicia sesión como asesor para llevar el hilo del trabajo. Sin
          asesor logueado no se ejecuta ninguna acción.
        </p>
        <div className="actions">
          <Link className="btn" to="/empresa">
            Ir al acceso
          </Link>
        </div>
      </>
    );
  }
  if (!company) {
    return (
      <>
        <h1>Selecciona una empresa</h1>
        <p className="lede">
          Asesor {profile.name}: elige una de tus empresas para continuar.
          Sin empresa seleccionada no se ejecuta ninguna acción.
        </p>
        <div className="actions">
          <Link className="btn" to="/empresa">
            Ir a mis empresas
          </Link>
        </div>
      </>
    );
  }
  return <>{children}</>;
}
