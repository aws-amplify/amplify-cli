"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyToolkit = void 0;
class AmplifyToolkit {
    constructor() {
        this.addCleanUpTask = (task) => {
            this._cleanUpTasks.push(task);
        };
        this.runCleanUpTasks = async (context) => {
            await Promise.all(this._cleanUpTasks.map((task) => task(context)));
        };
        this._cleanUpTasks = [];
    }
    get confirmPrompt() {
        return require('../extensions/amplify-helpers/confirm-prompt').confirmPrompt;
    }
    get constants() {
        return require('../extensions/amplify-helpers/constants').amplifyCLIConstants;
    }
    get constructExeInfo() {
        return require('../extensions/amplify-helpers/construct-exeInfo').constructExeInfo;
    }
    get copyBatch() {
        return require('../extensions/amplify-helpers/copy-batch').copyBatch;
    }
    get crudFlow() {
        return require('../extensions/amplify-helpers/permission-flow').crudFlow;
    }
    get deleteProject() {
        return require('../extensions/amplify-helpers/delete-project').deleteProject;
    }
    get executeProviderUtils() {
        return require('../extensions/amplify-helpers/execute-provider-utils').executeProviderUtils;
    }
    get getAllEnvs() {
        return require('../extensions/amplify-helpers/get-all-envs').getAllEnvs;
    }
    get getPlugin() {
        return require('../extensions/amplify-helpers/get-plugin').getPlugin;
    }
    get getCategoryPluginInfo() {
        return require('../extensions/amplify-helpers/get-category-pluginInfo').getCategoryPluginInfo;
    }
    get getAllCategoryPluginInfo() {
        return require('../extensions/amplify-helpers/get-all-category-pluginInfos').getAllCategoryPluginInfo;
    }
    get getFrontendPlugins() {
        return require('../extensions/amplify-helpers/get-frontend-plugins').getFrontendPlugins;
    }
    get getProviderPlugins() {
        return require('../extensions/amplify-helpers/get-provider-plugins').getProviderPlugins;
    }
    get getEnvDetails() {
        return require('../extensions/amplify-helpers/get-env-details').getEnvDetails;
    }
    get getEnvInfo() {
        return require('../extensions/amplify-helpers/get-env-info').getEnvInfo;
    }
    get getPluginInstance() {
        return require('../extensions/amplify-helpers/get-plugin-instance').getPluginInstance;
    }
    get getProjectConfig() {
        return require('../extensions/amplify-helpers/get-project-config').getProjectConfig;
    }
    get getProjectDetails() {
        return require('../extensions/amplify-helpers/get-project-details').getProjectDetails;
    }
    get getProjectMeta() {
        return require('../extensions/amplify-helpers/get-project-meta').getProjectMeta;
    }
    get getResourceStatus() {
        return require('../extensions/amplify-helpers/resource-status').getResourceStatus;
    }
    get getResourceOutputs() {
        return require('../extensions/amplify-helpers/get-resource-outputs').getResourceOutputs;
    }
    get getWhen() {
        return require('../extensions/amplify-helpers/get-when-function').getWhen;
    }
    get inputValidation() {
        return require('../extensions/amplify-helpers/input-validation').inputValidation;
    }
    get listCategories() {
        return require('../extensions/amplify-helpers/list-categories').listCategories;
    }
    get makeId() {
        return require('../extensions/amplify-helpers/make-id').makeId;
    }
    get openEditor() {
        return require('../extensions/amplify-helpers/open-editor').openEditor;
    }
    get onCategoryOutputsChange() {
        return require('../extensions/amplify-helpers/on-category-outputs-change').onCategoryOutputsChange;
    }
    get pathManager() {
        return require('../extensions/amplify-helpers/path-manager');
    }
    get pressEnterToContinue() {
        return require('../extensions/amplify-helpers/press-enter-to-continue');
    }
    get pushResources() {
        return require('../extensions/amplify-helpers/push-resources').pushResources;
    }
    get storeCurrentCloudBackend() {
        return require('../extensions/amplify-helpers/current-cloud-backend-utils').storeCurrentCloudBackend;
    }
    get readJsonFile() {
        return require('../extensions/amplify-helpers/read-json-file').readJsonFile;
    }
    get removeResource() {
        return require('../extensions/amplify-helpers/remove-resource').removeResource;
    }
    get sharedQuestions() {
        return require('../extensions/amplify-helpers/shared-questions').sharedQuestions;
    }
    get showHelp() {
        return require('../extensions/amplify-helpers/show-help').showHelp;
    }
    get showAllHelp() {
        return require('../extensions/amplify-helpers/show-all-help').showAllHelp;
    }
    get showHelpfulProviderLinks() {
        return require('../extensions/amplify-helpers/show-helpful-provider-links').showHelpfulProviderLinks;
    }
    get showResourceTable() {
        return require('../extensions/amplify-helpers/resource-status').showResourceTable;
    }
    get showStatusTable() {
        return require('../extensions/amplify-helpers/resource-status').showStatusTable;
    }
    get serviceSelectionPrompt() {
        return require('../extensions/amplify-helpers/service-select-prompt').serviceSelectionPrompt;
    }
    get updateProjectConfig() {
        return require('../extensions/amplify-helpers/update-project-config').updateProjectConfig;
    }
    get updateamplifyMetaAfterResourceUpdate() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateamplifyMetaAfterResourceUpdate;
    }
    get updateamplifyMetaAfterResourceAdd() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateamplifyMetaAfterResourceAdd;
    }
    get updateamplifyMetaAfterResourceDelete() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateamplifyMetaAfterResourceDelete;
    }
    get updateProviderAmplifyMeta() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateProviderAmplifyMeta;
    }
    get updateamplifyMetaAfterPush() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateamplifyMetaAfterPush;
    }
    get updateamplifyMetaAfterBuild() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateamplifyMetaAfterBuild;
    }
    get updateAmplifyMetaAfterPackage() {
        return require('../extensions/amplify-helpers/update-amplify-meta').updateAmplifyMetaAfterPackage;
    }
    get updateBackendConfigAfterResourceAdd() {
        return require('../extensions/amplify-helpers/update-backend-config').updateBackendConfigAfterResourceAdd;
    }
    get updateBackendConfigAfterResourceUpdate() {
        return require('../extensions/amplify-helpers/update-backend-config').updateBackendConfigAfterResourceUpdate;
    }
    get updateBackendConfigAfterResourceRemove() {
        return require('../extensions/amplify-helpers/update-backend-config').updateBackendConfigAfterResourceRemove;
    }
    get loadEnvResourceParameters() {
        return require('../extensions/amplify-helpers/envResourceParams').loadEnvResourceParameters;
    }
    get saveEnvResourceParameters() {
        return require('../extensions/amplify-helpers/envResourceParams').saveEnvResourceParameters;
    }
    get removeResourceParameters() {
        return require('../extensions/amplify-helpers/envResourceParams').removeResourceParameters;
    }
    get removeDeploymentSecrets() {
        return require('../extensions/amplify-helpers/envResourceParams').removeDeploymentSecrets;
    }
    get triggerFlow() {
        return require('../extensions/amplify-helpers/trigger-flow').triggerFlow;
    }
    get addTrigger() {
        return require('../extensions/amplify-helpers/trigger-flow').addTrigger;
    }
    get updateTrigger() {
        return require('../extensions/amplify-helpers/trigger-flow').updateTrigger;
    }
    get deleteTrigger() {
        return require('../extensions/amplify-helpers/trigger-flow').deleteTrigger;
    }
    get deleteAllTriggers() {
        return require('../extensions/amplify-helpers/trigger-flow').deleteAllTriggers;
    }
    get deleteDeselectedTriggers() {
        return require('../extensions/amplify-helpers/trigger-flow').deleteDeselectedTriggers;
    }
    get dependsOnBlock() {
        return require('../extensions/amplify-helpers/trigger-flow').dependsOnBlock;
    }
    get getTags() {
        return require('../extensions/amplify-helpers/get-tags').getTags;
    }
    get getTriggerMetadata() {
        return require('../extensions/amplify-helpers/trigger-flow').getTriggerMetadata;
    }
    get getTriggerPermissions() {
        return require('../extensions/amplify-helpers/trigger-flow').getTriggerPermissions;
    }
    get getTriggerEnvVariables() {
        return require('../extensions/amplify-helpers/trigger-flow').getTriggerEnvVariables;
    }
    get getTriggerEnvInputs() {
        return require('../extensions/amplify-helpers/trigger-flow').getTriggerEnvInputs;
    }
    get getUserPoolGroupList() {
        return require('../extensions/amplify-helpers/get-userpoolgroup-list').getUserPoolGroupList;
    }
    get forceRemoveResource() {
        return require('../extensions/amplify-helpers/remove-resource').forceRemoveResource;
    }
    get writeObjectAsJson() {
        return require('../extensions/amplify-helpers/write-object-as-json').writeObjectAsJson;
    }
    get hashDir() {
        return require('../extensions/amplify-helpers/hash-dir').hashDir;
    }
    get leaveBreadcrumbs() {
        return require('../extensions/amplify-helpers/leave-breadcrumbs').leaveBreadcrumbs;
    }
    get readBreadcrumbs() {
        return require('../extensions/amplify-helpers/read-breadcrumbs').readBreadcrumbs;
    }
    get loadRuntimePlugin() {
        return require('../extensions/amplify-helpers/load-runtime-plugin').loadRuntimePlugin;
    }
    get getImportedAuthProperties() {
        return require('../extensions/amplify-helpers/get-imported-auth-properties').getImportedAuthProperties;
    }
    get invokePluginMethod() {
        return require('../extensions/amplify-helpers/invoke-plugin-method').invokePluginMethod;
    }
}
exports.AmplifyToolkit = AmplifyToolkit;
//# sourceMappingURL=amplify-toolkit.js.map