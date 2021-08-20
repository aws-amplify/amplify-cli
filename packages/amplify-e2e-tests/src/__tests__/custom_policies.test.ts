import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { initJSProjectWithProfile, deleteProject, amplifyPush } from 'amplify-e2e-core';
import { addFunction, addLambdaTrigger } from 'amplify-e2e-core';
import { addSimpleDDB } from 'amplify-e2e-core';
import { readJsonFile } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import path from 'path';
import _ from 'lodash';
import { addRestContainerApi, amplifyConfigureProject } from 'amplify-e2e-core';

const customPoliciesWithNoError = {
    policies: [
        {
            Effect: 'Allow',
            Action: [
                's3:ListBucketMultipartUploads',
                's3:ListBucketVersions',
                's3:ListBucket'
            ],
            Resource: ['arn:aws:s3:::*']
        },
        {
            Effect: 'Allow',
            Action: ['s3:ListMultipartUploadParts'],
            Resource: ['arn:aws:s3:::*/*']
        }
    ]
}

async function setupAmplifyProject(cwd: string) {
    await amplifyConfigureProject({
      cwd,
      enableContainers: true
    });
  }

describe('nodejs', () => {
    describe('amplify add function', () => {
        let projRoot: string;
    
        beforeEach(async () => {
          projRoot = await createNewProjectDir('functions');
        });
    
        afterEach(async () => {
          await deleteProject(projRoot);
          deleteProjectDir(projRoot);
        });

        it(`should init and deploy storage DynamoDB + Lambda trigger, attach custom policies to the Lambda`, async () => {
            const fnName = `addCustompoliciesToFunction`;
            
            await initJSProjectWithProfile(projRoot, {});
            await addSimpleDDB(projRoot, {});
            await addFunction(
              projRoot,
              {
                name: fnName,
                functionTemplate: 'Lambda trigger',
                triggerType: 'DynamoDB',
                eventSource: 'DynamoDB',
              },
              'nodejs',
              addLambdaTrigger,
            );

            const customPoliciesPath = pathManager.getCustomPoliciesPath('function', fnName);
            JSONUtilities.writeJson(customPoliciesPath, customPoliciesWithNoError);

            await amplifyPush(projRoot);
            const lambdaCFN = readJsonFile(
                path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
            );
            expect(lambdaCFN.Resources.CustomLambdaExecutionPolicy.Properties.PolicyDocument.Statement.length).toBe(2);
        });

        it(`should init and deploy an api container, attach custom policies to the container`, async () => {
            const name = `addCustomPoliciesToContainer`
            await initJSProjectWithProfile(projRoot, { name });
            await setupAmplifyProject(projRoot);
            await addRestContainerApi(projRoot);

            const customPoliciesPath = pathManager.getCustomPoliciesPath('api', name);
            JSONUtilities.writeJson(customPoliciesPath, customPoliciesWithNoError);

            await amplifyPush(projRoot);
            const lambdaCFN = readJsonFile(
                path.join(projRoot, 'amplify', 'backend', 'api', name, `${name}-cloudformation-template.json`),
            );
            expect(lambdaCFN.Resources.CustomExecutionPolicyForContainer.Properties.PolicyDocument.Statement.length).toBe(2);
        })
    });
});

