import { useParams } from "react-router-dom";
import { getDemoActivity } from "../data/demoActivity";
import { fromActivityDefinition, fromDemoActivity } from "../activityViewModel";
import {
  PENDING_CROSS_DOMAIN,
  getActivity,
  getCanonicalActivityKeys,
} from "../data/d01";
import { ActivitySheet } from "../components/ActivitySheet";
import { NotFoundPage } from "./NotFound";

export function ActividadPage() {
  const { activityKey } = useParams<{ activityKey: string }>();

  const demo = activityKey ? getDemoActivity(activityKey) : undefined;
  if (demo) {
    return (
      <ActivitySheet
        view={fromDemoActivity(demo)}
        banner="DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO"
      />
    );
  }

  const def = activityKey ? getActivity(activityKey) : undefined;
  if (!def) {
    return <NotFoundPage />;
  }

  return (
    <ActivitySheet
      view={fromActivityDefinition(def, {
        knownActivityKeys: getCanonicalActivityKeys(),
        pendingImportKeys: PENDING_CROSS_DOMAIN,
        domain: { domainKey: "d1", domainCode: "D1" },
      })}
    />
  );
}
