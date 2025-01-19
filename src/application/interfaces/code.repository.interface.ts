import { ResultSet, Row } from "@libsql/client/.";

export interface ICodeRepository {
  CreateTable(values: string): Promise<ResultSet[] | undefined>;
  searchSimilarFunctions(
    queryEmbeddings: number[],
    limit: number
  ): Promise<Row[] | undefined>;
}
