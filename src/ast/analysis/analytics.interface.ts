import { ElementType, ICodeElement } from "../query-types";

export interface IScoredElement {
  element: ICodeElement;
  score: number;
  reasons: string[];
}

export interface IRelevanceConfig {
  minScore?: number;
  maxElements?: number;
  prioritizeTypes?: ElementType[];
  requireKeywordInName?: boolean;
  includeChildren?: boolean;
}
