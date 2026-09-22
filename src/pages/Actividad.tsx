import { useParams } from "react-router-dom";
import { getDemoActivity } from "../data/demoActivity";
import { fromActivityDefinition, fromDemoActivity } from "../activityViewModel";
import {
  getCanonicalActivity,
  getCanonicalKeys,
  getDomainForActivity,
  getUnresolvedReferences,
} from "../../content/registry";
import { getProtocolForActivity } from "../../content/protocols/registry";
import { ActivitySheet } from "../components/ActivitySheet";
import { ActivityGuidedSection } from "../components/GuidedSection";
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

  const def = activityKey ? getCanonicalActivity(activityKey) : undefined;
  if (!def || !activityKey) {
    return <NotFoundPage />;
  }
  const domain = getDomainForActivity(activityKey);
  const protocol = getProtocolForActivity(activityKey);

  return (
    <ActivitySheet
      view={fromActivityDefinition(def, {
        knownActivityKeys: getCanonicalKeys(),
        pendingImportKeys: getUnresolvedReferences(),
        domain,
      })}
      guided={
        protocol ? (
          <ActivityGuidedSection protocol={protocol} activityKey={activityKey} />
        ) : undefined
      }
    />
  );
}
