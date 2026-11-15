/**
 * Build-time demo switches (Vite env vars, fixed at build). DEMO_MODE (on unless `VITE_DEMO_MODE=false`): 1-minute
 * detail chart and 10-minute device-reading retention. MOCK_MODE (`VITE_MOCK_MODE=true`, the Pages build): device
 * readings come from an in-browser feed instead of the device link. Only container.ts reads them.
 */
export function parseModes(env: Record<string, unknown>): { demo: boolean; mock: boolean } {
  return { demo: env.VITE_DEMO_MODE !== 'false', mock: env.VITE_MOCK_MODE === 'true' }
}

const modes = parseModes(import.meta.env)

export const DEMO_MODE = modes.demo
export const MOCK_MODE = modes.mock
