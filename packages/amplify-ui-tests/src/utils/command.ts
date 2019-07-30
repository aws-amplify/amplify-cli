import * as nexpect from 'nexpect';
import { isCI } from '.';

//30s to start server
const SEVER_LAUNCH_TIME: number = 30000;

export function gitCloneSampleApp(
    cwd: string,
    settings: { repo: string},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('git', ['clone', '-b', 'dev', '--single-branch', settings.repo], {cwd, stripColors: true, verbose})
        .run(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

export function buildApp(
    cwd: string,
    settings: any,
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('npm', ['run', 'setup-dev'], {cwd, stripColors: true, verbose})
        .run(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

export function runCypressTest(
    cwd: string,
    settings: { platform: string, category: string},
    verbose: boolean = true
) {
    let isPassed: boolean = true;
    return new Promise((resolve) => {
        nexpect
            .spawn('npm', ['run', 'cypress:' + settings.platform + ':' + settings.category], {cwd, stripColors: true, verbose})
            .wait('All specs passed!')
            .run(function(err: Error) {
                if (err) {
                    isPassed = false;
                }
                resolve(isPassed);
            });
    })
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startServer(
    cwd: string,
    settings: {category: string},
    verbose: boolean = !isCI()
) {
    nexpect.spawn('yarn', ['start:' + settings.category], {cwd, stripColors: true, verbose})
    .run((err: Error) => {
        if (err) {
            console.log(err)
        }
    })
    //waiting for the server to launch
    await sleep(SEVER_LAUNCH_TIME);
}

export function closeServer(
    cwd: string,
    settings: {port: string},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('lsof', ['-t', '-i:' + settings.port], {cwd, stripColors: true, verbose})
        .run((err, output) => {
            if (err) {
                reject(err);
            } else {
                nexpect.spawn('kill', ['-9', ...output], {cwd, stripColors: true, verbose})
                .run(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            }
        })
    })
}
