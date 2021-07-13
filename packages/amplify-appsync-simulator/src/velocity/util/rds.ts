export const rds = {
  toJsonString: rdsObject => {
    try {
      rdsObject = JSON.parse(rdsObject);
      const rdsJson = (rdsObject?.sqlStatementResults ?? []).map(statement =>
        (statement?.records ?? []).map(record => {
          const result = {};
          record.forEach((row, index) => {
            result[statement?.columnMetadata?.[index]?.name] = Object.values(row)?.[0];
          });
          return result;
        }),
      );
      return JSON.stringify(rdsJson);
    } catch {
      return '';
    }
  },
};
