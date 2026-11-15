import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/dm-mono/latin-300.css'
import '@fontsource/dm-mono/latin-400.css'
import '../ui/theme/tokens.css'
import '../ui/theme/base.css'
import '../device/device.css'
import './simulator.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LinkFeed } from '../device/LinkFeed'
import baselineJson from '../infrastructure/baseline.json'
import { DeviceLink } from '../infrastructure/DeviceLink'
import { resolveRules } from '../infrastructure/JsonRuleSource'
import ruleRows from '../infrastructure/rules.json'
import { WebSocketReadingSource } from '../infrastructure/WebSocketReadingSource'
import { SimulatorApp } from './SimulatorApp'
import { WebSocketPublisher } from './WebSocketPublisher'

// One link per page load, outside React, so StrictMode can't open two sockets.
const link = new DeviceLink()
const publisher = new WebSocketPublisher(link)
const source = new WebSocketReadingSource(link, 'crew/a1/dot-display')
const display = { source, feed: new LinkFeed(link, source) }
const rules = resolveRules(ruleRows, baselineJson)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimulatorApp publisher={publisher} rules={rules} display={display} />
  </StrictMode>,
)
