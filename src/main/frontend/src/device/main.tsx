import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-700.css'
import '../ui/theme/tokens.css'
import '../ui/theme/base.css'
import './device.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DeviceLink } from '../infrastructure/DeviceLink'
import { WebSocketReadingSource } from '../infrastructure/WebSocketReadingSource'
import { DeviceScreen } from './DeviceScreen'
import type { DotFeed } from './DotFeed'
import { LinkFeed } from './LinkFeed'
import { ScenarioFeed } from './ScenarioFeed'
import { deviceRoute } from './deviceRoute'

// The firmware's topic (src/main/hardware/dot-display/src/Protocol.h), a placeholder until the backend publishes it.
const TOPIC = 'crew/a1/dot-display'

// One feed per page load, outside React, so StrictMode can't open two sockets.
function feedFor(route: ReturnType<typeof deviceRoute>): DotFeed | undefined {
  if (route === 'simulation') return new ScenarioFeed()
  if (route !== 'websocket') return undefined
  const link = new DeviceLink()
  return new LinkFeed(link, new WebSocketReadingSource(link, TOPIC))
}

const route = deviceRoute(window.location.pathname)
const feed = feedFor(route)
if (route) document.title = `Dot display · ${route}`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {feed ? <DeviceScreen feed={feed} /> : <p className="device-routes">Open /device/simulation or /device/websocket.</p>}
  </StrictMode>,
)
