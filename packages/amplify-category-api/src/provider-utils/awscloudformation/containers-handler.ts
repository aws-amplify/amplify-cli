import { serviceMetadataFor } from './utils/dynamic-imports';
import fs from 'fs-extra';
import path from 'path';
import { parametersFileName, cfnParametersFilename, rootAssetDir } from './aws-constants';

export const addResource = async (serviceWalkthroughPromise: Promise<any>, context, category, service, options) => {
    let { cfnFilename } = await serviceMetadataFor(service);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const walkthroughOptions = await serviceWalkthroughPromise;

    const { resourceName } = walkthroughOptions;
    
    const containerTemplateFilePath = path.join(rootAssetDir, 'cloudformation-templates', cfnFilename);
    const containerTemplate = JSON.parse(fs.readFileSync(containerTemplateFilePath, 'utf8'));

    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    fs.ensureDirSync(resourceDirPath);
    fs.writeFileSync(path.join(resourceDirPath, 'container-template.json'), JSON.stringify(containerTemplate, null, 2));
    
    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, walkthroughOptions);

    return resourceName;
}