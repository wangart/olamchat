interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: {
    message: { role: string; content: string }
    finish_reason: string
  }[]
}

const LLM_BASE_URL = process.env.LLM_BASE_URL!
const LLM_API_KEY = process.env.LLM_API_KEY ?? ''

export async function chatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LLM_API_KEY && { Authorization: `Bearer ${LLM_API_KEY}` }),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text}`)
  }

  const data: ChatCompletionResponse = await res.json()
  return data.choices[0].message.content
}

interface ChatOptions {
  temperature?: number
  maxTokens?: number
}

export async function chatCompletionStream(
  model: string,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  options: ChatOptions = {},
): Promise<string> {
  const res = await fetch(`${LLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LLM_API_KEY && { Authorization: `Bearer ${LLM_API_KEY}` }),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM error ${res.status}: ${text}`)
  }

  // SSE-formatted chunks: "data: {...}\n\n"
  // We read the response body as a stream and parse each chunk
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE format: each event is "data: <json>\n\n"
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6) // strip "data: "
      if (data === '[DONE]') continue

      const parsed = JSON.parse(data)
      const token = parsed.choices?.[0]?.delta?.content
      if (token) {
        fullContent += token
        onToken(token)
      }
    }
  }

  return fullContent
}
