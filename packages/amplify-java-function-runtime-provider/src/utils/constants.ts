import path from 'path';

export const shimSrcPath = path.resolve(`${__dirname}/../../resources/localinvoke`);
export const shimBinaryName = 'latest_build.jar';
export const shimBinPath = path.join(shimSrcPath, 'build', 'libs');
export const minJavaVersion = '>=11';
export const minGradleVersion = '>=5';
