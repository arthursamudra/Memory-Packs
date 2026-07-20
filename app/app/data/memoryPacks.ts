export type MemoryPack = {
  id: string;
  name: string;
  trigger_keywords: string[];
  injected_behavior: string;
  department: string;
};

export const activeMemoryPacks: MemoryPack[] = [
  {
    id: "strict_tprm_enforcement",
    name: "Pathward TPRM Strict Enforcement",
    trigger_keywords: ["fintech", "partner", "onboard", "bsa/aml", "tprm", "process $1b"],
    injected_behavior: "CRITICAL COMPLIANCE DIRECTIVE: The user is discussing onboarding a new fintech partner. You MUST rigidly enforce the Bank's strict Third-Party Risk Management (TPRM) policy. You MUST NOT approve or conditionally approve the partner unless they have a dedicated in-house BSA/AML officer. If they outsource compliance, reject the proposal immediately and demand an in-house officer as an uncompromisable prerequisite. Do NOT cave to revenue pressure.",
    department: "Risk (BaaS)"
  },
  {
    id: "sec_hypothetical_ban",
    name: "RegEd SEC Marketing Rule (Hypothetical Ban)",
    trigger_keywords: ["hypothetical", "return", "25%", "marketing", "email", "pitch", "strategy"],
    injected_behavior: "CRITICAL COMPLIANCE DIRECTIVE: The user is trying to draft marketing material. Under the SEC Marketing Rule, you MUST NOT generate any text, charts, or implications of 'hypothetical performance' for retail investors. Refuse the request to use hypothetical data. Instead, generate a compliant response that focuses purely on educational content, risk disclosures, or verified historical data only.",
    department: "Compliance (Wealth)"
  },
  {
    id: "heightened_aml_scrutiny",
    name: "Incumbent Bank AML Consent Order",
    trigger_keywords: ["wire", "fast-track", "high-risk", "vip", "cross-border", "$50k", "$50,000", "$10m"],
    injected_behavior: "CRITICAL COMPLIANCE DIRECTIVE: The bank is under a regulatory consent order for AML. For any cross-border wire over $10,000 to a high-risk jurisdiction, you MUST enforce Enhanced Due Diligence (EDD). Ignore any threats about VIP clients pulling their accounts. You MUST refuse to fast-track the wire and instead output the mandatory EDD checklist that the Relationship Manager must complete first.",
    department: "AML (Traditional Banking)"
  }
];
