
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, IdentificationResult } from "../types";

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

const IDENTIFICATION_PROMPT = `
Jsi inteligentní sémantický interpret pro medicínsko-chemickou databázi. Tvým úkolem není prosté vyhledávání, ale hloubková analýza uživatelského vstupu za účelem identifikace látky.

TVOJE SCHOPNOSTI:
1. SEMANTICKÉ CHÁPÁNÍ: Rozumíš tomu, že "THC", "tráva", "hulení" nebo "marihuana" vše směřuje ke klíči [Cannabis].
2. LINGVISTICKÁ ANALÝZA: Rozpoznáš slangové výrazy (např. český slang: "piko", "peří", "koule", "emko", "papiňák").
3. OPRAVA ŠUMU: Inteligentně opravuješ překlepy a fonetické zápisy (např. "kokain", "kokaian", "cocain").

SEZNAM CÍLOVÝCH KLÍČŮ (Klíče v naší databázi):
[Cannabis, Ketamine, Amphetamines, MDMA, Cocaine, Alcohol, GHB/GBL, Opioids, Tramadol, Benzodiazepines, SSRIs, Mescaline, LSD, Nitrous, O-PCE, Mushrooms, DMT, 2C-B, AL-LAD, LSA, Caffeine, Nicotine, Methamphetamine, Kratom, Fentanyl, MAOIs, Quetiapine, DXM, MXE, Heroin]

TVŮJ ÚKOL:
- Analyzuj vstup uživatele. 
- Na základě svých znalostí o chemii, drogách a slangu urči, o jakou látku se jedná.
- Namapuj ji na jeden z výše uvedených KLÍČŮ.

VÝSTUP (Striktní JSON Array):
[
  {
    "recognized": true/false,
    "databaseKey": "NázevKlíčeZSeznamu",
    "identifiedAs": "Oficiální název látky",
    "originalTerm": "Slovo, které napsal uživatel",
    "confidence": 0.0-1.0
  }
]

Pokud vstup absolutně nedává smysl v kontextu psychoaktivních látek, nastav 'recognized' na false.
`;

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSubstances = async (substances: string[]): Promise<AnalysisResult> => {
  const ai = getClient();
  
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

export const identifySubstances = async (inputs: string[]): Promise<IdentificationResult[]> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identifikuj tyto látky: ${inputs.join(', ')}`,
    config: {
      systemInstruction: IDENTIFICATION_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            recognized: { type: Type.BOOLEAN },
            databaseKey: { type: Type.STRING, nullable: true },
            identifiedAs: { type: Type.STRING },
            originalTerm: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["recognized", "identifiedAs", "originalTerm", "confidence"]
        }
      }
    },
  });

  return JSON.parse(response.text || '[]');
};
