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

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'

export async function chatCompletion(model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama error ${res.status}: ${text}`)
  }

  const data: ChatCompletionResponse = await res.json()
  return data.choices[0].message.content
}

export async function chatCompletionStream(
  model: string,
  messages: ChatMessage[],
  onToken: (token: string) => void,
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama error ${res.status}: ${text}`)
  }

  // Ollama returns SSE-formatted chunks: "data: {...}\n\n"
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
