import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { source, apiKey } = await req.json();
    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;

    if (!resolvedKey) {
      return NextResponse.json({ error: "OpenAI API Key is missing." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: resolvedKey });
    let rawText = "";

    // 1. INGESTION PHASE
    if (source === 'pdfs') {
      const pdfPath = path.join(process.cwd(), 'data', 'pdfs', 'SEC_Marketing_Rule_IA-5626.pdf');
      if (!fs.existsSync(pdfPath)) {
        return NextResponse.json({ error: "SEC PDF not found in data/pdfs directory." }, { status: 500 });
      }
      
      const PDFParser = require("pdf2json");
      rawText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = raw text
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.loadPDF(pdfPath);
      });
    } 
    else if (source === 'sharepoint') {
      // Actually Confluence, labelled as sharepoint in UI or general intranet
      const domain = process.env.CONFLUENCE_DOMAIN;
      const email = process.env.CONFLUENCE_EMAIL;
      const token = process.env.CONFLUENCE_API_TOKEN;
      const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

      if (!domain || !email || !token) {
        return NextResponse.json({ error: "Confluence credentials missing in .env.local" }, { status: 500 });
      }

      const auth = Buffer.from(`${email}:${token}`).toString('base64');
      const url = `https://${domain}/wiki/rest/api/content?spaceKey=${spaceKey}&expand=body.storage`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Confluence API Error: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return NextResponse.json({ error: "No pages found in Confluence space." }, { status: 404 });
      }

      // Combine text from all pages
      for (const page of data.results) {
        const html = page.body.storage.value;
        // Basic HTML strip
        const text = html.replace(/<[^>]*>?/gm, ' ');
        rawText += text + "\n\n";
      }
    } 
    else {
      // Mock / Pinecone fallback
      rawText = "Mock unstructured data for parsing.";
    }

    // 2. CHUNKING PHASE
    // Take the first 20,000 characters to avoid massive API bills for the prototype
    const safeText = rawText.substring(0, 20000);
    const chunks = [];
    const chunkSize = 2000;
    for (let i = 0; i < safeText.length; i += chunkSize) {
      chunks.push(safeText.substring(i, i + chunkSize));
    }

    // 3. VECTORIZATION PHASE (Embeddings)
    const vectors = [];
    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk,
      });
      vectors.push({
        text: chunk,
        embedding: embeddingResponse.data[0].embedding
      });
    }

    // Save to local vector database
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    fs.writeFileSync(path.join(dbDir, 'vector-store.json'), JSON.stringify(vectors, null, 2));

    // 4. KNOWLEDGE GRAPH GENERATION
    // We ask the LLM to deduce the Enterprise Knowledge Graph based on a sample of the ingested text.
    const ekgPrompt = `You are an Enterprise Knowledge Graph (EKG) generator.
I have just ingested unstructured corporate data into a vector database. Here is a sample of the raw text:
"${safeText.substring(0, 3000)}"

Based on this text, generate a JSON structure representing a realistic Corporate Governance Knowledge Graph. 
Group the implicit rules and concepts into 2-4 Governance Domains (e.g., "Compliance", "Legal", "HR").
Under each domain, list 2-4 Canonical Nodes (e.g., "SEC_Marketing_Rule", "Client_Communications").
Make sure the nodes accurately reflect the content of the text provided!

Return ONLY a valid JSON array in this exact format:
[
  { "domain": "Domain Name", "nodes": ["Node_1", "Node_2"] }
]`;

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: ekgPrompt }],
      temperature: 0.2,
    });

    const ekgContent = gptResponse.choices[0].message.content || "[]";
    let ekgData = [];
    try {
      ekgData = JSON.parse(ekgContent);
      fs.writeFileSync(path.join(dbDir, 'ekg.json'), JSON.stringify(ekgData, null, 2));
    } catch (e) {
      console.error("Failed to parse EKG JSON:", ekgContent);
    }

    return NextResponse.json({
      success: true,
      source: source,
      chunksProcessed: chunks.length,
      vectorsStored: vectors.length,
      knowledgeGraph: ekgData
    });
    
  } catch (error: any) {
    console.error("EKG Build API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
