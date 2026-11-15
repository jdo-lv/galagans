import {
  createReactComponent,
  IconAlertOctagon,
  IconAlertTriangle,
  IconApple,
  IconArrowBarToDown,
  IconArrowRight,
  IconBiohazard,
  IconBone,
  IconBottle,
  IconBrain,
  IconCalendarEvent,
  IconCamera,
  IconChartBar,
  IconChartLine,
  IconChevronRight,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleFilled,
  IconClipboardList,
  IconClock,
  IconCloudOff,
  IconDeviceWatch,
  IconDots,
  IconDroplet,
  IconEar,
  IconEye,
  IconFirstAidKit,
  IconGauge,
  IconGift,
  IconHeart,
  IconHeartbeat,
  IconMan,
  IconMist,
  IconInfoCircle,
  IconLock,
  IconLungs,
  IconMoodSadDizzy,
  IconMoodSick,
  IconMoodSmile,
  IconMicrophone,
  IconMoon,
  IconPencil,
  IconPill,
  IconPlayerPause,
  IconPlus,
  IconRadioactive,
  IconRefresh,
  IconReportMedical,
  IconRun,
  IconSatellite,
  IconScale,
  IconSend,
  IconShieldCheck,
  IconStethoscope,
  IconStopwatch,
  IconSun,
  IconTemperaturePlus,
  IconThermometer,
  IconTrendingDown,
  IconTrendingUp,
  IconUser,
  IconUsersGroup,
  IconWind,
  IconWorld,
  IconZzz,
  type IconProps,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'

// The app's icon vocabulary (ideas/ui-guidelines.md §5 "Icons"): Tabler outline icons named by what they mean here,
// one icon per meaning. Line weight comes from CSS (--icon-stroke). Every icon is decorative: a word or label carries the meaning.
export type AppIcon = ComponentType<IconProps>

function decorative(Svg: AppIcon): AppIcon {
  const Decorative = (props: IconProps) => <Svg size={22} aria-hidden="true" focusable="false" {...props} />
  return Decorative
}

// Drawn on the design canvas (research/Health Palette Prototype.html, body-system ring) because Tabler has no kidney or stomach.
const IconKidneys = /* @__PURE__ */ createReactComponent('outline', 'kidneys', 'Kidneys', [
  ['path', { d: 'M9 6C6 6 4 9 4 12s1.5 6 4 6c2 0 2.5-2 2-3.5s-1-1.5-1-2.5 1-1.5 1-3 0-3-1-3z', key: 'svg-0' }],
  ['path', { d: 'M15 6c3 0 5 3 5 6s-1.5 6-4 6c-2 0-2.5-2-2-3.5s1-1.5 1-2.5-1-1.5-1-3 0-3 1-3z', key: 'svg-1' }],
])

const IconStomach = /* @__PURE__ */ createReactComponent('outline', 'stomach', 'Stomach', [
  ['path', { d: 'M9 3v4a3 3 0 0 0 3 3h1a5 5 0 0 1 5 5 6 6 0 0 1-6 6H9a4 4 0 0 1-4-4v-1', key: 'svg-0' }],
  ['path', { d: 'M9 17c1.5 0 3-1 3-3', key: 'svg-1' }],
])

// Canvas SpO₂ mark: a drop with "O2". Not built with createReactComponent because it needs a text node.
function IconSpo2({ size = 24, stroke = 2, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['tabler-icon', 'tabler-icon-spo2', className].filter(Boolean).join(' ')}
      {...props}
    >
      <path d="M10 3s-6 7-6 11a6 6 0 0 0 9 5.2" />
      <text x="13.5" y="19.5" fontSize="7.5" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Inter, sans-serif">
        O2
      </text>
    </svg>
  )
}

/* Status (never the only cue: always with the status word) */
export const NominalIcon = /* @__PURE__ */ decorative(IconCircleCheck)
export const TodoIcon = /* @__PURE__ */ decorative(IconPencil)
/** Level icons (ideas/alert-levels.md "Icon" column). Watch's arrow follows its rule's direction. */
export const LevelWatchUpIcon = /* @__PURE__ */ decorative(IconTrendingUp)
export const LevelWatchDownIcon = /* @__PURE__ */ decorative(IconTrendingDown)
export const LevelCheckIcon = /* @__PURE__ */ decorative(IconAlertTriangle)
export const LevelTreatIcon = /* @__PURE__ */ decorative(IconFirstAidKit)
export const LevelEmergencyIcon = /* @__PURE__ */ decorative(IconAlertOctagon)
export const InfoIcon = /* @__PURE__ */ decorative(IconInfoCircle)
export const DataAgeIcon = /* @__PURE__ */ decorative(IconClock)
export const NoDataIcon = /* @__PURE__ */ decorative(IconCircleDashed)

