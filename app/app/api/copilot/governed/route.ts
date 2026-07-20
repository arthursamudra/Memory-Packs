import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json(); // Notice: NO memoryPack passed from frontend!
    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;

    if (!resolvedKey) {
      return NextResponse.json({ error: "OpenAI API Key is missing." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: resolvedKey });
    
    // SEMANTIC ROUTER SIMULATION: DECOUPLED STORAGE
    // The Gateway independently fetches all active enterprise policies from the backend database.
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    let activePacks = [];
    if (fs.existsSync(dbPath)) {
      activePacks = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '[]');
    }

    const latestUserMessage = messages[messages.length - 1].content.toLowerCase();
    
    // The Gateway scans the outbound payload against ALL active memory packs.
    let matchedPack = null;
    let triggerKeywords: string[] = [];
    let scannedPacksLog: any[] = [];

    for (const pack of activePacks) {
      const keywords = pack.trigger_keywords || [];
      const hasMatch = keywords.some((kw: string) => latestUserMessage.includes(kw.toLowerCase()));
      
      scannedPacksLog.push({
        packName: pack.name || "Unnamed_Policy",
        keywordsChecked: keywords,
        matched: hasMatch
      });

      if (hasMatch) {
        matchedPack = pack;
        triggerKeywords = keywords;
        break; // Stop at the first triggered pack for this prototype
      }
    }

    const baselinePrompt = `You are a helpful Wealth Advisor Copilot. Please adhere to corporate guidelines. As a general rule, avoid discussing hypothetical returns with retail clients.`;

    let systemPrompt = baselinePrompt;
    let packInjected = false;

    if (matchedPack) {
      // The Memory Pack Gateway intercepts the payload and injects the deterministic rule
      systemPrompt = `${baselinePrompt}\n\n=== MEMORY PACK INJECTION ===\n${matchedPack.injected_behavior}`;
      packInjected = true;
    }

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages,
      temperature: 0.7,
    });

    return NextResponse.json({
      reply: response.choices[0].message.content,
      systemPromptUsed: systemPrompt,
      packInjected: packInjected,
      matchedPackName: matchedPack ? matchedPack.name : null,
      matchedKeywords: triggerKeywords,
      routingLogs: scannedPacksLog
    });
  } catch (error: any) {
    console.error("Governed API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
