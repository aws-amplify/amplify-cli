import path from 'path';

export class AmplifyToolkit {
  private _buildResources: any;
  private _confirmPrompt: any;
  private _constants: any;
  private _constructExeInfo: any;
  private _copyBatch: any;
  private _crudFlow: any;
  private _deleteProject: any;
  private _executeProviderUtils: any;
  private _getAllEnvs: any;
  private _getPlugin: any;
  private _getCategoryPlugins: any;
  private _getFrontendPlugins: any;
  private _getEnvDetails: any;
  private _getEnvInfo: any;
  private _getProviderPlugins: any;
  private _getPluginInstance: any;
  private _getProjectConfig: any;
  private _getProjectDetails: any;
  private _getProjectMeta: any;
  private _getResourceStatus: any;
  private _getResourceOutputs: any;
  private _getWhen: any;
  private _inputValidation: any;
  private _isRunningOnEC2: any;
  private _listCategories: any;
  private _makeId: any;
  private _openEditor: any;
  private _onCategoryOutputsChange: any;
  private _pathManager: any;
  private _pressEnterToContinue: any;
  private _pushResources: any;
  private _storeCurrentCloudBackend: any;
  private _readJsonFile: any;
  private _removeEnvFromCloud: any;
  private _removeResource: any;
  private _sharedQuestions: any;
  private _showAllHelp: any;
  private _showHelp: any;
  private _showHelpfulProviderLinks: any;
  private _showResourceTable: any;
  private _serviceSelectionPrompt: any;
  private _updateProjectConfig: any;
  private _updateamplifyMetaAfterResourceUpdate: any;
  private _updateamplifyMetaAfterResourceAdd: any;
  private _updateamplifyMetaAfterResourceDelete: any;
  private _updateProvideramplifyMeta: any;
  private _updateamplifyMetaAfterPush: any;
  private _updateamplifyMetaAfterBuild: any;
  private _updateAmplifyMetaAfterPackage: any;
  private _updateBackendConfigAfterResourceAdd: any;
  private _updateBackendConfigAfterResourceRemove: any;
  private _loadEnvResourceParameters: any;
  private _saveEnvResourceParameters: any;
  private _removeResourceParameters: any;
  private _triggerFlow: any;
  private _addTrigger: any;
  private _updateTrigger: any;
  private _deleteTrigger: any;
  private _deleteAllTriggers: any;
  private _deleteDeselectedTriggers: any;
  private _dependsOnBlock: any;
  private _getTriggerMetadata: any;
  private _getTriggerPermissions: any;
  private _getTriggerEnvVariables: any;
  private _getTriggerEnvInputs: any;
  private _getUserPoolGroupList: any;
  private _forceRemoveResource: any;

  private _amplifyHelpersDirPath: string = path.normalize(path.join(__dirname, '../extensions/amplify-helpers'));