/* Body systems */
export const CognitionIcon = /* @__PURE__ */ decorative(IconBrain)
export const RespiratoryIcon = /* @__PURE__ */ decorative(IconLungs)
export const CardiovascularIcon = /* @__PURE__ */ decorative(IconHeart)
export const KidneyIcon = /* @__PURE__ */ decorative(IconKidneys)
export const DigestionIcon = /* @__PURE__ */ decorative(IconStomach)
export const BoneMuscleIcon = /* @__PURE__ */ decorative(IconBone)
export const VisionIcon = /* @__PURE__ */ decorative(IconEye)
export const HearingIcon = /* @__PURE__ */ decorative(IconEar)
export const ImmuneIcon = /* @__PURE__ */ decorative(IconShieldCheck)
export const SleepIcon = /* @__PURE__ */ decorative(IconZzz)
export const HydrationIcon = /* @__PURE__ */ decorative(IconDroplet)

/* Readings, devices and inputs */
export const HeartRateIcon = /* @__PURE__ */ decorative(IconHeartbeat)
export const Spo2Icon = /* @__PURE__ */ decorative(IconSpo2)
export const BloodPressureIcon = /* @__PURE__ */ decorative(IconGauge)
export const TemperatureIcon = /* @__PURE__ */ decorative(IconThermometer)
export const HumidityIcon = /* @__PURE__ */ decorative(IconMist)
export const BodyMassIcon = /* @__PURE__ */ decorative(IconScale)
export const BraceletIcon = /* @__PURE__ */ decorative(IconDeviceWatch)
export const CameraIcon = /* @__PURE__ */ decorative(IconCamera)
export const MoodIcon = /* @__PURE__ */ decorative(IconMoodSmile)
export const PvtIcon = /* @__PURE__ */ decorative(IconStopwatch)
export const QuestionnaireIcon = /* @__PURE__ */ decorative(IconClipboardList)
export const SymptomIcon = /* @__PURE__ */ decorative(IconReportMedical)
export const NauseaIcon = /* @__PURE__ */ decorative(IconMoodSick)
export const DizzinessIcon = /* @__PURE__ */ decorative(IconMoodSadDizzy)
export const FeverIcon = /* @__PURE__ */ decorative(IconTemperaturePlus)
export const FluidsIcon = /* @__PURE__ */ decorative(IconBottle)
export const FoodIcon = /* @__PURE__ */ decorative(IconApple)
export const MedicationIcon = /* @__PURE__ */ decorative(IconPill)
export const ExerciseIcon = /* @__PURE__ */ decorative(IconRun)

/* Hazards (NASA HRP five hazards, hazard lens) */
export const RadiationIcon = /* @__PURE__ */ decorative(IconRadioactive)
export const IsolationIcon = /* @__PURE__ */ decorative(IconUsersGroup)
export const DistanceFromEarthIcon = /* @__PURE__ */ decorative(IconWorld)
export const GravityIcon = /* @__PURE__ */ decorative(IconArrowBarToDown)
export const HostileEnvironmentIcon = /* @__PURE__ */ decorative(IconBiohazard)
export const CabinAirIcon = /* @__PURE__ */ decorative(IconWind)

/* People, ground and app */
export const CrewIcon = /* @__PURE__ */ decorative(IconUser)
export const CmoIcon = /* @__PURE__ */ decorative(IconStethoscope)
export const GroundLinkIcon = /* @__PURE__ */ decorative(IconSatellite)
export const SendIcon = /* @__PURE__ */ decorative(IconSend)
export const ConferenceIcon = /* @__PURE__ */ decorative(IconCalendarEvent)
export const TrendIcon = /* @__PURE__ */ decorative(IconChartLine)
export const PrivateIcon = /* @__PURE__ */ decorative(IconLock)
export const OfflineIcon = /* @__PURE__ */ decorative(IconCloudOff)
export const SyncIcon = /* @__PURE__ */ decorative(IconRefresh)
/** "Opens the detail" on a list row. */
export const ChevronIcon = /* @__PURE__ */ decorative(IconChevronRight)
/** Timeline steps (surgeon packet). Done is a filled dot, not a check, so it can't be read as the ✓ of Nominal. */
export const StepDoneIcon = /* @__PURE__ */ decorative(IconCircleFilled)
export const StepCurrentIcon = /* @__PURE__ */ decorative(IconArrowRight)
export const StepPendingIcon = /* @__PURE__ */ decorative(IconDots)
/** A streak day paused for sickness or rest (#40). */
export const PausedIcon = /* @__PURE__ */ decorative(IconPlayerPause)
export const LightThemeIcon = /* @__PURE__ */ decorative(IconSun)
export const DarkThemeIcon = /* @__PURE__ */ decorative(IconMoon)
export const VoiceIcon = /* @__PURE__ */ decorative(IconMicrophone)
/** Navigation bar (#57): Home (the crew member, as on the wireframe), Stats, the centre + and Rewards; Ground reuses GroundLinkIcon. */
export const HomeIcon = /* @__PURE__ */ decorative(IconMan)
export const StatisticsIcon = /* @__PURE__ */ decorative(IconChartBar)
export const AddEntryIcon = /* @__PURE__ */ decorative(IconPlus)
export const RewardsIcon = /* @__PURE__ */ decorative(IconGift)
