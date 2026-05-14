import * as dotenv from 'dotenv'
import 'isomorphic-fetch'
import type { ChatGPTAPIOptions, ChatMessage, SendMessageOptions } from 'chatgpt'
import { ChatGPTAPI } from 'chatgpt'
import { SocksProxyAgent } from 'socks-proxy-agent'
import httpsProxyAgent from 'https-proxy-agent'
import fetch from 'node-fetch'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { ApiModel, ChatContext, ModelConfig } from '../types'
import type { RequestOptions, SetProxyOptions, UsageResponse } from './types'

const { HttpsProxyAgent } = httpsProxyAgent

dotenv.config()

const ErrorCodeMessage: Record<string, string> = {
  401: '[OpenAI] 提供错误的API密钥 | Incorrect API key provided',
  403: '[OpenAI] 服务器拒绝访问，请稍后再试 | Server refused to access, please try again later',
  502: '[OpenAI] 错误的网关 |  Bad Gateway',
  503: '[OpenAI] 服务器繁忙，请稍后再试 | Server is busy, please try again later',
  504: '[OpenAI] 网关超时 | Gateway Time-out',
  500: '[OpenAI] 服务器繁忙，请稍后再试 | Internal Server Error',
}

const timeoutMs: number = !isNaN(+process.env.TIMEOUT_MS) ? +process.env.TIMEOUT_MS : 100 * 1000
const disableDebug: boolean = process.env.OPENAI_API_DISABLE_DEBUG === 'true'

let apiModel: ApiModel
const model = isNotEmptyString(process.env.OPENAI_API_MODEL) ? process.env.OPENAI_API_MODEL : 'gpt-3.5-turbo'

if (!isNotEmptyString(process.env.OPENAI_API_KEY))
  throw new Error('Missing OPENAI_API_KEY environment variable. Set your OpenRouter API key in service/.env')

let api: ChatGPTAPI

(async () => {
  // OpenRouter-compatible API-key mode only.
  // Unofficial proxy / accessToken path has been intentionally removed.
  const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL

  const options: ChatGPTAPIOptions = {
    apiKey: process.env.OPENAI_API_KEY,
    completionParams: { model },
    debug: !disableDebug,
  }

  // Resolve base URL.
  // The chatgpt library appends /chat/completions to apiBaseUrl, so we must
  // never have a trailing slash. For OpenRouter the URL already contains /v1;
  // for Gemini it contains /v1beta/openai — both are passed through as-is
  // after stripping the trailing slash.
  if (isNotEmptyString(OPENAI_API_BASE_URL)) {
    const stripped = OPENAI_API_BASE_URL.replace(/\/$/, '')
    options.apiBaseUrl = stripped.includes('/v1')
      ? stripped
      : `${stripped}/v1`
  }

  // Inject OpenRouter-required headers via a custom fetch wrapper
  setupProxy(options)

  api = new ChatGPTAPI({ ...options })
  apiModel = 'ChatGPTAPI'
})()

async function chatReplyProcess(options: RequestOptions) {
  const { message, lastContext, process, systemMessage, temperature, top_p } = options
  try {
    const options: SendMessageOptions = { timeoutMs }

    options.completionParams = { model, temperature, top_p, presence_penalty: 0, frequency_penalty: 0 }

    if (lastContext != null)
      options.parentMessageId = lastContext.parentMessageId

    const response = await api.sendMessage(message, {
      ...options,
      onProgress: (partialResponse) => {
        process?.(partialResponse)
      },
    })

    return sendResponse({ type: 'Success', data: response })
  }
  catch (error: any) {
    const code = error.statusCode
    global.console.log(error)
    if (Reflect.has(ErrorCodeMessage, code))
      return sendResponse({ type: 'Fail', message: ErrorCodeMessage[code] })
    return sendResponse({ type: 'Fail', message: error.message ?? 'Please check the back-end console' })
  }
}

async function fetchUsage() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL

  if (!isNotEmptyString(OPENAI_API_KEY))
    return Promise.resolve('-')

  const API_BASE_URL = isNotEmptyString(OPENAI_API_BASE_URL)
    ? OPENAI_API_BASE_URL
    : 'https://api.openai.com'

  const [startDate, endDate] = formatDate()

  // 每月使用量
  const urlUsage = `${API_BASE_URL}/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`

  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const options = {} as SetProxyOptions

  setupProxy(options)

  try {
    // 获取已使用量
    const useResponse = await options.fetch(urlUsage, { headers })
    if (!useResponse.ok)
      throw new Error('获取使用量失败')
    const usageData = await useResponse.json() as UsageResponse
    const usage = Math.round(usageData.total_usage) / 100
    return Promise.resolve(usage ? `$${usage}` : '-')
  }
  catch (error) {
    global.console.log(error)
    return Promise.resolve('-')
  }
}

