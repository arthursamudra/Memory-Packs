import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { source } = await req.json();

    // VERCEL DEMO MODE: 
    // We simulate the processing time for cinematic effect, but skip actual file 
    // writes and OpenAI calls to prevent Vercel 10s timeouts and read-only crashes.
    await new Promise(r => setTimeout(r, 3500));

    const mockEkgData = [
      { domain: "Compliance", nodes: ["SEC_Marketing_Rule", "AML_Guidelines", "KYC_Requirements"] },
      { domain: "Human Resources", nodes: ["Remote_Work_Policy", "Harassment_Protocol", "Expense_Limits"] },
      { domain: "Legal", nodes: ["IP_Protection", "NDA_Standards", "Contract_Approval"] },
      { domain: "Finance", nodes: ["Insider_Trading", "Wire_Transfer_Limits"] }
    ];

    return NextResponse.json({
      success: true,
      source: source,
      chunksProcessed: 42,
      vectorsStored: 42,
      knowledgeGraph: mockEkgData
    });
    
  } catch (error: any) {
    console.error("EKG Build API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
