import { ResultSet, Row } from "@libsql/client";

export interface ICodeRepository {
  createFunctionsTable(): Promise<ResultSet | undefined>;
  insertFunctions(values: string): Promise<ResultSet | undefined>;
  searchSimilarFunctions(queryEmbeddings: number[], limit: number): Promise<Row[] | undefined>;
}
