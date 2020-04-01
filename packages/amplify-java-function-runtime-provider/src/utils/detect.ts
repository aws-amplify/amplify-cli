import childProcess from 'child_process';
import * as semver from 'semver';
import { constants } from './constants';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';


export async function checkJava() : Promise<CheckDependenciesResult>{
  var result: CheckDependenciesResult = {
    hasRequiredDependencies: true,
  };
  const javaSpawn = childProcess.spawnSync('java', ['-version'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (javaSpawn.stderr !== null) {
    let data : string = javaSpawn.output.toString().split(/\r?\n/)[0];
    let javaVersion = data.match(regex);
    if(javaVersion != null){
      if (!semver.satisfies(javaVersion[0], constants.minJavaVersion)) {
        result.hasRequiredDependencies = false;
        result.errorMessage = `Update JDK to ${constants.minJavaVersion}. Download link: https://amzn.to/2UUljp9`;
      }
    }
  } else {
    result.hasRequiredDependencies = false;
    result.errorMessage = `Install JDK ${constants.minJavaVersion}. Download link: https://amzn.to/2UUljp9`;
  }
  return result;
}

export async function checkGradle() : Promise<CheckDependenciesResult>{
  var result: CheckDependenciesResult = {
    hasRequiredDependencies: true,
  };
  const gradleSpawn = childProcess.spawnSync('gradle', ['-v'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (gradleSpawn.stderr !== null) {
    let data : string = gradleSpawn.output.toString().split(/\r?\n/)[2];
    let gradleVersion = data.match(regex);
    if(gradleVersion != null){
      if (!semver.satisfies(gradleVersion[0], constants.mingradleVersion)) {
        result.hasRequiredDependencies = true;
        result.errorMessage = `Update Gradle to ${constants.mingradleVersion}. Update link: https://bit.ly/3aGYDj6`;
      }
    }
  } else {
    result.hasRequiredDependencies = false;
    result.errorMessage = `Install Gradle ${constants.mingradleVersion}. Download link: https://bit.ly/3aGYDj6`;
  }
  return result;
}

export async function checkJavaCompiler() {
  var result: CheckDependenciesResult = {
    hasRequiredDependencies: true,
  };
  const javaSpawn = childProcess.spawnSync('javac', ['-version'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (javaSpawn.stderr !== null) {
    let data : string = javaSpawn.output.toString().split(/\r?\n/)[0];
    let javaVersion = data.match(regex);
    if(javaVersion != null){
      if (!semver.satisfies(javaVersion[0], constants.minJavaVersion)) {
        result.hasRequiredDependencies = false;
        result.errorMessage = `Update JDK to ${constants.minJavaVersion}. Update link: https://amzn.to/2UUljp9`;
      }
    }
  } else {
    result.hasRequiredDependencies = false;
    result.errorMessage = `Install JDK ${constants.minJavaVersion}. Download link: https://amzn.to/2UUljp9`;
  }
  return result;
}
