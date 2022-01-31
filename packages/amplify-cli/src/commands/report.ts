import { stateManager, pathManager, PathConstants, NotInitializedError, $TSContext } from "amplify-cli-core";
import archiver from 'archiver';
import * as fs from 'fs-extra';
import _ from "lodash";
import * as path from 'path';
import url from 'url';
const report = 'https://5h7ammarg5.execute-api.us-east-1.amazonaws.com/dev/report'
import FormData from 'form-data'
import fetch from 'node-fetch';
import { prompter } from 'amplify-prompts';
import * as crypto from 'crypto';
export async function run(context: $TSContext) {

    const rootpath = pathManager.findProjectRoot();
    const confirmation = await prompter.confirmContinue('Report this issue to Amplify CLI team?');
    if(!confirmation.valueOf())
        return;

    const email = await prompter.input("Enter email for communication", {
        initial: 'myname@gmail.com'
    });
    const description = await prompter.input("Enter brief description", {
        initial: "Receiving error 'Resource Not Ready' on push"
    });
    if (!rootpath) {
        throw new NotInitializedError();
    }

    const { projectEnvIdentifier, projectIdentifier } = hashedProjectIdentifiers();
    const backend = stateManager.getBackendConfig(rootpath);
    const resources : { category: string, resourceName: string, service: string }[] = [];
    const categoryResources = Object.keys(backend)
        .reduce((array, key) => {
            Object.keys(backend[key])
                .forEach((resourceKey) => {
                    array.push({
                        category: key,
                        resourceName: resourceKey,
                        service: backend[key][resourceKey].service
                    })
                })

            return array
        },resources)
        .map(amplifyResource => filesMap[amplifyResource.category](amplifyResource.category, amplifyResource.resourceName, amplifyResource.service))
    const files = _.flatten(categoryResources);
    files.push(pathManager.getCLIJSONFilePath(rootpath));
    files.push(pathManager.getBackendConfigFilePath(rootpath));
    const output = fs.createWriteStream(path.join(rootpath, 'example.zip'));
    const zipper = archiver.create('zip', {});
    zipper.pipe(output);
    files.forEach(file => {
        zipper.append(fs.createReadStream(file), {
            name: path.relative(rootpath, file),
        })
    });
    if(context.exeInfo && context.exeInfo.cloudformationEvents) {
        zipper.append(context.exeInfo.cloudformationEvents, {
            name: 'cloudformation_log.txt'
        })
    }
    zipper.finalize();
    return new Promise((resolve, reject) => {
        output.on('close',() => {
        sendFile(path.join(rootpath, 'example.zip'), { email, description, projectEnvIdentifier, projectIdentifier }).then(() => {
            resolve('')
        })

        });
        output.on('error', reject);
    })

}

function createTree(filePath: string[]):any {
    let result: any[] = [];
    let level = {result};
    filePath.forEach(path => {
        path.split('/').reduce((r, name, i, a) => {
          if(!r[name]) {
            r[name] = {result: []};
            r.result.push({name, children: r[name].result})
          }
          return r[name];
        }, level)
      })

    return result;
}

async function sendFile(zipPath: string, metaData: {}) {
    const stream = fs.readFileSync(zipPath);
    const stat = fs.statSync(zipPath);
    const form = new FormData()
    // new File([stream], '',{})
    // form.append('file', new File(stream.buffer, 'example.zip'));
    form.append('file', stream, {
        filename: 'example.zip',
    });
    form.append('metadata', JSON.stringify(metaData),{
        contentType: 'application/json',
    });
    console.log(zipPath);
    await fetch(report, {
        method: 'POST',
        headers: form.getHeaders(),
        body: form,
    }).then(() => {})
}

function hashedProjectIdentifiers(): { projectIdentifier: string, projectEnvIdentifier: string  } {
    const projectConfig = stateManager.getProjectConfig();
    const envName = stateManager.getCurrentEnvName();
    const appid = getAppId();
    const projectIdentifier = crypto.createHash('md5').update(`${projectConfig.projectName}-${appid}`).digest('hex');
    const projectEnvIdentifier = crypto.createHash('md5').update(`${projectConfig.projectName}-${appid}-${envName}`).digest('hex');
    return {
        projectIdentifier,
        projectEnvIdentifier
    };
}

function getAppId(): string {
    const meta = stateManager.getMeta();
    return _.get(meta, ['providers', 'awscloudformation', 'AmplifyAppId']);
}

const filesMap = {
    api: getApiFiles,
    auth: getAuthFiles,
    storage: getStorageFiles,
    function: getFunctionFiles,
}

function getAuthFiles(category: string, resource: string, service: string): string[] {
    const resourceDirectory = pathManager.getResourceDirectoryPath(undefined, category, resource);

    if(service === 'Cognito-UserPool-Groups') {
        return ['user-pool-group-precedence.json', path.join('build', 'parameters.json'), 'override.ts' ]
        .map(r => path.join(resourceDirectory, r))
        .filter(r => fs.existsSync(r));
    }

    if(service === 'Cognito') {
        return ['cli-inputs.json', path.join('build', 'parameters.json'), 'override.ts']
    .map(r => path.join(resourceDirectory, r))
    .filter(r => fs.existsSync(r));
    }

    return []
}

function getStorageFiles(category: string, resource: string, service: string): string[] {
    const resourceDirectory = pathManager.getResourceDirectoryPath(undefined, category, resource);

    return ['cli-inputs.json', path.join('build', 'parameters.json'), 'override.ts']
    .map(r => path.join(resourceDirectory, r))
    .filter(r => fs.existsSync(r));
}

function getApiFiles(category: string, resource: string, service: string): string[] {
    const resourceDirectory = pathManager.getResourceDirectoryPath(undefined, category, resource);

    if(service === 'AppSync') {
        return ['cli-inputs.json', 'parameters.json', 'transfer.conf.json', 'schema.graphql', 'override.ts']
        .map(r => path.join(resourceDirectory, r))
        .filter(r => fs.existsSync(r));
    }

    if(service === 'API Gateway') {
        return ['cli-inputs.json', path.join('build', 'parameters.json'), 'override.ts']
        .map(r => path.join(resourceDirectory, r))
        .filter(r => fs.existsSync(r));
    }


    return [];
}

function getFunctionFiles(category: string, resource: string, service: string): string[] {
    const resourceDirectory = pathManager.getResourceDirectoryPath(undefined, category, resource);

    if(service === 'Lambda'){
        const amplifyState = 'amplify.state';
        const parameters = 'function-parameters.json';
        const customPolicies = 'custom-policies.json';
        const packageJson = path.join('src', 'package.json');
        return [amplifyState, parameters, customPolicies, packageJson]
            .map(r => path.join(resourceDirectory, r))
            .filter( r => fs.existsSync(r))
    }

    if(service === 'LambdaLayer') {
        const layerConfiguration = 'layer-configuration.json';
        const parameters = 'parameters.json';
        const packageJson = path.join('lib', 'nodejs', 'package.json');
        return [
            layerConfiguration,
            parameters,
            packageJson,
        ].map(r => path.join(resourceDirectory, r))
        .filter( r => fs.existsSync(r));
    }
    return [];
}