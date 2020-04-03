import path from 'path';

export const shimPath = path.resolve(path.join(__dirname, '..', '..', 'resources', 'localinvoke'));
export const shimJarPath = path.join(shimPath, 'lib', 'localinvoke.jar');
export const minJavaVersion = '>=11';
export const minGradleVersion = '>=5';
