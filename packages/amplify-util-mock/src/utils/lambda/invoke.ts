import { fork } from 'child_process';
import * as path from 'path';

export function invoke(options) {
    return new Promise((resolve, reject) => {
        try {
            // XXX: Make the path work in both e2e and
            const lambdaFn = fork(path.join(__dirname, '../../../lib/utils/lambda', 'execute.js'), [], {
                execArgv: []
            });
            lambdaFn.on('message', msg => {
                const result = JSON.parse(msg);
                if (result.error) {
                    reject(result.error);
                }
                resolve(result.result);
            });
            lambdaFn.send(JSON.stringify(options));
        } catch (e) {
            reject(e);
        }
    });
}
