const fs = require('fs-extra');
const path = require('path')
const constants = require('../../lib/constants'); 

module.exports = {
    name: 'enable',
    alias: ['add'],
    run: async (context) => {
        const { projectConfig, amplifyMeta } = context.amplify.getProjectDetails();
        const backendDirPath = context.amplify.pathManager.getBackendDirPath(projectConfig.projectPath); 
        const categoryDirPath = path.join(backendDirPath, constants.CategoryName); 
        const defaultServiceUnitPath = path.join(categoryDirPath, 'default'); 
        fs.ensureDirSync(defaultServiceUnitPath); 

        const defaultServiceTemplateFilePath = path.join(defaultServiceUnitPath, 'hosting-cloudformation-template.json')
        const sourceTemplateFilePath = path.join(__dirname, '../../lib/cloudFormationTemplate.json'); 

        fs.copyFileSync(sourceTemplateFilePath, defaultServiceTemplateFilePath); 
    },
};


  