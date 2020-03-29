import path from 'path';
import { InvocationRequest} from 'amplify-function-plugin-interface';
import childProcess from 'child_process';
export async function invokeResource(request: InvocationRequest , context : any){
  const shimPath = path.join(request.srcRoot, 'src','Mock','build','libs');
  const cp = childProcess.spawnSync('java', [ '-jar', 'Mock-all.jar' ,request.handler , request.event], { cwd: shimPath , stdio : 'pipe' , encoding: 'utf-8' });

  let result  = JSON.stringify(cp.stdout);
  try {
    result = JSON.parse(result);
  } catch (err) {
    context.print.warning('Could not parse function output as JSON. Using raw output.');
  }
  return Promise.resolve({result});
};