  get buildResources(): any {
    this._buildResources = this._buildResources || require(path.join(this._amplifyHelpersDirPath, 'build-resources')).buildResources;
    return this._buildResources;
  }
  get confirmPrompt(): any {
    this._confirmPrompt = this._confirmPrompt || require(path.join(this._amplifyHelpersDirPath, 'confirm-prompt'));
    return this._confirmPrompt;
  }
  get constants(): any {
    this._constants = this._constants || require(path.join(this._amplifyHelpersDirPath, 'constants'));
    return this._constants;
  }
  get constructExeInfo(): any {
    this._constructExeInfo =
      this._constructExeInfo || require(path.join(this._amplifyHelpersDirPath, 'construct-exeInfo')).constructExeInfo;
    return this._constructExeInfo;
  }
  get copyBatch(): any {
    this._copyBatch = this._copyBatch || require(path.join(this._amplifyHelpersDirPath, 'copy-batch')).copyBatch;
    return this._copyBatch;
  }
  get crudFlow(): any {
    this._crudFlow = this._crudFlow || require(path.join(this._amplifyHelpersDirPath, 'permission-flow')).crudFlow;
    return this._crudFlow;
  }
  get deleteProject(): any {
    this._deleteProject = this._deleteProject || require(path.join(this._amplifyHelpersDirPath, 'delete-project')).deleteProject;
    return this._deleteProject;
  }
  get executeProviderUtils(): any {
    this._executeProviderUtils =
      this._executeProviderUtils || require(path.join(this._amplifyHelpersDirPath, 'execute-provider-utils')).executeProviderUtils;
    return this._executeProviderUtils;
  }
  get getAllEnvs(): any {
    this._getAllEnvs = this._getAllEnvs || require(path.join(this._amplifyHelpersDirPath, 'get-all-envs')).getAllEnvs;
    return this._getAllEnvs;
  }
  get getPlugin(): any {
    this._getPlugin = this._getPlugin || require(path.join(this._amplifyHelpersDirPath, 'get-plugin')).getPlugin;
    return this._getPlugin;
  }
  get getCategoryPlugins(): any {
    this._getCategoryPlugins =
      this._getCategoryPlugins || require(path.join(this._amplifyHelpersDirPath, 'get-category-plugins')).getCategoryPlugins;
    return this._getCategoryPlugins;
  }
  get getFrontendPlugins(): any {
    this._getFrontendPlugins =
      this._getFrontendPlugins || require(path.join(this._amplifyHelpersDirPath, 'get-frontend-plugins')).getFrontendPlugins;
    return this._getFrontendPlugins;
  }
  get getProviderPlugins(): any {
    this._getProviderPlugins =
      this._getProviderPlugins || require(path.join(this._amplifyHelpersDirPath, 'get-provider-plugins')).getProviderPlugins;
    return this._getProviderPlugins;
  }
  get getEnvDetails(): any {
    this._getEnvDetails = this._getEnvDetails || require(path.join(this._amplifyHelpersDirPath, 'get-env-details')).getEnvDetails;
    return this._getEnvDetails;
  }
  get getEnvInfo(): any {
    this._getEnvInfo = this._getEnvInfo || require(path.join(this._amplifyHelpersDirPath, 'get-env-info')).getEnvInfo;
    return this._getEnvInfo;
  }
  get getPluginInstance(): any {
    this._getPluginInstance =
      this._getPluginInstance || require(path.join(this._amplifyHelpersDirPath, 'get-plugin-instance')).getPluginInstance;
    return this._getPluginInstance;
  }
  get getProjectConfig(): any {
    this._getProjectConfig =
      this._getProjectConfig || require(path.join(this._amplifyHelpersDirPath, 'get-project-config')).getProjectConfig;
    return this._getProjectConfig;
  }
  get getProjectDetails(): any {
    this._getProjectDetails =
      this._getProjectDetails || require(path.join(this._amplifyHelpersDirPath, 'get-project-details')).getProjectDetails;
    return this._getProjectDetails;
  }
  get getProjectMeta(): any {
    this._getProjectMeta = this._getProjectMeta || require(path.join(this._amplifyHelpersDirPath, 'get-project-meta')).getProjectMeta;
    return this._getProjectMeta;
  }
  get getResourceStatus(): any {
    this._getResourceStatus =
      this._getResourceStatus || require(path.join(this._amplifyHelpersDirPath, 'resource-status')).getResourceStatus;
    return this._getResourceStatus;
  }
  get getResourceOutputs(): any {
    this._getResourceOutputs =
      this._getResourceOutputs || require(path.join(this._amplifyHelpersDirPath, 'get-resource-outputs')).getResourceOutputs;
    return this._getResourceOutputs;
  }
  get getWhen(): any {
    this._getWhen = this._getWhen || require(path.join(this._amplifyHelpersDirPath, 'get-when-function')).getWhen;
    return this._getWhen;
  }
  get inputValidation(): any {
    this._inputValidation = this._inputValidation || require(path.join(this._amplifyHelpersDirPath, 'input-validation')).inputValidation;
    return this._inputValidation;
  }
  get isRunningOnEC2(): any {
    this._isRunningOnEC2 = this._isRunningOnEC2 || require(path.join(this._amplifyHelpersDirPath, 'is-running-on-EC2')).isRunningOnEC2;
    return this._isRunningOnEC2;
  }
  get listCategories(): any {
    this._listCategories = this._listCategories || require(path.join(this._amplifyHelpersDirPath, 'list-categories')).listCategories;
    return this._listCategories;
  }
  get makeId(): any {
    this._makeId = this._makeId || require(path.join(this._amplifyHelpersDirPath, 'make-id')).makeId;
    return this._makeId;
  }
  get openEditor(): any {
    this._openEditor = this._openEditor || require(path.join(this._amplifyHelpersDirPath, 'open-editor')).openEditor;
    return this._openEditor;
  }
  get onCategoryOutputsChange(): any {
    this._onCategoryOutputsChange =
      this._onCategoryOutputsChange ||
      require(path.join(this._amplifyHelpersDirPath, 'on-category-outputs-change')).onCategoryOutputsChange;
    return this._onCategoryOutputsChange;
  }
  get pathManager(): any {
    this._pathManager = this._pathManager || require(path.join(this._amplifyHelpersDirPath, 'path-manager'));
    return this._pathManager;
  }
  get pressEnterToContinue(): any {
    this._pressEnterToContinue = this._pressEnterToContinue || require(path.join(this._amplifyHelpersDirPath, 'press-enter-to-continue'));
    return this._pressEnterToContinue;
  }
  get pushResources(): any {
    this._pushResources = this._pushResources || require(path.join(this._amplifyHelpersDirPath, 'push-resources')).pushResources;
    return this._pushResources;
  }
  get storeCurrentCloudBackend(): any {
    this._storeCurrentCloudBackend =
      this._storeCurrentCloudBackend || require(path.join(this._amplifyHelpersDirPath, 'push-resources')).storeCurrentCloudBackend;
    return this._storeCurrentCloudBackend;
  }
  get readJsonFile(): any {
    this._readJsonFile = this._readJsonFile || require(path.join(this._amplifyHelpersDirPath, 'read-json-file')).readJsonFile;
    return this._readJsonFile;
  }
  get removeEnvFromCloud(): any {
    this._removeEnvFromCloud =
      this._removeEnvFromCloud || require(path.join(this._amplifyHelpersDirPath, 'remove-env-from-cloud')).removeEnvFromCloud;
    return this._removeEnvFromCloud;
  }
  get removeResource(): any {
    this._removeResource = this._removeResource || require(path.join(this._amplifyHelpersDirPath, 'remove-resource')).removeResource;
    return this._removeResource;
  }
  get sharedQuestions(): any {
    this._sharedQuestions = this._sharedQuestions || require(path.join(this._amplifyHelpersDirPath, 'shared-questions')).sharedQuestions;
    return this._sharedQuestions;
  }
  get showHelp(): any {
    this._showHelp = this._showHelp || require(path.join(this._amplifyHelpersDirPath, 'show-help')).showHelp;
    return this._showHelp;
  }
  get showAllHelp(): any {
    this._showAllHelp = this._showAllHelp || require(path.join(this._amplifyHelpersDirPath, 'show-all-help')).showAllHelp;
    return this._showAllHelp;
  }
  get showHelpfulProviderLinks(): any {
    this._showHelpfulProviderLinks =
      this._showHelpfulProviderLinks ||
      require(path.join(this._amplifyHelpersDirPath, 'show-helpful-provider-links')).showHelpfulProviderLinks;
    return this._showHelpfulProviderLinks;
  }
  get showResourceTable(): any {
    this._showResourceTable =
      this._showResourceTable || require(path.join(this._amplifyHelpersDirPath, 'resource-status')).showResourceTable;
    return this._showResourceTable;
  }
  get serviceSelectionPrompt(): any {
    this._serviceSelectionPrompt =
      this._serviceSelectionPrompt || require(path.join(this._amplifyHelpersDirPath, 'service-select-prompt')).serviceSelectionPrompt;
    return this._serviceSelectionPrompt;
  }
  get updateProjectConfig(): any {
    this._updateProjectConfig =
      this._updateProjectConfig || require(path.join(this._amplifyHelpersDirPath, 'update-project-config')).updateProjectConfig;
    return this._updateProjectConfig;
  }
  get updateamplifyMetaAfterResourceUpdate(): any {
    this._updateamplifyMetaAfterResourceUpdate =
      this._updateamplifyMetaAfterResourceUpdate ||
      require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateamplifyMetaAfterResourceUpdate;
    return this._updateamplifyMetaAfterResourceUpdate;
  }
  get updateamplifyMetaAfterResourceAdd(): any {
    this._updateamplifyMetaAfterResourceAdd =
      this._updateamplifyMetaAfterResourceAdd ||
      require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateamplifyMetaAfterResourceAdd;
    return this._updateamplifyMetaAfterResourceAdd;
  }
  get updateamplifyMetaAfterResourceDelete(): any {
    this._updateamplifyMetaAfterResourceDelete =
      this._updateamplifyMetaAfterResourceDelete ||
      require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateamplifyMetaAfterResourceDelete;
    return this._updateamplifyMetaAfterResourceDelete;
  }
  get updateProvideramplifyMeta(): any {
    this._updateProvideramplifyMeta =
      this._updateProvideramplifyMeta || require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateProvideramplifyMeta;
    return this._updateProvideramplifyMeta;
  }
  get updateamplifyMetaAfterPush(): any {
    this._updateamplifyMetaAfterPush =
      this._updateamplifyMetaAfterPush || require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateamplifyMetaAfterPush;
    return this._updateamplifyMetaAfterPush;
  }
  get updateamplifyMetaAfterBuild(): any {
    this._updateamplifyMetaAfterBuild =
      this._updateamplifyMetaAfterBuild ||
      require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateamplifyMetaAfterBuild;
    return this._updateamplifyMetaAfterBuild;
  }
  get updateAmplifyMetaAfterPackage(): any {
    this._updateAmplifyMetaAfterPackage =
      this._updateAmplifyMetaAfterPackage ||
      require(path.join(this._amplifyHelpersDirPath, 'update-amplify-meta')).updateAmplifyMetaAfterPackage;
    return this._updateAmplifyMetaAfterPackage;
  }
  get updateBackendConfigAfterResourceAdd(): any {
    this._updateBackendConfigAfterResourceAdd =
      this._updateBackendConfigAfterResourceAdd ||
      require(path.join(this._amplifyHelpersDirPath, 'update-backend-config')).updateBackendConfigAfterResourceAdd;
    return this._updateBackendConfigAfterResourceAdd;
  }
  get updateBackendConfigAfterResourceRemove(): any {
    this._updateBackendConfigAfterResourceRemove =
      this._updateBackendConfigAfterResourceRemove ||
      require(path.join(this._amplifyHelpersDirPath, 'update-backend-config')).updateBackendConfigAfterResourceRemove;
    return this._updateBackendConfigAfterResourceRemove;
  }
  get loadEnvResourceParameters(): any {
    this._loadEnvResourceParameters =
      this._loadEnvResourceParameters || require(path.join(this._amplifyHelpersDirPath, 'envResourceParams')).loadEnvResourceParameters;
    return this._loadEnvResourceParameters;
  }
  get saveEnvResourceParameters(): any {
    this._saveEnvResourceParameters =
      this._saveEnvResourceParameters || require(path.join(this._amplifyHelpersDirPath, 'envResourceParams')).saveEnvResourceParameters;
    return this._saveEnvResourceParameters;
  }
  get removeResourceParameters(): any {
    this._removeResourceParameters =
      this._removeResourceParameters || require(path.join(this._amplifyHelpersDirPath, 'envResourceParams')).removeResourceParameters;
    return this._removeResourceParameters;
  }

