import { ss } from '@/utils/storage'

const LOCAL_NAME = 'promptStore'

export interface PromptInfo {
  key: string
  value: string
}

export type PromptList = PromptInfo[]

export interface PromptStore {
  promptList: PromptList
}

export function getLocalPromptList(): PromptStore {
  const promptStore: PromptStore | undefined = ss.get(LOCAL_NAME)
  const defaultPromptList: PromptList = [
    {
      key: 'upload',
      value: 'I have a customer lead list. What is the best way to format and upload this data for a WhatsApp campaign to ensure high delivery rates?',
    },
    {
      key: 'promo',
      value: 'Help me create a compelling WhatsApp promotion message. Include a hook, a limited-time offer, emojis, and a clear Call to Action (CTA).',
    },
    {
      key: 'send',
      value: 'I am ready to send my promotion. What are the current best practices to avoid my WhatsApp number getting flagged or banned during bulk sending?',
    },
  ]
  return promptStore ?? { promptList: defaultPromptList }
}

export function setLocalPromptList(promptStore: PromptStore): void {
  ss.set(LOCAL_NAME, promptStore)
}
