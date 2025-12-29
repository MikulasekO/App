
export type RiskLevel = 'Nízké' | 'Střední' | 'Vysoké' | 'Kritické' | 'Neznámé';

export interface AnalysisResult {
  substances: string;
  riskLevel: RiskLevel;
  keyDanger: string;
  mechanism: string;
  warning: string;
  rawResponse: string;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
