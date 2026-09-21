import { useParams } from "react-router-dom";
import { getDemoActivity } from "../data/demoActivity";
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
      activity={demo}
      demoBanner="DEMOSTRACIÓN DE INTERFAZ · CONTENIDO NO CANÓNICO"
      trace={[
        { label: "semantic key", value: demo.activity_key },
        { label: "type", value: "demostrativo (no canónico)" },
        { label: "applicable roles", value: "No aplica en demostración" },
        { label: "applicability conditions", value: "Solo validación de interfaz de Stage 1" },
        { label: "dependencies", value: "Sin dependencias" },
        { label: "state effects", value: "Sin efectos de estado" },
        { label: "relationship effects", value: "Sin efectos de relación" },
        { label: "regulatory status", value: "No aplica (demostrativo)" },
      ]}
    />
  );
}
