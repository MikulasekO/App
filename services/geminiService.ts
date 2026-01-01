
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, IdentificationResult } from "../types";

const SYSTEM_PROMPT = `
Jsi odborný systém pro harm reduction. Analyzuj interakce látek (TripSit/PsychonautWiki).
NIKDY nepovzbuzuj k užívání. Buď klinicky objektivní.

VÝSTUP (Striktní JSON):
{
  "substances": "string",
  "riskLevel": "Nízké/Střední/Vysoké/Kritické/Neznámé",
  "keyDanger": "string (1 věta)",
  "mechanism": "string (technický popis)",
  "warning": "string (disclaimer)"
}
`;

const IDENTIFICATION_PROMPT = `
Identifikuj látky a slang (např. piko -> Methamphetamine).
VÝSTUP (Striktní JSON Array):
[{"recognized":true,"databaseKey":"Key","identifiedAs":"Name","originalTerm":"term","confidence":1.0}]
Cílové klíče: [Cannabis, Ketamine, Amphetamines, MDMA, Cocaine, Alcohol, GHB/GBL, Opioids, Tramadol, Benzodiazepines, SSRIs, Mescaline, LSD, Nitrous, O-PCE, Mushrooms, DMT, 2C-B, AL-LAD, LSA, Caffeine, Nicotine, Methamphetamine, Kratom, Fentanyl, MAOIs, Quetiapine, DXM, MXE, Heroin]
`;

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSubstances = async (substances: string[]): Promise<AnalysisResult> => {
  if (!substances || substances.length === 0) throw new Error("Prázdný seznam látek.");
  
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyzuj: ${substances.join(', ')}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || '{}';
    return {
      ...JSON.parse(text),
      rawResponse: text
    };
  } catch (err) {
    console.error("Gemini Analysis Error:", err);
    throw new Error("Nepodařilo se analyzovat látky. Zkontrolujte připojení.");
  }
};

export const identifySubstances = async (inputs: string[]): Promise<IdentificationResult[]> => {
  if (!inputs || inputs.length === 0) return [];
  
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identifikuj: ${inputs.join(', ')}`,
      config: {
        systemInstruction: IDENTIFICATION_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error("Gemini Identification Error:", err);
    return inputs.map(term => ({
      recognized: false,
      databaseKey: null,
      identifiedAs: term,
      originalTerm: term,
      confidence: 0
    }));
  }
};
