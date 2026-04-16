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
              text: `Jsi expert na rozpoznávání tiketů ze sázkovek. Z tohoto screenshotu vyextrahuj údaje a vrať POUZE validní JSON bez jakéhokoliv dalšího textu.

Pravidla:
- "odds": kurz sázky jako desetinné číslo (hledej čísla jako 1.85, 2.50, 4.50 atd., může být označeno "Kurz", "Celkový kurz", "Koeficient")
- "stake": vsazená částka (hledej "Vklad", "Vsazeno", "Sázka", "Stake", číslice s Kč/€/$). Pokud není vidět, dej null.
- "description": název zápasu nebo události (typicky "Tým A - Tým B" nebo "Tým A vs Tým B")
- "pick": konkrétní tip/výběr sázky — co bylo vsazeno (např. "TP Can Tho -19.5", "1", "Over 2.5", "BTTS", název týmu apod.). Hledej tučný text u kurzu nebo označení výběru. Pokud není vidět, dej null.
- "status": výsledek sázky — hledej slova jako Výhra/Won/Win → "won", Prohra/Lost/Lose → "lost", Cashout/Vyplaceno → "cashout", Storno/Void/Zrušeno → "void", Půl výhra/Half win → "half_won", Půl prohra/Half loss → "half_lost". Pokud není výsledek vidět nebo sázka probíhá, dej "pending".
- "bookmaker": rozpoznej sázkovku podle loga, barev nebo URL:
    - Tipsport = tmavý design, modré/zelené logo, URL tipsport.cz
    - Fortuna = oranžové logo, fortuna.cz
    - Chance = červené logo, chance.cz
    - Betano = fialové/modré, betano.cz
    - Synot = žluté logo, synottip.cz
    - Sazkabet = sazkabet.cz
    - Fbet = fbet.cz
    Vrať jednu z: tipsport|fortuna|chance|betano|synot|kingsbet|sazkabet|fbet|foreign nebo null
- "currency": měna (CZK|EUR|USD), výchozí CZK

{
  "odds": <číslo nebo null>,
  "stake": <číslo nebo null>,
  "description": "<název zápasu nebo null>",
  "pick": "<konkrétní tip/výběr nebo null>",
  "status": "<won|lost|cashout|void|half_won|half_lost|pending>",
  "bookmaker": "<id nebo null>",
  "currency": "<CZK|EUR|USD>"
}

Vrať POUZE JSON, nic jiného.`,
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
