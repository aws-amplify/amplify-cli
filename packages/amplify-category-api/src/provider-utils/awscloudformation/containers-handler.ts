import { serviceMetadataFor } from './utils/dynamic-imports';
import fs from 'fs-extra';
import path from 'path';
import { parametersFileName, cfnParametersFilename, rootAssetDir } from './aws-constants';

export const addResource = async (serviceWalkthroughPromise: Promise<any>, context, category, service, options) => {
    let { cfnFilename } = await serviceMetadataFor(service);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const walkthroughOptions = await serviceWalkthroughPromise;

    const { resourceName, containerName, authName } = walkthroughOptions;

    const dependsOn = [];

    dependsOn.push(
        {
            "category": "auth",
            "resourceName": authName,
            "attributes": [
                "UserPoolId"
            ]
        });

    dependsOn.push(
        {
            "category": "function",
            "resourceName": containerName,
            "attributes": [
                "TaskDefinitionArn"
            ]
        }
    )

    options = { resourceName, containerName, dependsOn, ...options };

    const containerTemplateFilePath = path.join(rootAssetDir, 'cloudformation-templates', cfnFilename);
    const containerTemplate = JSON.parse(fs.readFileSync(containerTemplateFilePath, 'utf8'));

    const functionFullName = `function${containerName}TaskDefinitionArn`
    containerTemplate['Parameters'][functionFullName] = {
        "Type": "String"
    }
    containerTemplate['Resources']['MyServiceB4132EDA']['Properties']['TaskDefinition'] = {
        "Ref": functionFullName
    }

    const authFullName = `auth${authName}UserPoolId`;
    containerTemplate['Parameters'][authFullName] = {
        "Type": "String"
    }
    containerTemplate['Resources']['MyAuthorizer']['Properties']['ProviderARNs'][0]['Fn::Join'][1].push({
        "Ref": authFullName
    })

    containerTemplate['Outputs']['ApiName']['Value'] = resourceName;

    const parametersObj = {
        "ParamContainerPort": 8080
    }

    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

    fs.ensureDirSync(resourceDirPath);
    
    fs.writeFileSync(path.join(resourceDirPath, 'container-template.json'), JSON.stringify(containerTemplate, null, 2));
    fs.writeFileSync(path.join(resourceDirPath, 'parameters.json'), JSON.stringify(parametersObj, null, 2));

    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

    return resourceName;
}