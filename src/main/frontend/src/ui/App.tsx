import { useCallback, useEffect } from "react";
import { AddEntryScreen } from "./AddEntryScreen";
import { AppHeader } from "./AppHeader";
import { CheckInScreen } from "./CheckInScreen";
import { GroundLinkPill } from "./GroundLinkPill";
import { HazardLens } from "./HazardLens";
import { LatestReadings } from "./LatestReadings";
import { NavBar } from "./NavBar";
import { PvtCard } from "./PvtCard";
import { PvtTest } from "./PvtTest";
import { StatisticsScreen } from "./StatisticsScreen";
import { StatusBar } from "./StatusBar";
import { SurgeonPacket } from "./SurgeonPacket";
import { SystemDetail } from "./SystemDetail";
import { SystemStatusList } from "./SystemStatusList";
import { TodaysRoutine } from "./TodaysRoutine";
import { VoicePill, VoiceToggle } from "./VoiceToggle";
import { useServices } from "./ServicesContext";
import { CHECK_IN_HASH, useHashRoute, voiceHref } from "./useHashRoute";
import { useHazardLens } from "./useHazardLens";
import { useLatestReadings } from "./useLatestReadings";
import { useOnlineStatus } from "./useOnlineStatus";
import { usePendingCount } from "./usePendingCount";
import { usePeriodicRead } from "./usePeriodicRead";
import { useSystemStatuses } from "./useSystemStatuses";
import { useVoice } from "./useVoice";
import type { VoiceTarget } from "../domain/voice";
import type { StatusListState } from "./useSystemStatuses";

export function App() {
  const { routineReader, healthGateway } = useServices();
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

  useEffect(() => healthGateway.subscribe(refreshAll), [healthGateway, refreshAll]);

  // Like the Body systems list, only a flagged system has a detail screen to open (F5).
  const openByVoice = useCallback(
    (target: VoiceTarget) => {
      if (target.screen === "system" && !hasDetail(statuses.state, target.system)) return;
      window.location.hash = voiceHref(target);
    },
    [statuses.state],
  );
  const voice = useVoice(openByVoice, refreshAll);
  const stopVoice = voice.stop;

  // Voice must never talk during the timed reaction test, however it was opened.
  useEffect(() => {
    if (route.kind === "pvt") stopVoice();
  }, [route.kind, stopVoice]);

  return (
    <div className="app">
      <AppHeader actions={<VoiceToggle status={voice.status} onToggle={voice.toggle} disabled={route.kind === "pvt"} />} />
      <div className="pill-row">
        <StatusBar online={online} pending={pending} />
        <GroundLinkPill current={route.kind === "packet"} />
        <VoicePill status={voice.status} />
      </div>
      {route.kind === "check-in" ? (
        <main>
          <CheckInScreen
            onSaved={refreshAll}
            onExit={() => goHome({ returned: true })}
          />
        </main>
      ) : route.kind === "packet" ? (
        <main>
          <SurgeonPacket />
        </main>
      ) : route.kind === "statistics" ? (
        <main>
          <StatisticsScreen />
        </main>
      ) : route.kind === "add" ? (
        <main>
          <AddEntryScreen />
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
              onStart={() => {
                window.location.hash = CHECK_IN_HASH;
              }}
            />
            <LatestReadings state={readings.state} />
            <PvtCard />
          </div>
        </main>
      )}
      {/* Like voice, the bar stays off the timed reaction test: a stray tap would end it. */}
      {route.kind !== "pvt" && <NavBar current={route.kind} />}
    </div>
  );
}

function hasDetail(state: StatusListState, system: string): boolean {
  return state.kind === "ready" && state.data.some((s) => s.system === system && s.rule !== undefined);
}
