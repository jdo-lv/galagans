import { useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { CheckInForm } from "./CheckInForm";
import { HazardLens } from "./HazardLens";
import { LatestReadings } from "./LatestReadings";
import { StatusBar } from "./StatusBar";
import { SystemDetail } from "./SystemDetail";
import { SystemStatusList } from "./SystemStatusList";
import { useServices } from "./ServicesContext";
import { useHashRoute } from "./useHashRoute";
import { useHazardLens } from "./useHazardLens";
import { useLatestReadings } from "./useLatestReadings";
import { useOnlineStatus } from "./useOnlineStatus";
import { usePendingCount } from "./usePendingCount";
import { useSystemStatuses } from "./useSystemStatuses";

export function App() {
  const { recorder } = useServices();
  const online = useOnlineStatus();
  const { pending, refresh } = usePendingCount();
  const statuses = useSystemStatuses();
  const readings = useLatestReadings();
  const { route, returnedHome, goHome } = useHashRoute();
  const lens = useHazardLens();

  useEffect(() => {
    if (route.kind === "unknown") goHome();
  }, [route, goHome]);

  return (
    <div className="app">
      <AppHeader />
      <StatusBar online={online} pending={pending} />
      {route.kind === "system" ? (
        <main>
          <SystemDetail
            key={route.system}
            system={route.system}
            onUnknown={goHome}
          />
        </main>
      ) : (
        <main className="layout">
          <SystemStatusList
            state={statuses.state}
            focusHeading={returnedHome}
            lens={lens.selected}
          />
          <HazardLens selected={lens.selected} onToggle={lens.toggle} />
          <div className="stack">
            <LatestReadings state={readings.state} />
            <section className="card" aria-labelledby="checkin-heading">
              <h2 id="checkin-heading" className="card-heading">
                Check-in
              </h2>
              <CheckInForm
                onSubmit={async (draft) => {
                  await recorder.record(draft);
                  refresh();
                  statuses.refresh();
                  readings.refresh();
                }}
              />
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
