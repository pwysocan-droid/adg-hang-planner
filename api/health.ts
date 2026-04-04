import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.ANTHROPIC_API_KEY ?? ''

  // Make a minimal real API call to see the exact error
  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Hi' }],
    }),
  })

  const json = await apiRes.json()

  res.json({
    http_status: apiRes.status,
    key_length: key.length,
    key_first_chars: key.slice(0, 14),
    key_last_chars: key.slice(-4),
    key_char_codes_start: Array.from(key.slice(0, 6)).map(c => c.charCodeAt(0)),
    api_response: json,
  })
}
