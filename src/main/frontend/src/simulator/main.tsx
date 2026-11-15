import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/dm-mono/latin-300.css'
import '@fontsource/dm-mono/latin-400.css'
import '../ui/theme/tokens.css'
import '../ui/theme/base.css'
import './simulator.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import baselineJson from '../infrastructure/baseline.json'
import { DeviceLink } from '../infrastructure/DeviceLink'
import { resolveRules } from '../infrastructure/JsonRuleSource'
import ruleRows from '../infrastructure/rules.json'
import { SimulatorApp } from './SimulatorApp'
import { WebSocketPublisher } from './WebSocketPublisher'

// One link per page load, outside React, so StrictMode can't open two sockets.
const publisher = new WebSocketPublisher(new DeviceLink())
const rules = resolveRules(ruleRows, baselineJson)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimulatorApp publisher={publisher} rules={rules} />
  </StrictMode>,
)
