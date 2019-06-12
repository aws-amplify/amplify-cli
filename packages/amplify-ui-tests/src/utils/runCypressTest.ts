import * as nexpect from 'nexpect';
import { isCI } from '.';


export function runCypressTest(
    cwd: string,
    settings: { platform: string },
    verbose: boolean = !isCI()
) {
    return new Promise((resolve,reject) => {
        nexpect
            .spawn('npm', ['run', 'cypress:' + settings.platform], {cwd, stripColors: true, verbose})
            .wait(/.*/)
            .run(function(err: Error) {
                if (!err) {
                    resolve();
                } else {
                    reject(err)
                }
            });
    })
}