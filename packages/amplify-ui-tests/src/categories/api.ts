import * as nexpect from 'nexpect';
import * as fs from 'fs';

import { getCLIPath, isCI } from '../utils';
const defaultSettings = {
  apiName: 'CLIIntegTestApi',
};

export function readSchemaDocument(schemaName: string): string {
  const docPath = `${__dirname}/../../schemas/${schemaName}.graphql`
  if (fs.existsSync(docPath)) {
    return fs.readFileSync(docPath).toString();
  } else {
    throw new Error(`Could not find schema at path '${docPath}'`);
  }
}

function getSchemaPath(schemaName: string): string {
  return  `${__dirname}/../../schemas/${schemaName}.graphql`;
}

export function addApiWithSimpleModel(
  cwd: string,
  settings: any = {},
  verbose: boolean = !isCI()
) {
  settings = {...defaultSettings, ...settings};
  const schemaName: string = settings.schemaName ? settings.schemaName : 'simple_model';
  readSchemaDocument(schemaName);
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendline('\r')
      .wait('Provide API name:')
      .sendline(settings.apiName)
      .wait('Choose an authorization type for the API')
      .sendline('j\r')
      .wait('Do you have an annotated GraphQL schema?')
      .sendline('y\r')
      .wait('Provide your schema file path:')
      .sendline(getSchemaPath(schemaName))
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}
