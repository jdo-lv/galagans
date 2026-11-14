import { useCallback, useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { CheckInForm } from "./CheckInForm";
import { GroundLinkPill } from "./GroundLinkPill";
import { HazardLens } from "./HazardLens";
import { LatestReadings } from "./LatestReadings";
import { PvtCard } from "./PvtCard";
import { PvtTest } from "./PvtTest";
import { StatusBar } from "./StatusBar";
import { SurgeonPacket } from "./SurgeonPacket";
import { SystemDetail } from "./SystemDetail";
import { SystemStatusList } from "./SystemStatusList";
import { TodaysRoutine } from "./TodaysRoutine";
import { useServices } from "./ServicesContext";
import { useHashRoute } from "./useHashRoute";
import { useHazardLens } from "./useHazardLens";
import { useLatestReadings } from "./useLatestReadings";
import { useOnlineStatus } from "./useOnlineStatus";
import { usePendingCount } from "./usePendingCount";
import { usePeriodicRead } from "./usePeriodicRead";
import { useSystemStatuses } from "./useSystemStatuses";

export function App() {
  const { recorder, routineReader } = useServices();
  const online = useOnlineStatus();
  const { pending, refresh } = usePendingCount();
  const statuses = useSystemStatuses();
  const readings = useLatestReadings();
  const routine = usePeriodicRead(routineReader);
  const { route, returnedHome, goHome } = useHashRoute();
  const lens = useHazardLens();

  useEffect(() => {
    if (route.kind === "unknown") goHome();
  }, [route, goHome]);

  const refreshAll = useCallback(() => {
    refresh();
    statuses.refresh();
    readings.refresh();
    routine.refresh();
  }, [refresh, statuses.refresh, readings.refresh, routine.refresh]);

  return (
    <div className="app">
      <AppHeader />
      <div className="pill-row">
        <StatusBar online={online} pending={pending} />
        <GroundLinkPill current={route.kind === "packet"} />
      </div>
      {route.kind === "packet" ? (
        <main>
          <SurgeonPacket />
        </main>
      ) : route.kind === "pvt" ? (
        <main>
          <PvtTest onSaved={refreshAll} />
        </main>
      ) : route.kind === "system" ? (
        <main>
          <SystemDetail
            key={route.system}
            system={route.system}
            onUnknown={goHome}
          />
        </main>
      ) : (
        <main className="layout layout--home">
          <SystemStatusList
            state={statuses.state}
            focusHeading={returnedHome}
            lens={lens.selected}
          />
          <HazardLens
            selected={lens.selected}
            onToggle={lens.toggle}
            statuses={statuses.state}
          />
          <div className="stack">
            <TodaysRoutine
              state={routine.state}
              onStart={() =>
                document
                  .querySelector<HTMLInputElement>('input[name="heartRate"]')
                  ?.focus()
              }
            />
            <LatestReadings state={readings.state} />
            <PvtCard />
            <section className="card" aria-labelledby="checkin-heading">
              <h2 id="checkin-heading" className="card-heading">
                Check-in
              </h2>
              <CheckInForm
                onSubmit={async (draft) => {
                  await recorder.record(draft);
                  refreshAll();
                }}
              />
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
