import { useParams } from "react-router-dom";
import { getDemoActivity } from "../data/demoActivity";
import { fromDemoActivity } from "../activityViewModel";
import {
  getCanonicalActivity,
  getDomainForActivity,
} from "../../content/registry";
import { getProtocolForActivity } from "../../content/protocols/registry";
import { ActivitySheet } from "../components/ActivitySheet";
import { ActivityWorkView } from "../components/ActivityWorkView";
import { ContextNav } from "../components/ContextNav";
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
    <>
      <ContextNav domainKey={domain?.domainKey} activityKey={activityKey} />
      <ActivityWorkView def={def} domain={domain} protocol={protocol} />
    </>
  );
}
