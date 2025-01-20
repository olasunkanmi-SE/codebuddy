export const createTableQuery = () => {
  return [
    "DROP TABLE IF EXISTS code_functions",
    `CREATE TABLE IF NOT EXISTS code_functions (
      class_name TEXT NOT NULL,
      function_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      embedding F32_BLOB(768) NOT NULL
    )`,
    "CREATE INDEX IF NOT EXISTS code_functions_idx ON code_functions (libsql_vector_idx(embedding))",
  ];
};

export const insertDataQuery = (values: string) => {
  return [
    `INSERT INTO code_functions (class_name, function_name, file_path, created_at, embedding) 
          VALUES ${values}`,
  ];
};

export const selectFunctionProps = () => {
  return `
        SELECT 
          class_name,
          function_name,
          file_path,
          created_at
        FROM vector_top_k('code_functions_idx', ?, ?) 
        JOIN code_functions ON code_functions.rowid = id`;
};
