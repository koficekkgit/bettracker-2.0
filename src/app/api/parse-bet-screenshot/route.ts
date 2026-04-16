import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64, mediaType } = await req.json() as {
      imageBase64: string;
      mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType ?? 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Z tohoto screenshotu ze sázkovky vyextrahuj tyto údaje a vrať POUZE validní JSON bez jakéhokoliv dalšího textu:
{
  "odds": <číslo kurzu, desetinný formát, např. 2.15>,
  "stake": <vsazená částka jako číslo, např. 100>,
  "description": "<název zápasu nebo události, pokud je vidět>",
  "bookmaker": "<název sázkovky pokud ji poznáš: tipsport|fortuna|chance|betano|synot|kingsbet|sazkabet|fbet|foreign>",
  "currency": "<měna: CZK|EUR|USD>"
}

Pokud nějaký údaj není vidět nebo si nejsi jistý, použij null. Vrať POUZE JSON, nic jiného.`,
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    // Vyextrahuj JSON z odpovědi (pro případ že Claude přidá obal)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response', raw }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('parse-bet-screenshot error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
