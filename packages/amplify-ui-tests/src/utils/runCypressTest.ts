import * as nexpect from 'nexpect';
import { isCI } from '.';


export function runCypressTest(
    cwd: string,
    settings: { platform: string, category: string},
    verbose: boolean = !isCI()
) {
    let isPassed: boolean = false;
    return new Promise((resolve, reject) => {
        nexpect
            .spawn('npm', ['run', 'cypress:' + settings.platform + ':' + settings.category], {cwd, stripColors: true, verbose})
            .wait('failing')
            .run(function(err: Error) {
                if (err) {
                    // ‘failing' does not occur in command line, so the all the tests are passed.
                    isPassed = true;
                }
                resolve(isPassed);
            });
    })
}