
export interface ResonancePlate {
  id: number;
  domain: string;
  medium: string;
  inputGlyph: string;
  transductionChain: string;
  menomics: string;
  refinedOperator: string;
  refinedOperatorDescription: string;
  ucfFeedback: string;
}

export interface OmegaAudit {
  drift: string;
  stabilization: string;
  projection: string;
  recursion: string;
  finalOperator?: string;
  status?: string;
}

export interface CoherenceOutputVOmega {
  plates: ResonancePlate[];
  audit: OmegaAudit;
}

export interface OracleResponse {
  primaryAnalysis: string;
  divergentStreams: {
    title: string;
    content: string;
  }[];
}
