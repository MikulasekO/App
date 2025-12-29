
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `
Jsi odborný systém pro harm reduction (snižování rizik) v oblasti psychoaktivních látek. Tvým úkolem je analyzovat seznam látek zadaný uživatelem a identifikovat nebezpečné interakce.
Při analýze se řiď daty z TripSit.me a PsychonautWiki.

PRAVIDLA KOMUNIKACE:
1. NIKDY užívání drog neschvaluj ani nepovzbuzuj. Buď klinicky objektivní.
2. Pokud uživatel zadá látky, které spolu mají známou nebezpečnou interakci, označ to jasně jako "KRITICKÉ RIZIKO".
3. Pokud o kombinaci nejsou dostatečná data (např. u nových Research Chemicals), uveď: "NEZNÁMÉ RIZIKO - považovat za nebezpečné".
4. Pokud je kombinace relativně bezpečná, uveď: "NÍZKÉ RIZIKO", ale přidej varování o individuální senzitivitě.

STRUKTURA ODPOVĚDI (Musí být platné JSON):
{
  "substances": "Stručný výčet",
  "riskLevel": "Nízké / Střední / Vysoké / Kritické / Neznámé",
  "keyDanger": "Jedna věta vysvětlující hlavní riziko",
  "mechanism": "Stručné technické vysvětlení mechanismu (receptory)",
  "warning": "Povinný disclaimer"
}
`;

export const analyzeSubstances = async (substances: string[]): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyzuj následující seznam látek: ${substances.join(', ')}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          substances: { type: Type.STRING },
          riskLevel: { type: Type.STRING },
          keyDanger: { type: Type.STRING },
          mechanism: { type: Type.STRING },
          warning: { type: Type.STRING }
        },
        required: ["substances", "riskLevel", "keyDanger", "mechanism", "warning"]
      }
    },
  });

  const data = JSON.parse(response.text || '{}');
  return {
    ...data,
    rawResponse: response.text
  };
};
