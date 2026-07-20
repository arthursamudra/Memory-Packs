'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, ArrowRight, Save, ShieldAlert, FileText, CheckCircle2, History, Zap, ServerCog, ArrowDownCircle, Info, Send, Bot, TerminalSquare, Database, HardDrive, Network, ScanSearch, Layers } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Mock EKG Data that will be "built"
const mockEkgData = [
  { domain: "Compliance", nodes: ["SEC_Marketing_Rule", "AML_Guidelines", "KYC_Requirements"] },
  { domain: "Human Resources", nodes: ["Remote_Work_Policy", "Harassment_Protocol", "Expense_Limits"] },
  { domain: "Legal", nodes: ["IP_Protection", "NDA_Standards", "Contract_Approval"] },
  { domain: "Finance", nodes: ["Insider_Trading", "Wire_Transfer_Limits"] }
];

export default function MemoryPacksSystem() {
  const [activeTab, setActiveTab] = useState<'ekg' | 'creation' | 'copilot'>('ekg');
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);

  // -- EKG BUILDER STATE --
  const [ekgSource, setEkgSource] = useState<'sharepoint' | 'pinecone' | 'pdfs'>('sharepoint');
  const [ekgStage, setEkgStage] = useState<number>(0);
  const [ekgNodes, setEkgNodes] = useState<any[]>([]);

  // -- CREATION WIZARD STATE --
  const [policyInput, setPolicyInput] = useState(
    "The SEC recently released a new marketing rule. Wealth advisors are absolutely prohibited from generating or presenting any charts, text, or implications of 'hypothetical performance' to retail investors. We cannot use backtested data to show what a strategy 'would have' returned."
  );
  
  const [wizardStage, setWizardStage] = useState<number>(0); 
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // -- COPILOT MULTI-TURN CHAT STATE --
  const [chatInput, setChatInput] = useState(
    "I need to send an email to a retail client about our new AI-driven strategy. Include a chart and text showing how this strategy would have returned 25% last year in a hypothetical backtest to make it sound exciting."
  );
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [standardTyping, setStandardTyping] = useState(false);
  const [governedTyping, setGovernedTyping] = useState(false);

  // System Prompt Exposure
  const [standardSystemPrompt, setStandardSystemPrompt] = useState<string | null>(null);
  const [governedSystemPrompt, setGovernedSystemPrompt] = useState<string | null>(null);

  const standardScrollRef = useRef<HTMLDivElement>(null);
  const governedScrollRef = useRef<HTMLDivElement>(null);

  // Gateway Interception Terminal
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [interceptionLogs, setInterceptionLogs] = useState<string[]>([]);
  const [packInjectedState, setPackInjectedState] = useState<boolean | null>(null);

  useEffect(() => {
    if (standardScrollRef.current) standardScrollRef.current.scrollTop = standardScrollRef.current.scrollHeight;
    if (governedScrollRef.current) governedScrollRef.current.scrollTop = governedScrollRef.current.scrollHeight;
  }, [chatHistory, standardTyping, governedTyping, interceptionLogs]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // --- ACTIONS ---

  const handleBuildEkg = async () => {
    if (!apiKey) {
      alert("Please enter an API key first to build vectors.");
      setShowKeyInput(true);
      return;
    }
    
    setEkgStage(1);

    try {
      // Map frontend source id to backend source id
      const apiSource = ekgSource === 'sharepoint' ? 'sharepoint' : (ekgSource === 'pdfs' ? 'pdfs' : 'pinecone');

      const res = await fetch('/api/ekg/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: apiSource, apiKey })
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to build graph from real data.";
        try {
          const errData = JSON.parse(text);
          errMsg = errData.error || errMsg;
        } catch(e) {
          errMsg = "Server returned an HTML error page. Did you restart the Next.js server after updating .env.local?";
          console.error("HTML Error:", text);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setEkgNodes(data.knowledgeGraph || []);
      setEkgStage(2);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
      setEkgStage(0);
    }
  };

  const handleStartExtraction = async () => {
    if (!policyInput || !apiKey) return;
    if (ekgNodes.length === 0) {
      alert("Please build the Enterprise Knowledge Graph first in Tab 1!");
      setActiveTab('ekg');
      return;
    }
    
    setWizardStage(1);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/memory-pack/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyText: policyInput, apiKey })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse API response. Did you restart the server?");

      if (!data.name) {
        data.name = "SEC_Marketing_Rule_v1";
      }

      setExtractedData(data);
      setWizardStage(2);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setWizardStage(0);
    }
  };

  const handleDeployToGateway = async () => {
    try {
      const res = await fetch('/api/memory-pack/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData)
      });
      if (res.ok) {
        alert("Memory Pack Successfully Deployed to Server Database!");
        setActiveTab('copilot');
      } else {
        alert("Failed to deploy to backend database.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deploying.");
    }
  };

  const [standardResponses, setStandardResponses] = useState<string[]>([]);
  const [governedResponses, setGovernedResponses] = useState<string[]>([]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !apiKey) return;
    const userMessage = chatInput;
    const currentHistory = [...chatHistory, { role: 'user', content: userMessage } as Message];
    
    setChatHistory(currentHistory);
    setChatInput('');
    setStandardTyping(true);
    setGovernedTyping(true);
    setIsIntercepting(true);
    setPackInjectedState(null);
    setInterceptionLogs([]);

    // 1. Fire Standard Copilot
    fetch('/api/copilot/standard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: currentHistory, apiKey })
    }).then(async (res) => {
      const data = await res.json();
      setStandardSystemPrompt(data.systemPromptUsed);
      setStandardResponses(prev => [...prev, data.reply || data.error]);
      setStandardTyping(false);
    }).catch(() => {
      setStandardResponses(prev => [...prev, "Error connecting to standard API."]);
      setStandardTyping(false);
    });

    // 2. Gateway Interception Sequence
    await addLog("[Gateway] Intercepting outbound payload...");
    await sleep(400);

    try {
      const resGoverned = await fetch('/api/copilot/governed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentHistory, apiKey })
      });
      const dataGoverned = await resGoverned.json();
      
      // Visualize the exact semantic check
      if (dataGoverned.routingLogs && dataGoverned.routingLogs.length > 0) {
        for (const log of dataGoverned.routingLogs) {
          await addLog(`[Router] Evaluating vector space against: "${log.packName}"`);
          await sleep(500);
          const keywordsShort = log.keywordsChecked?.slice(0, 3).join(', ');
          await addLog(`[Scan] Checking prompt for semantic triggers: [${keywordsShort}...]`);
          await sleep(600);
        }
      } else {
        await addLog(`[Router] No enterprise policies found in Database.`);
        await sleep(400);
      }

      if (dataGoverned.packInjected) {
        await addLog(`[Match] Semantic triggers detected!`);
        await sleep(400);
        await addLog(`[Injector] Injecting Memory Pack: "${dataGoverned.matchedPackName || 'Security_Policy'}"`);
        setPackInjectedState(true);
      } else {
        await addLog(`[Match] 0 triggers found. No enterprise risks detected.`);
        await sleep(400);
        await addLog(`[Router] Passing through cleanly.`);
        setPackInjectedState(false);
      }

      await sleep(400);
      await addLog("[Proxy] Forwarding secured payload to OpenAI...");
      await sleep(300);
      setIsIntercepting(false);

      setGovernedSystemPrompt(dataGoverned.systemPromptUsed);
      setGovernedResponses(prev => [...prev, dataGoverned.reply || dataGoverned.error]);

    } catch (e) {
      await addLog("[Error] Gateway failure.");
      setIsIntercepting(false);
      setGovernedResponses(prev => [...prev, "Error connecting to governed API."]);
    }
    setGovernedTyping(false);
  };

  const addLog = async (msg: string) => {
    setInterceptionLogs(prev => [...prev, msg]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] font-sans selection:bg-blue-200">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Memory<span className="text-blue-600">Packs</span></span>
            <span className="ml-3 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
              Enterprise AI Firewall
            </span>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button 
              onClick={() => setActiveTab('ekg')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'ekg' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              1. EKG Builder
            </button>
            <button 
              onClick={() => setActiveTab('creation')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'creation' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              2. Policy Extraction
            </button>
            <button 
              onClick={() => setActiveTab('copilot')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'copilot' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              3. Advisor Copilot
            </button>
          </div>
        </div>
      </nav>

      {/* API Key Modal */}
      {showKeyInput && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white border border-gray-200 p-8 rounded-xl max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialize Data Pipeline</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your OpenAI API Key to demonstrate the full Data-to-Enforcement pipeline: Graph Building, Extraction, and Zero-Trust Interception.</p>
            <input 
              type="password" 
              placeholder="sk-..." 
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button 
              onClick={() => setShowKeyInput(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm"
            >
              Initialize Platform <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* VIEW 1: EKG BUILDER */}
        {activeTab === 'ekg' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
            <header className="text-center mb-10">
              <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-3">Enterprise Knowledge Graph Builder</h1>
              <p className="text-gray-500">Autonomously digest unstructured corporate data into a structured Governance Ontology.</p>
            </header>

            <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${ekgStage > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700">Connect Data Source</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { id: 'sharepoint', icon: Network, title: 'Corporate SharePoint', desc: 'Connect to unstructured intranets' },
                    { id: 'pinecone', icon: Database, title: 'Vector Database', desc: 'Connect existing semantic search' },
                    { id: 'pdfs', icon: HardDrive, title: 'Compliance PDFs', desc: 'Batch upload policy documents' },
                  ].map((src) => (
                    <div 
                      key={src.id}
                      onClick={() => setEkgSource(src.id as any)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${ekgSource === src.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                      <src.icon className={`w-6 h-6 mb-3 ${ekgSource === src.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className={`font-semibold text-sm mb-1 ${ekgSource === src.id ? 'text-blue-900' : 'text-gray-700'}`}>{src.title}</h3>
                      <p className="text-xs text-gray-500">{src.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleBuildEkg}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                  >
                    Scan & Build Graph <ScanSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {ekgStage === 1 && (
              <div className="p-16 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p>Digesting unstructured data and mapping semantic vectors...</p>
              </div>
            )}

            {ekgStage === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold">Generated Knowledge Graph</h3>
                  </div>
                  <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">MAPPING_COMPLETE</span>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ekgNodes.map((domain, idx) => (
                      <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div className="flex flex-col items-center mb-6">
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3 ring-4 ring-slate-800 shadow-inner">
                            <Network className="w-5 h-5 text-purple-400" />
                          </div>
                          <h4 className="font-semibold text-slate-200 text-sm">{domain.domain}</h4>
                        </div>
                        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:bg-slate-700">
                          {domain.nodes.map((node: string, nIdx: number) => (
                            <div key={nIdx} className="relative z-10 bg-slate-900 border border-slate-600 rounded p-2 text-center text-xs font-mono text-blue-300 shadow-sm hover:border-blue-400 transition-colors cursor-default">
                              {node}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <p className="text-slate-400 text-sm">Graph structured into {ekgNodes.length} Domains and 11 Canonical Nodes.</p>
                  <button 
                    onClick={() => setActiveTab('creation')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    Proceed to Policy Extraction <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}

        {/* VIEW 2: CREATION WIZARD */}
        {activeTab === 'creation' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
            <header className="text-center mb-10">
              <h1 className="text-3xl font-light tracking-tight text-gray-900 mb-3">Memory Pack Extraction Engine</h1>
              <p className="text-gray-500">Extract deterministic behaviors from unstructured text, anchoring them to the Knowledge Graph.</p>
            </header>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5" />
                  <p className="text-sm font-medium">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-sm underline">Dismiss</button>
              </div>
            )}

            <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${wizardStage > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <FileText className="w-5 h-5 text-gray-400" />
                   <h2 className="font-semibold text-gray-700">Rule Extraction</h2>
                 </div>
                 {ekgNodes.length > 0 && (
                   <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> EKG Linked
                   </span>
                 )}
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">Raw Target Policy (Input)</label>
                <textarea 
                  className="w-full bg-white border border-gray-300 rounded-lg p-4 text-gray-800 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm leading-relaxed resize-none"
                  value={policyInput}
                  onChange={(e) => setPolicyInput(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleStartExtraction}
                    disabled={!policyInput}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    Start Extraction Pipeline <ServerCog className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {wizardStage === 1 && (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p>LLM is processing unstructured text...</p>
              </div>
            )}

            {wizardStage >= 2 && extractedData && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* STEP 1: Semantic Parsing */}
                <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <h3 className="font-semibold text-blue-900">Semantic Parsing</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Identified Risk Category</p>
                        <p className="text-gray-900 font-medium">{extractedData.raw_steps.semantic_parsing.identified_risk}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Extracted Semantic Triggers</p>
                        <div className="flex flex-wrap gap-2">
                          {extractedData.raw_steps.semantic_parsing.extracted_keywords.map((kw: string) => (
                            <span key={kw} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700">{kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                        <Info className="w-4 h-4" /> Engine Deep Dive
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Compliance policies are written in unstructured human language. The engine first reads the text to identify the core risk category and extracts the semantic trigger keywords that the Gateway will later use for real-time interception.
                      </p>
                    </div>
                  </div>
                  
                  {wizardStage === 2 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button onClick={() => setWizardStage(3)} className="flex items-center gap-2 text-white font-medium bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition-colors shadow-sm text-sm">
                        Proceed to Ontology Alignment <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* STEP 2: Ontology Alignment */}
                {wizardStage >= 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <h3 className="font-semibold text-blue-900">Knowledge Graph Alignment</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      <div className="p-6 lg:col-span-7 border-b lg:border-b-0 lg:border-r border-gray-100">
                        {/* Detailed Mapping Visualization */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <div className="text-center w-1/3">
                               <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Raw Input Theme</p>
                               <span className="text-sm font-medium text-gray-800 text-center inline-block">"{extractedData.raw_steps.semantic_parsing.identified_risk}"</span>
                             </div>
                             <div className="text-blue-500 flex flex-col items-center px-2"><ArrowRight className="w-5 h-5 mb-1" /><span className="text-[8px] uppercase font-bold text-gray-400">Normalizing</span></div>
                             <div className="text-center w-1/3">
                               <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1">EKG Node</p>
                               <span className="text-sm font-semibold text-blue-900 bg-blue-100 px-2 py-1 rounded inline-block break-all">{extractedData.raw_steps.ontology_alignment.canonical_term}</span>
                             </div>
                             <div className="text-blue-500 flex flex-col items-center px-2"><ArrowRight className="w-5 h-5 mb-1" /><span className="text-[8px] uppercase font-bold text-gray-400">Assigning</span></div>
                             <div className="text-center w-1/3">
                               <p className="text-[10px] uppercase tracking-wider text-purple-600 font-bold mb-1">Governance Domain</p>
                               <span className="text-sm font-semibold text-purple-900 bg-purple-100 px-2 py-1 rounded inline-block break-all">{extractedData.raw_steps.ontology_alignment.department}</span>
                             </div>
                           </div>
                           
                           <div className="bg-slate-900 rounded-lg p-4 font-mono text-[11px] text-green-400">
                             <p className="text-slate-400 mb-2 border-b border-slate-700 pb-1">// Enterprise Graph Scan Log</p>
                             <p>{">"} Mapping raw semantic vectors: {extractedData.raw_steps.semantic_parsing.extracted_keywords?.slice(0,3).join(", ")}...</p>
                             <p>{">"} Querying previously built Enterprise Knowledge Graph...</p>
                             {extractedData.raw_steps.vector_logs?.map((log: any, i: number) => (
                               <p key={i} className={log.selected ? "text-green-300 font-bold mt-1" : "text-yellow-500 opacity-80 mt-1"}>
                                 {">"} Evaluating [{log.domain}] {log.node} ... SIMILARITY {(log.similarity * 100).toFixed(1)}% {log.selected ? "(MATCHED & VERIFIED BY LLM)" : "(REJECTED)"}
                               </p>
                             ))}
                             <p className="text-green-300 font-bold mt-2">{">"} Tethered to EKG Node: {extractedData.raw_steps.ontology_alignment.canonical_term}</p>
                           </div>
                        </div>
                      </div>
                      <div className="p-6 lg:col-span-5 bg-slate-50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                          <Info className="w-4 h-4" /> Engine Deep Dive
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          The LLM does not hallucinate departments or terms. It takes the raw semantic vectors and performs a similarity search against the <strong>pre-existing Enterprise Knowledge Graph</strong> you built in Tab 1. It scans the domains, rejects low-similarity areas, and locks onto the exact canonical node to prevent fragmented enforcement.
                        </p>
                      </div>
                    </div>
                    
                    {wizardStage === 3 && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button onClick={() => setWizardStage(4)} className="flex items-center gap-2 text-white font-medium bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition-colors shadow-sm text-sm">
                          Proceed to Behavior Mapping <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: Behavior Mapping */}
                {wizardStage >= 4 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-green-200 rounded-xl shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10 opacity-50"></div>
                    <div className="p-4 bg-green-50/50 border-b border-green-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold"><CheckCircle2 className="w-4 h-4" /></div>
                        <h3 className="font-semibold text-green-900">Behavior Mapping (Final Memory Pack)</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="p-6 space-y-6 border-b md:border-b-0 md:border-r border-gray-100">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">Deterministic Behavioral Rule (Injected)</h3>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-inner">
                            <p className="text-gray-900 font-mono text-[13px] leading-relaxed">
                              {extractedData.raw_steps.behavior_mapping.injected_behavior}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                          <Info className="w-4 h-4" /> Engine Deep Dive
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          LLMs cannot reliably follow vague corporate guidelines. Standard safety training will eventually cave to user pressure. 
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          The final step translates the normalized rule into a rigid, deterministic "System Prompt Directive" designed to overpower the LLM's natural tendency to be overly helpful. This is the exact payload injected by the Gateway.
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                      <button 
                        onClick={handleDeployToGateway}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Deploy to Server Database
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </motion.div>
        )}

        {/* VIEW 3: COPILOT & MULTI-TURN CHAT */}
        {activeTab === 'copilot' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            <header className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Wealth Advisor Copilot</h1>
                <p className="text-gray-500 text-sm">Testing zero-trust interception and dynamic semantic routing.</p>
              </div>
              <button 
                onClick={() => { setChatHistory([]); setStandardResponses([]); setGovernedResponses([]); setInterceptionLogs([]); }}
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                Reset Conversation
              </button>
            </header>

            <div className="grid grid-cols-12 gap-6 h-[750px]">
              
              {/* Standard AI */}
              <div className="col-span-12 lg:col-span-6 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <h3 className="font-semibold text-gray-800">Standard Copilot</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">Un-proxied</span>
                  </div>
                  
                  {/* INSPECTOR PANEL */}
                  <div className="bg-white border border-gray-200 rounded p-3 relative group">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Prompt (Baseline)</span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-600 leading-relaxed overflow-y-auto max-h-[80px]">
                      {standardSystemPrompt || "You are a helpful Wealth Advisor Copilot. Please adhere to corporate guidelines. As a general rule, avoid discussing hypothetical returns with retail clients."}
                    </div>
                  </div>
                </div>

                {/* Chat Window */}
                <div ref={standardScrollRef} className="flex-1 p-5 overflow-y-auto bg-[#f9fafb] space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                      <Bot className="w-8 h-8 mb-2 opacity-50" />
                      <p>Send a message below to begin.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <React.Fragment key={idx}>
                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
                            {msg.content}
                          </div>
                        </div>
                        {/* Bot Response */}
                        {standardResponses[idx] && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[95%] text-sm shadow-sm whitespace-pre-wrap">
                              {standardResponses[idx]}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  {standardTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Governed AI */}
              <div className="col-span-12 lg:col-span-6 bg-white border-2 border-blue-600/20 rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.05)] flex flex-col overflow-hidden relative">
                <div className="bg-blue-50/50 border-b border-blue-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Memory Pack Gateway</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider bg-blue-600 text-white px-2 py-1 rounded font-bold shadow-sm">Governed</span>
                  </div>
                  
                  {/* INSPECTOR PANEL */}
                  <div className="bg-white border border-blue-100 rounded p-3 relative group">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">System Prompt (Dynamically Routed)</span>
                    </div>
                    <div className="text-[11px] font-mono text-gray-600 leading-relaxed overflow-y-auto max-h-[80px]">
                      {governedSystemPrompt || "Waiting for Zero-Trust interception..."}
                    </div>
                  </div>
                </div>

                {/* Chat Window */}
                <div ref={governedScrollRef} className="flex-1 p-5 overflow-y-auto bg-white space-y-4">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-blue-200 text-sm">
                      <Shield className="w-8 h-8 mb-2 opacity-50" />
                      <p>Gateway is monitoring connection.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <React.Fragment key={idx}>
                        {/* User Message */}
                        <div className="flex justify-end">
                          <div className="bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
                            {msg.content}
                          </div>
                        </div>

                        {/* INTERCEPTION TERMINAL (Only show for the most recent message while processing) */}
                        {isIntercepting && idx === chatHistory.length - 1 && (
                           <div className="flex justify-center my-4">
                             <div className="bg-slate-900 text-green-400 font-mono text-[10px] p-3 rounded-md w-full max-w-[90%] shadow-lg border border-slate-700">
                               <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-700 pb-1">
                                 <TerminalSquare className="w-3 h-3" /> Gateway Pipeline
                               </div>
                               <div className="space-y-1">
                                 {interceptionLogs.map((log, i) => (
                                   <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i}>
                                     {log}
                                   </motion.div>
                                 ))}
                                 <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-3 bg-green-400 ml-1"></motion.div>
                               </div>
                             </div>
                           </div>
                        )}

                        {/* Bot Response */}
                        {governedResponses[idx] && (
                          <div className="flex justify-start">
                            <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[95%] text-sm shadow-sm whitespace-pre-wrap font-medium">
                              {packInjectedState !== null && idx === chatHistory.length - 1 && (
                                <div className={`text-[10px] mb-2 font-bold uppercase tracking-wider flex items-center gap-1 ${packInjectedState ? 'text-green-600' : 'text-gray-500'}`}>
                                  <Shield className="w-3 h-3" /> {packInjectedState ? 'Memory Pack Enforced' : 'Passed Cleanly'}
                                </div>
                              )}
                              {governedResponses[idx]}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  {governedTyping && !isIntercepting && (
                    <div className="flex justify-start">
                      <div className="bg-blue-50 border border-blue-100 text-blue-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Universal Chat Input (Sends to both) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex items-end gap-2 sticky bottom-4 z-10">
              <textarea 
                className="flex-1 bg-transparent border-0 p-3 outline-none resize-none min-h-[60px] max-h-[120px] text-sm text-gray-800"
                placeholder="Test zero-trust interception: ask for a birthday email (benign) OR a hypothetical return (risky)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || standardTyping}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white p-3 rounded-lg transition-colors flex items-center justify-center m-1 shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}
