import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.ANTHROPIC_API_KEY ?? ''

  const modelsRes = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
  })

  const modelsJson = await modelsRes.json()

  res.json({
    key_prefix: key.slice(0, 14),
    models_status: modelsRes.status,
    models: modelsJson,
  })
}
