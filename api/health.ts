import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const key = process.env.ANTHROPIC_API_KEY
  res.json({
    key_present: !!key,
    key_length: key?.length ?? 0,
    key_prefix: key ? key.slice(0, 10) + '...' : null,
    key_matches_pattern: key ? /^sk-ant-/.test(key) : false,
  })
}
