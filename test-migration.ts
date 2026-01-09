#!/usr/bin/env node

import { Gen1ToGen2Migrator } from './gen2-migration-tool';
import * as fs from 'fs';
import * as path from 'path';

// Create a mock Gen 1 function CloudFormation template for testing
function createMockGen1Function() {
  const mockDir = './test-amplify/backend/function/testFunction';
  fs.mkdirSync(mockDir, { recursive: true });

  const mockCfnTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {
      LambdaFunction: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          Environment: {
            Variables: {
              API_MYAPI_GRAPHQLAPIENDPOINTOUTPUT: {
                Ref: 'GraphQLAPIEndpointOutput',
              },
              API_MYAPI_GRAPHQLAPIIDOUTPUT: {
                Ref: 'GraphQLAPIIdOutput',
              },
              REGION: {
                Ref: 'AWS::Region',
              },
            },
          },
        },
      },
      LambdaExecutionRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          Policies: [
            {
              PolicyName: 'LambdaExecutionPolicy',
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['appsync:GraphQL'],
                    Resource: [
                      {
                        'Fn::Sub': [
                          'arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${GraphQLAPIId}/*',
                          {
                            GraphQLAPIId: {
                              Ref: 'GraphQLAPIIdOutput',
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['appsync:GraphQLMutation', 'appsync:GraphQLQuery'],
                    Resource: '*',
                  },
                ],
              },
            },
          ],
        },
      },
    },
  };

  fs.writeFileSync(path.join(mockDir, 'testFunction-cloudformation-template.json'), JSON.stringify(mockCfnTemplate, null, 2));

  console.log('Created mock Gen 1 function at:', mockDir);
}

// Test the migration tool
function testMigration() {
  console.log('🚀 Testing Gen 1 to Gen 2 Migration Tool\n');

  // Create mock data
  createMockGen1Function();

  // Run migration
  const migrator = new Gen1ToGen2Migrator('./test-amplify');
  const functionAccess = migrator.scanFunctionPermissions();

  console.log('📊 Scan Results:');
  functionAccess.forEach((func) => {
    console.log(`  Function: ${func.functionName}`);
    console.log(`  Permissions: ${func.permissions.length}`);
    console.log(`  Environment Variables: ${Object.keys(func.environmentVariables).length}`);
    console.log('');
  });

  // Generate escape hatches
  const escapeHatches = migrator.generateGen2EscapeHatches(functionAccess);

  console.log('📝 Generated Gen 2 Escape Hatches:');
  console.log('=====================================');
  console.log(escapeHatches);

  // Write to file
  fs.writeFileSync('./test-gen2-escape-hatches.ts', escapeHatches);
  console.log('✅ Escape hatches written to: test-gen2-escape-hatches.ts');

  // Cleanup
  fs.rmSync('./test-amplify', { recursive: true, force: true });
  console.log('🧹 Cleaned up test files');
}

if (require.main === module) {
  testMigration();
}
