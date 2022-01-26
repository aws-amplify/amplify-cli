// indexes next to each resolver can help to match the resolver to the snapshot files
export const expectedResolversForModelWithRenamedField = (modelName: string) => [
  // create resolver sequence
  `Mutation.create${modelName}.init.2.req.vtl`, // 1
  `Mutation.create${modelName}.preUpdate.1.req.vtl`, // 2
  `Mutation.create${modelName}.preUpdate.1.res.vtl`, // 3
  `Mutation.create${modelName}.postUpdate.1.res.vtl`, // 4

  // update resolver sequence
  `Mutation.update${modelName}.init.2.req.vtl`, // 5
  `Mutation.update${modelName}.preUpdate.1.req.vtl`, // 6
  `Mutation.update${modelName}.preUpdate.1.res.vtl`, // 7
  `Mutation.update${modelName}.postUpdate.1.res.vtl`, // 8

  // delete resolver sequence
  `Mutation.delete${modelName}.init.1.req.vtl`, // 9
  `Mutation.delete${modelName}.preUpdate.1.req.vtl`, // 10
  `Mutation.delete${modelName}.preUpdate.1.res.vtl`, // 11
  `Mutation.delete${modelName}.postUpdate.1.res.vtl`, // 12

  // get resolver sequence
  `Query.get${modelName}.postDataLoad.1.res.vtl`, // 13

  // list resolver sequence
  // NOTE: don't choose a test model name that is affected by improved pluralization
  `Query.list${modelName}s.preDataLoad.1.req.vtl`, // 14
  `Query.list${modelName}s.preDataLoad.1.res.vtl`, // 15
  `Query.list${modelName}s.postDataLoad.1.res.vtl`, // 16
];
