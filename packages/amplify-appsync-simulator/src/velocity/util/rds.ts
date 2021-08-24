const serializeRdsObject = rdsObject => {
  return (rdsObject?.sqlStatementResults ?? []).map(statement =>
    (statement?.records ?? []).map(record => {
      const result = {};
      record.forEach((row, index) => {
        result[statement?.columnMetadata?.[index]?.name] = Object.values(row)?.[0];
      });
      return result;
    }),
  );
};

export const rds = {
  toJsonString: rdsObject => {
    try {
      rdsObject = JSON.parse(rdsObject);
      const rdsJson = serializeRdsObject(rdsObject);
      return JSON.stringify(rdsJson);
    } catch {
      return '';
    }
  },

  toJsonObject: rdsString => {
    try {
      const rdsObject = JSON.parse(rdsString);
      return serializeRdsObject(rdsObject);
    } catch (ex) {
      return '';
    }
  },
};
