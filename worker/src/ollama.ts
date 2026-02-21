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

export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
): Promise<string> {
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