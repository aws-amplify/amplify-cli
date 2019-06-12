import * as nexpect from 'nexpect';
import { join } from 'path';
import * as fs from 'fs';

import { getCLIPath, isCI } from '../utils';
const defaultSettings = {
  projectName: 'CLIIntegTestApi',
};

function readSchemaDocument(schemaName: string): string {
  const docPath = `${__dirname}/../../schemas/${schemaName}.graphql`
  if (fs.existsSync(docPath)) {
    return fs.readFileSync(docPath).toString();
  } else {
    throw new Error(`Could not find schema at path '${docPath}'`);
  }
}

function getSchemaPath(schemaName: string): string {
  return  `${__dirname}/../../schemas/${schemaName}`;
}

export function addApiWithSimpleModel(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendline('\r')
      .wait('Provide API name:')
      .sendline('\r')
      .wait(/.*Choose an authorization type for the API.*/)
      .sendline('\r')
      .wait('Do you have an annotated GraphQL schema?')
      .sendline('y')
      .wait('Provide your schema file path:')
      .sendline(getSchemaPath('simple_model.graphql'))
      // tslint:disable-next-line
      .wait('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}
