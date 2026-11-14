import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'

// Every test starts on Home; replaceState fires no hashchange that could land in the next test.
beforeEach(() => window.history.replaceState(null, '', '/'))
