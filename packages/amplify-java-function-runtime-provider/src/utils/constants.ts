import path from 'path';
let shimSrcPath = path.resolve(`${__dirname}/../../resources/localinvoke`);
let shimBinaryName = 'latest_build.jar';
let shimBinPath = path.join(shimSrcPath, 'build','libs');
export const constants = {
  minJavaVersion: '>=11',
  mingradleVersion: '>=5',
  shimSrcPath: shimSrcPath,
  shimBinPath: shimBinPath,
  shimBinaryName: shimBinaryName
};