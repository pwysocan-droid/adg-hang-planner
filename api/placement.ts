import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' })
  }

  const { works, room, locked = [], chaos = 0 } = req.body

  if (!works || !Array.isArray(works) || works.length === 0) {
    return res.status(400).json({ error: 'No works provided' })
  }

  const lockedSection = locked.length > 0
    ? `\nLOCKED PLACEMENTS (do not move these):\n${JSON.stringify(locked, null, 2)}\n`
    : ''

  // chaos: 0 = classical, 10 = maximally weird
  const chaosLevel = Math.max(0, Math.min(10, Number(chaos) || 0))

  const chaosInstructions = chaosLevel <= 2
    ? `AESTHETIC: Classical, considered. Every placement is purposeful and conventional.`
    : chaosLevel <= 5
    ? `AESTHETIC: Slightly unconventional. Take one or two unexpected risks — a surprising wall choice, an off-center anchor, works placed lower or higher than eye level (vary y between 3.0 and 6.5).`
    : chaosLevel <= 7
    ? `AESTHETIC: Provocative. Break the grid. Cluster works unexpectedly. Place some works very low (y=2.0) or very high (y=7.0). Use walls in counter-intuitive ways. Mix scales aggressively.`
    : `AESTHETIC: Maximum chaos and tension. Ignore conventional hang wisdom entirely. Stack works close together. Place anchors on small panels. Put intimate works on the hero wall. Vary y dramatically (1.5 to 8.0). Make it feel like an installation, not a gallery hang. Justify every weird choice in the curatorial note.`

  const prompt = `
GALLERY SPACE:
${JSON.stringify(room, null, 2)}
${lockedSection}
WORKS TO PLACE:
${works.map((w: { id: string; title: string; widthIn: number; heightIn: number }) =>
  `- ${w.id}: "${w.title}", ${w.widthIn}" × ${w.heightIn}"`
).join('\n')}

HIERARCHY (most important — follow strictly):
1. COLUMN FACE (south-facing) = THE HERO POSITION. The single most powerful, largest, or visually commanding work goes here. This is an intimate discovery moment — the work that stops people in their tracks.
2. SOUTH WALL = second best. The uninterrupted 19.33ft run. Anchor with the next strongest work(s).
3. East, west, north panels = supporting cast.

${chaosInstructions}

SPATIAL RULES:
- x values are positions along each wall in feet from left edge
- South wall: x=0 is west end, x=19.33 is east end
- East wall: x=0 is south end, x=9.5 is north end (avoid x>9.5 — window zone)
- West wall: x=0 is south end, x=10 is north end
- Column: x=0 is west end of column face, x=6.1 is east end
- North-left: x=0 is west end, x=3.3 is east end
- North-right: x=0 is left end (at 15.9ft from west), x=3.43 is right end
- Works wider than 30" need panels wider than their width + 12"
- Minimum 6 inches from wall edges
- Default y=4.75 (57" eye level) unless chaos mode dictates otherwise

Return exactly:
{
  "placements": [
    { "imageId": "<id>", "wall": "south"|"east"|"west"|"column"|"north-left"|"north-right", "x": <number>, "y": <number> }
  ],
  "curatorial_note": "<one paragraph, 2–4 sentences describing the hang logic and intent>"
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
        model: 'claude-sonnet-4-6',
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
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    try {
      res.json(JSON.parse(cleaned))
    } catch {
      res.status(500).json({ error: 'Parse failed', raw: text })
    }
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
}
