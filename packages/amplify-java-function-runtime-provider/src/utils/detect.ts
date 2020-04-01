import childProcess from 'child_process';
import * as semver from 'semver';
import { constants } from './constants';

export async function checkJava() {
  var javaSpawn = childProcess.spawnSync('java', ['-version'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (javaSpawn.stderr !== null) {
    let data : string = javaSpawn.output.toString().split(/\r?\n/)[0];
    let javaVersion = data.match(regex);
    if(javaVersion != null){
      if (!semver.satisfies(javaVersion[0], constants.minJavaVersion)) {
        throw new Error(`Update JDK to ${constants.minJavaVersion}`);
      }
    }
  } else {
    throw new Error(`install JDK ${constants.minJavaVersion}`);
  }
  return true;
}

export async function checkGradle() {
  var gradleSpawn = childProcess.spawnSync('gradle', ['-v'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (gradleSpawn.stderr !== null) {
    let data : string = gradleSpawn.output.toString().split(/\r?\n/)[2];
    let gradleVersion = data.match(regex);
    if(gradleVersion != null){
      if (!semver.satisfies(gradleVersion[0], constants.mingradleVersion)) {
        throw new Error(`Update Gradle to ${constants.mingradleVersion}`);
      }
    }
  } else {
    throw new Error(`Install Gradle ${constants.mingradleVersion}`);
  }
  return true;
}

export async function checkJavaCompiler() {
  var javaSpawn = childProcess.spawnSync('javac', ['-version'], {stdio : 'pipe' , encoding: 'utf-8' })
  const regex = /(\d+\.)(\d+\.)(\d)/g;
  if (javaSpawn.stderr !== null) {
    let data : string = javaSpawn.output.toString().split(/\r?\n/)[0];
    let javaVersion = data.match(regex);
    if(javaVersion != null){
      if (!semver.satisfies(javaVersion[0], constants.minJavaVersion)) {
        throw new Error(`Update JDK to ${constants.minJavaVersion}`);
      }
    }
  } else {
    throw new Error(`Install JDK ${constants.minJavaVersion}`);
  }
  return true;
}
