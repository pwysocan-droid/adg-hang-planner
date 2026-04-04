import type { VercelRequest, VercelResponse } from '@vercel/node'

async function tryModel(key: string, model: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  })
  const json = await res.json()
  return { model, status: res.status, ok: res.ok, error: json.error?.message ?? null }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.ANTHROPIC_API_KEY ?? ''

  const results = await Promise.all([
    tryModel(key, 'claude-3-haiku-20240307'),
    tryModel(key, 'claude-3-5-haiku-20241022'),
    tryModel(key, 'claude-3-5-sonnet-20241022'),
    tryModel(key, 'claude-sonnet-4-6'),
    tryModel(key, 'claude-opus-4-6'),
  ])

  res.json({ key_prefix: key.slice(0, 14), results })
}
