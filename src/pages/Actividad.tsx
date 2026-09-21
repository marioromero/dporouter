import { useParams } from "react-router-dom";
import { getDemoActivity } from "../data/demoActivity";
import { fromDemoActivity } from "../activityViewModel";
import { ActivitySheet } from "../components/ActivitySheet";
import { NotFoundPage } from "./NotFound";

export function ActividadPage() {
  const { activityKey } = useParams<{ activityKey: string }>();
  const demo = activityKey ? getDemoActivity(activityKey) : undefined;

  if (!demo) {
    return <NotFoundPage />;
  }

  return (
    <ActivitySheet
      view={fromDemoActivity(demo)}
      banner="DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO"
    />
  );
}