function formatDate(): string[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const lastDay = new Date(year, month, 0)
  const formattedFirstDay = `${year}-${month.toString().padStart(2, '0')}-01`
  const formattedLastDay = `${year}-${month.toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`
  return [formattedFirstDay, formattedLastDay]
}

async function chatConfig() {
  const usage = await fetchUsage()
  const reverseProxy = process.env.API_REVERSE_PROXY ?? '-'
  const httpsProxy = (process.env.HTTPS_PROXY || process.env.ALL_PROXY) ?? '-'
  const socksProxy = (process.env.SOCKS_PROXY_HOST && process.env.SOCKS_PROXY_PORT)
    ? (`${process.env.SOCKS_PROXY_HOST}:${process.env.SOCKS_PROXY_PORT}`)
    : '-'
  return sendResponse<ModelConfig>({
    type: 'Success',
    data: { apiModel, reverseProxy, timeoutMs, socksProxy, httpsProxy, usage },
  })
}

function setupProxy(options: SetProxyOptions) {
  const isOpenRouter = process.env.OPENAI_API_BASE_URL?.includes('openrouter.ai')
  const openRouterHeaders = isOpenRouter
    ? {
        'HTTP-Referer': 'https://github.com/Chanzhaoyu/chatgpt-web',
        'X-Title': 'ChatGPT Web',
      }
    : {}

  // Centralized body modification (Persona + Penalties)
  const modifyBody = (bodyStr: string) => {
    try {
      const body = JSON.parse(bodyStr)
      const STRICT_PERSONA = 'You are a WhatsApp Marketing Expert. You ONLY provide advice on WhatsApp marketing, bulk messaging, lead generation, and customer engagement. If a user asks about any other topic—including politics, world leaders (like the US President), cooking, or general history—politely decline and state that you are only programmed for WhatsApp Marketing support.'
      
      // Force Persona
      if (body.messages && Array.isArray(body.messages)) {
        const systemMsg = body.messages.find((m: any) => m.role === 'system')
        if (systemMsg)
          systemMsg.content = STRICT_PERSONA
        else
          body.messages.unshift({ role: 'system', content: STRICT_PERSONA })
      }

      // Strip Penalties (Gemini compatibility)
      if (body.presence_penalty !== undefined) delete body.presence_penalty
      if (body.frequency_penalty !== undefined) delete body.frequency_penalty
      
      return JSON.stringify(body)
    }
    catch (e) {
      return bodyStr
    }
  }

  if (isNotEmptyString(process.env.SOCKS_PROXY_HOST) && isNotEmptyString(process.env.SOCKS_PROXY_PORT)) {
    const agent = new SocksProxyAgent({
      hostname: process.env.SOCKS_PROXY_HOST,
      port: process.env.SOCKS_PROXY_PORT,
      userId: isNotEmptyString(process.env.SOCKS_PROXY_USERNAME) ? process.env.SOCKS_PROXY_USERNAME : undefined,
      password: isNotEmptyString(process.env.SOCKS_PROXY_PASSWORD) ? process.env.SOCKS_PROXY_PASSWORD : undefined,
    })
    options.fetch = (url, opts) => {
      const finalOpts = { ...opts, body: opts?.body ? modifyBody(opts.body.toString()) : opts?.body }
      const merged = { ...finalOpts, headers: { ...(finalOpts as any)?.headers, ...openRouterHeaders } }
      return fetch(url, { agent, ...merged })
    }
  }
  else if (isNotEmptyString(process.env.HTTPS_PROXY) || isNotEmptyString(process.env.ALL_PROXY)) {
    const httpsProxy = process.env.HTTPS_PROXY || process.env.ALL_PROXY
    if (httpsProxy) {
      const agent = new HttpsProxyAgent(httpsProxy)
      options.fetch = (url, opts) => {
        const finalOpts = { ...opts, body: opts?.body ? modifyBody(opts.body.toString()) : opts?.body }
        const merged = { ...finalOpts, headers: { ...(finalOpts as any)?.headers, ...openRouterHeaders } }
        return fetch(url, { agent, ...merged })
      }
    }
  }
  else {
    options.fetch = (url, opts) => {
      const finalOpts = { ...opts, body: opts?.body ? modifyBody(opts.body.toString()) : opts?.body }
      const merged = { ...finalOpts, headers: { ...(finalOpts as any)?.headers, ...openRouterHeaders } }
      return fetch(url, { ...merged })
    }
  }
}

function currentModel(): ApiModel {
  return apiModel
}

export type { ChatContext, ChatMessage }

export { chatReplyProcess, chatConfig, currentModel }
