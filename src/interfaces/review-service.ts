export interface PendingChange {
  id: string;
  filePath: string;
  originalContent: string;
  newContent: string;
  timestamp: number;
  status: "pending" | "applied" | "rejected";
  isNewFile: boolean;
}

export interface IReviewService {
  addPendingChange(
    filePath: string,
    newContent: string,
    autoApply?: boolean,
  ): Promise<PendingChange>;
}
