import { topLevelCommentPrefix, topLevelCommentSuffix, envVarPrintoutPrefix } from '../../../../constants';
import { buildTopLevelComment, buildShowEnvVars  } from '../../../../provider-utils/awscloudformation/service-walkthroughs/lambda-walkthrough';



describe("Lambda Walkthrough : Advanced options and Environment Vars ", () => {
    test("buildTopLevelComment should insert all environment variables in top-level-comment (example code header)", () => {
            const inputEnvMap : Record<string, any> = {
              "ENV": {
                "Ref": "env"
              },
              "REGION": {
                "Ref": "AWS::Region"
              },
              "STORAGE_MOCK_BUCKETNAME": {
                "Ref": "storageMockBucketName"
              },
              "SES_EMAIL": {
                "Ref": "sesEmail"
              }
          }
          const outputString = `${topLevelCommentPrefix}ENV\n\tREGION\n\tSTORAGE_MOCK_BUCKETNAME\n\tSES_EMAIL${topLevelCommentSuffix}`
          expect( buildTopLevelComment( inputEnvMap ) ).toEqual(outputString);     
      
    });
    
    test("buildShowEnvVars should insert all environment variables to be displayed", () => {
        const inputEnvMap : Record<string, any> = {
            "ENV": {
              "Ref": "env"
            },
            "REGION": {
              "Ref": "AWS::Region"
            },
            "STORAGE_MOCK_BUCKETNAME": {
              "Ref": "storageMockBucketName"
            },
            "SES_EMAIL": {
              "Ref": "sesEmail"
            }
        }
        const outputString = `${envVarPrintoutPrefix}ENV\n\tREGION\n\tSTORAGE_MOCK_BUCKETNAME\n\tSES_EMAIL`;
        expect( buildShowEnvVars( inputEnvMap ) ).toEqual(outputString);     
    });
    
});