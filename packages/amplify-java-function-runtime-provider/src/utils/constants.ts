import * as path from 'path';

export const packageName = 'amplify-java-function-runtime-provider';
export const relativeShimSrcPath = path.join('resources', 'localinvoke');
export const relativeShimJarPath = path.join(relativeShimSrcPath, 'lib', 'localinvoke.jar');
export const minJavaVersion = '>=11';
export const minGradleVersion = '>=5';
