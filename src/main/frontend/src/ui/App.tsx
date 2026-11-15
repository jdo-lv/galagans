import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { AddEntryScreen } from "./AddEntryScreen";
import { AppHeader } from "./AppHeader";
import { CheckInScreen } from "./CheckInScreen";
import { GroundHistory } from "./GroundHistory";
import { GroundLinkPill } from "./GroundLinkPill";
import { HomeScreen } from "./HomeScreen";
import { NavBar } from "./NavBar";
import { PvtTest } from "./PvtTest";
import { ScreenLayout, SideContextProvider } from "./ScreenLayout";
import { StatsScreen } from "./StatsScreen";
import { StatusBar } from "./StatusBar";
import { SurgeonPacket } from "./SurgeonPacket";
import { SymptomLogScreen } from "./SymptomLogScreen";
import { SystemDetail } from "./SystemDetail";
import { VoicePill, VoiceToggle } from "./VoiceToggle";
import { useServices } from "./ServicesContext";
import { CHECK_IN_HASH, useHashRoute, voiceHref, type Route } from "./useHashRoute";
import { useHazardLens } from "./useHazardLens";
import { useLatestReadings } from "./useLatestReadings";
import { useOnlineStatus } from "./useOnlineStatus";
import { usePendingCount } from "./usePendingCount";
import { usePeriodicRead } from "./usePeriodicRead";
import { useSystemStatuses } from "./useSystemStatuses";
import { useVoice, type CheckInAccess } from "./useVoice";
import type { CheckInForm } from "../domain/ports";
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
  // The check-in screen registers its form while a question shows; voice reads and moves it (#64).
  const checkInForm = useRef<CheckInForm | undefined>(undefined);
  const formWaiters = useRef<((form: CheckInForm) => void)[]>([]);
  const registerForm = useCallback((form: CheckInForm | undefined) => {
    checkInForm.current = form;
    if (form) formWaiters.current.splice(0).forEach((resolve) => resolve(form));
  }, []);
  const checkInAccess = useMemo<CheckInAccess>(
    () => ({
      form: () => checkInForm.current,
      open: () => {
        if (window.location.hash === CHECK_IN_HASH) return Promise.resolve(checkInForm.current);
        return new Promise((resolve) => {
          formWaiters.current.push(resolve);
          window.location.hash = voiceHref({ screen: "check-in" });
        });
      },
    }),
    [],
  );
  const voice = useVoice(openByVoice, checkInAccess);
  const stopVoice = voice.stop;

  // Voice must never talk during the timed reaction test, however it was opened.
  useEffect(() => {
    if (route.kind === "pvt") stopVoice();
  }, [route.kind, stopVoice]);

  // Screens without side content of their own fill the main panel; the shell still gives them the pills.
  const single = (screen: ReactNode) => <ScreenLayout primary={screen} />;

  function screenFor(route: Route): ReactNode {
    switch (route.kind) {
      case "check-in":
        return single(
          <CheckInScreen
            onSaved={refreshAll}
            onExit={() => goHome({ returned: true })}
            onTouchSaved={stopVoice}
            registerForm={registerForm}
          />,
        );
      case "packet":
        return <SurgeonPacket />;
      case "stats":
        return <StatsScreen statuses={statuses.state} lens={lens.selected} onToggleHazard={lens.toggle} />;
      case "add":
        return single(<AddEntryScreen />);
      case "symptoms":
        return single(<SymptomLogScreen />);
      case "ground":
        return single(<GroundHistory />);
      case "pvt":
        return single(<PvtTest onSaved={refreshAll} />);
      case "system":
        return <SystemDetail key={route.system} system={route.system} onUnknown={goHome} />;
      default:
        return (
          <HomeScreen
            statuses={statuses.state}
            readings={readings.state}
            routine={routine.state}
            returnedHome={returnedHome}
            onCheckInSaved={refreshAll}
          />
        );
    }
  }

  return (
    <div className="app">
      <AppHeader actions={<VoiceToggle status={voice.status} onToggle={voice.toggle} disabled={route.kind === "pvt"} />} />
      <SideContextProvider
        pills={
          <>
            <StatusBar online={online} pending={pending} />
            <GroundLinkPill current={route.kind === "packet"} />
            <VoicePill status={voice.status} />
          </>
        }
      >
        <main className="app-body">{screenFor(route)}</main>
      </SideContextProvider>
      {/* Like voice, the bar stays off the timed reaction test: a stray tap would end it. */}
      {route.kind !== "pvt" && <NavBar current={route.kind} />}
    </div>
  );
}

function hasDetail(state: StatusListState, system: string): boolean {
  return state.kind === "ready" && state.data.some((s) => s.system === system && s.rule !== undefined);
}
