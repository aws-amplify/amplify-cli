import path from 'path';
import { InvocationRequest} from 'amplify-function-plugin-interface';
import {constants} from './constants'
import childProcess from 'child_process';
export async function invokeResource(request: InvocationRequest , context : any){
  const cp = childProcess.spawnSync('java', [ '-jar', 'localinvoke-all.jar' ,request.handler , request.event], { cwd: constants.shimBinPath , stdio : 'pipe' , encoding: 'utf-8' });

  let result  = JSON.stringify(cp.stdout);
  try {
    result = JSON.parse(result);
  } catch (err) {
    context.print.warning('Could not parse function output as JSON. Using raw output.');
  }
  return Promise.resolve({result});
};

