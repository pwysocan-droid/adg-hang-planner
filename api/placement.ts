import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
  }

  const { works, room, locked = [] } = req.body

  if (!works || !Array.isArray(works) || works.length === 0) {
    return res.status(400).json({ error: 'No works provided' })
  }

  const lockedSection = locked.length > 0
    ? `\nLOCKED PLACEMENTS (do not move these):\n${JSON.stringify(locked, null, 2)}\n`
    : ''

  const prompt = `
GALLERY SPACE:
${JSON.stringify(room, null, 2)}
${lockedSection}
WORKS TO PLACE:
${works.map((w: { id: string; title: string; widthIn: number; heightIn: number }) =>
  `- ${w.id}: "${w.title}", ${w.widthIn}" × ${w.heightIn}"`
).join('\n')}

RULES:
- 57-inch (4.75 ft) eye level = center height for all works
- Minimum 10 inches clear between frames
- Minimum 6 inches from wall edges and door openings
- Largest or most tonally dominant work anchors the south wall center
- Distribute visual weight — avoid clustering similar tones
- Column face suits a single powerful close-up (intimate, discovered)
- Works wider than 30" need panels wider than their width + 12"
- x values are positions along each wall in feet from left edge
- South wall: x=0 is west end, x=19.33 is east end
- East wall: x=0 is south end, x=9.5 is north end (avoid x>9.5 — window zone)
- West wall: x=0 is south end, x=10 is north end
- Column: x=0 is west end of column face, x=6.1 is east end
- North-left: x=0 is west end, x=3.3 is east end
- North-right: x=0 is left end (at 15.9ft from west), x=3.43 is right end

Return exactly:
{
  "placements": [
    { "imageId": "<id>", "wall": "south"|"east"|"west"|"column"|"north-left"|"north-right", "x": <number>, "y": 4.75 }
  ],
  "curatorial_note": "<one paragraph, 2–4 sentences describing the hang logic>"
}
  `.trim()

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are a gallery curator and installation designer. Arrange photographic prints for maximum visual impact. Return ONLY valid JSON — no preamble, no markdown, no code fences.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const json = await apiRes.json()

    if (!apiRes.ok) {
      return res.status(500).json({ error: json.error?.message ?? `Anthropic ${apiRes.status}` })
    }

    const text: string = json.content?.[0]?.text ?? ''

    try {
      res.json(JSON.parse(text))
    } catch {
      res.status(500).json({ error: 'Parse failed', raw: text })
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
