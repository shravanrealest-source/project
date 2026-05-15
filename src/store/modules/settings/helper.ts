import { ss } from '@/utils/storage'

const LOCAL_NAME = 'settingsStorage'

export interface SettingsState {
  systemMessage: string
  temperature: number
  top_p: number
  contextLength: number
  totalCredits: number
  usedCreditsToday: number
  dailyMessageLimit: number
  costPerMessage: number
}

export function defaultSetting(): SettingsState {
  return {
    systemMessage: 'Act as a friendly marketing assistant for a Real Estate business. Focus on engagement and conversion.',
    temperature: 0.8,
    top_p: 1,
    contextLength: 5,
    totalCredits: 1000,
    usedCreditsToday: 0,
    dailyMessageLimit: 500,
    costPerMessage: 1,
  }
}

export function getLocalState(): SettingsState {
  const localSetting: SettingsState | undefined = ss.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: SettingsState): void {
  ss.set(LOCAL_NAME, setting)
}

export function removeLocalState() {
  ss.remove(LOCAL_NAME)
}
