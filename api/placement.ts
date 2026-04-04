import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { works, room, locked = [] } = req.body

  if (!works || !Array.isArray(works) || works.length === 0) {
    return res.status(400).json({ error: 'No works provided' })
  }

  const lockedSection = locked.length > 0
    ? `\nLOCKED PLACEMENTS (do not move these):\n${JSON.stringify(locked, null, 2)}\n`
    : ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a gallery curator and installation designer.
Arrange photographic prints for maximum visual impact.
Return ONLY valid JSON — no preamble, no markdown, no code fences.`,
      messages: [
        {
          role: 'user',
          content: `
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
          `.trim(),
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    try {
      const parsed = JSON.parse(text)
      res.json(parsed)
    } catch {
      res.status(500).json({ error: 'Parse failed', raw: text })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
}
