/*
import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import childProcess from 'child_process';
import { InvokeRequest, InvokeResult } from 'amplify-function-plugin-interface';

export async function invoke(request: InvokeRequest): Promise<InvokeResult> {
  return new Promise<InvokeResult>((resolve, reject) => {
    const shimPath = path.join(request.srcRoot, 'InvocationShim');

    const buildCommand = childProcess.spawn('dotnet', ['run'], { cwd: shimPath });
    buildCommand.on('close', (code) => {
    if (code === 0) {
        return Promise.resolve({ rebuilt: true });
    } else {
        return Promise.resolve({ rebuilt: false });
    }
    });
  });
};
*/
