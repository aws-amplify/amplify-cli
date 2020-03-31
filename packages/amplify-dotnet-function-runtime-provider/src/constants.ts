import path from 'path';
let shimSrcPath = path.resolve(`${__dirname}/../resources/localinvoke`);
const shimBinaryName = 'InvocationShim.dll';
const shimBinPath = path.join(shimSrcPath, 'bin');
const shimExecutablePath = path.join(shimBinPath, shimBinaryName);
export const constants = {
  dotnetcore21: 'dotnetcore2.1',
  dotnetcore31: 'dotnetcore3.1',
  handlerMethodName: 'LambdaHandler',
  shimSrcPath: shimSrcPath,
  shimBinPath: shimBinPath,
  shimExecutablePath: shimExecutablePath,
  shimBinaryName: shimBinaryName,
};
