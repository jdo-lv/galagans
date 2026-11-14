import baselineJson from '../infrastructure/baseline.json'
import { resolveRules } from '../infrastructure/JsonRuleSource'
import ruleRows from '../infrastructure/rules.json'

/** The shipped rule rows as the app loads them, with COG-01 resolved against the pre-flight profile. */
export const RULES = resolveRules(ruleRows, baselineJson)
