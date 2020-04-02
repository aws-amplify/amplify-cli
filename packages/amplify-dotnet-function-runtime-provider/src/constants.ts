import path from 'path';

export const shimSrcPath = path.resolve(`${__dirname}/../resources/localinvoke`);
export const shimBinaryName = 'InvocationShim.dll';
export const shimBinPath = path.join(shimSrcPath, 'bin');
export const shimExecutablePath = path.join(shimBinPath, shimBinaryName);
export const currentSupportedVersion = '3.1';
export const dotnetcore31 = 'dotnetcore3.1';
export const handlerMethodName = 'LambdaHandler';
export const executableName = 'dotnet';