  get triggerFlow(): any {
    this._triggerFlow = this._triggerFlow || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).triggerFlow;
    return this._triggerFlow;
  }
  get addTrigger(): any {
    this._addTrigger = this._addTrigger || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).addTrigger;
    return this._addTrigger;
  }
  get updateTrigger(): any {
    this._updateTrigger = this._updateTrigger || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).updateTrigger;
    return this._updateTrigger;
  }
  get deleteTrigger(): any {
    this._deleteTrigger = this._deleteTrigger || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).deleteTrigger;
    return this._deleteTrigger;
  }
  get deleteAllTriggers(): any {
    this._deleteAllTriggers = this._deleteAllTriggers || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).deleteAllTriggers;
    return this._deleteAllTriggers;
  }
  get deleteDeselectedTriggers(): any {
    this._deleteDeselectedTriggers =
      this._deleteDeselectedTriggers || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).deleteDeselectedTriggers;
    return this._deleteDeselectedTriggers;
  }
  get dependsOnBlock(): any {
    this._dependsOnBlock = this._dependsOnBlock || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).dependsOnBlock;
    return this._dependsOnBlock;
  }
  get getTriggerMetadata(): any {
    this._getTriggerMetadata =
      this._getTriggerMetadata || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).getTriggerMetadata;
    return this._getTriggerMetadata;
  }
  get getTriggerPermissions(): any {
    this._getTriggerPermissions =
      this._getTriggerPermissions || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).getTriggerPermissions;
    return this._getTriggerPermissions;
  }
  get getTriggerEnvVariables(): any {
    this._getTriggerEnvVariables =
      this._getTriggerEnvVariables || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).getTriggerEnvVariables;
    return this._getTriggerEnvVariables;
  }
  get getTriggerEnvInputs(): any {
    this._getTriggerEnvInputs =
      this._getTriggerEnvInputs || require(path.join(this._amplifyHelpersDirPath, 'trigger-flow')).getTriggerEnvInputs;
    return this._getTriggerEnvInputs;
  }
  get getUserPoolGroupList(): any {
    this._getUserPoolGroupList =
      this._getUserPoolGroupList || require(path.join(this._amplifyHelpersDirPath, 'get-userpoolgroup-list')).getUserPoolGroupList;
    return this._getUserPoolGroupList;
  }

  get forceRemoveResource(): any {
    this._forceRemoveResource =
      this._forceRemoveResource || require(path.join(this._amplifyHelpersDirPath, 'remove-resource')).forceRemoveResource;
    return this._forceRemoveResource;
  }
}
