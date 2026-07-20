import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const memoryPack = await req.json();

    if (!memoryPack || !memoryPack.id) {
      return NextResponse.json({ error: "Invalid Memory Pack payload." }, { status: 400 });
    }

    // Secure server-side database (JSON file acting as pseudo Vector DB)
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    
    let db = [];
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(fileData || '[]');
    }

    // Upsert logic (if deployed multiple times in testing, overwrite it)
    const existingIndex = db.findIndex((p: any) => p.name === memoryPack.name);
    if (existingIndex > -1) {
      db[existingIndex] = memoryPack;
    } else {
      db.push(memoryPack);
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: "Memory Pack securely deployed to Gateway." });
  } catch (error: any) {
    console.error("Deploy API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
