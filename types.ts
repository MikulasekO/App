
export type RiskLevel = 'Nízké' | 'Střední' | 'Vysoké' | 'Kritické' | 'Neznámé';

export type AnalysisMode = 'VERIFIED' | 'AI';

export interface AnalysisResult {
  substances: string;
  riskLevel: RiskLevel;
  keyDanger: string;
  mechanism: string;
  warning: string;
  rawResponse: string;
  source?: string;
  mode?: AnalysisMode;
}

export interface DiaryEntry {
  id: string;
  timestamp: number;
  substances: string[];
  analysis: AnalysisResult;
}

export interface IdentificationResult {
  recognized: boolean;
  databaseKey: string | null;
  identifiedAs: string;
  originalTerm: string;
  confidence: number;
}

export type DiaryData = Record<string, DiaryEntry[]>;

export enum AppState {
  CALENDAR = 'CALENDAR',
  RECORDING = 'RECORDING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
