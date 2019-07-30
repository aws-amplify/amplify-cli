/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
const triggerFlow = require('../../src/extensions/amplify-helpers/trigger-flow');
const func = require('amplify-category-function');
const inquirer = require('inquirer');
const fs = require('fs');
const fsExtra = require('fs-extra');


jest.mock('inquirer');
jest.mock('fs');
jest.mock('fs-extra');


const key = 'foo';
const values = ['bar'];
let context = {};
const functionName = 'name';
const category = 'category';
const parentStack = 'parentStack';
const path = './';
const parentResource = 'parentResource';
const triggerIndexPath = '';
const triggerPackagePath = '';
const triggerDir = '';
const triggerTemplate = '';

describe('TriggerFlow:  ', () => {
  beforeEach(() => {
    context = {
      runtime: {
        plugins: [
          {
            name: 'category-category-category',
            directory: './',
          },
        ],
      },
      print: {
        success: jest.fn(),
      },
      amplify: {
        readJsonFile: jest.fn().mockReturnValue({ Lambda: {} }),
        getCategoryPlugins: jest.fn().mockReturnValue({ category: './' }),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        pathManager: {
          getBackendDirPath: jest.fn(),
        },
        forceRemoveResource: jest.fn(),
        getTriggerMetadata: jest.fn(),
        cleanFunctions: jest.fn(),
        copyBatch: jest.fn(),
        deleteTrigger: jest.fn(),
        confirmPrompt: {
          run: jest.fn(),
        },
      },
    };
  });


  describe('When adding a trigger...', () => {
    let spyAdd;
    let readdirSyncSpy;

    beforeEach(() => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => ['file1']);
      spyAdd = jest.spyOn(func, 'add').mockImplementation(() => Promise.resolve());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...it should call add', async () => {
      await triggerFlow.addTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(spyAdd).toHaveBeenCalled();
    });

    it('...it should return a key/value pair of key and functionName', async () => {
      const result = await triggerFlow.addTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(result[key]).toBeDefined();
      expect(result[key]).toEqual('name');
    });

    it('...it should call readdirSync', async () => {
      await triggerFlow.addTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('When updating a trigger...', () => {
    let spyUpdate;
    let readdirSyncSpy;
    let unlinkSyncSpy;
    let metadataSpy;

    beforeEach(() => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => ['file1']);
      spyUpdate = jest.spyOn(func, 'update').mockImplementation(() => Promise.resolve());
      unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => (Promise.resolve()));
      metadataSpy = jest.spyOn(context.amplify, 'getTriggerMetadata').mockImplementation(() => {
        return {
          stark: {
            permissions: {
              policyName: 'policy',
              trigger: 'arya',
              actions: ['actions'],
              resources: [{
                type: 'foo',
                attribute: 'bar',
              }],
            },
          },
        };
      });
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...it should call update', async () => {
      await triggerFlow.updateTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(spyUpdate).toHaveBeenCalled();
    });

    it('...it should return null', async () => {
      const result = await triggerFlow.updateTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(result).toBeNull();
    });

    it('...it should throw an error when parameters are missing', async () => {
      let error;
      try {
        await triggerFlow.updateTrigger();
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });

    it('...it should call readdirSync thrice', async () => {
      await triggerFlow.updateTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(readdirSyncSpy).toHaveBeenCalledTimes(3);
    });

    it('...it should call metadataSpy twice', async () => {
      await triggerFlow.updateTrigger({
        trigger: true,
        key,
        values,
        context,
        functionName,
        category,
        parentStack,
        path,
        triggerIndexPath,
        triggerPackagePath,
        triggerDir,
        triggerTemplate,
        parentResource,
      });
      expect(metadataSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('When deleteting deselected triggers...', () => {
    const currentTriggers = ['arya'];
    let previousTriggers;
    let deleteSpy;

    beforeEach(() => {
      deleteSpy = jest.spyOn(context.amplify, 'deleteTrigger').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      previousTriggers = {};
      jest.resetAllMocks();
    });

    it('...it should call deleteTrigger twice when two triggers are removed', async () => {
      previousTriggers = ['arya', 'sandor', 'joffrey'];
      await triggerFlow.deleteDeselectedTriggers(
        currentTriggers,
        previousTriggers,
        functionName,
        path,
        context,
      );
      expect(deleteSpy).toHaveBeenCalledTimes(2);
    });

    it('...it should call deleteTrigger once when one trigger is removed', async () => {
      previousTriggers = ['arya', 'sandor'];
      await triggerFlow.deleteDeselectedTriggers(
        currentTriggers,
        previousTriggers,
        functionName,
        path,
        context,
      );
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should not call deleteTrigger when nothing is removed', async () => {
      previousTriggers = ['arya'];
      await triggerFlow.deleteDeselectedTriggers(
        currentTriggers,
        previousTriggers,
        functionName,
        path,
        context,
      );
      expect(deleteSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('When calling getTriggerPermissions...', () => {
    let triggers;
    let metadataSpy;

    beforeEach(() => {
      metadataSpy = jest.spyOn(context.amplify, 'getTriggerMetadata').mockImplementation(() => {
        return {
          stark: {
            permissions: {
              policyName: 'policy',
              trigger: 'arya',
              actions: ['actions'],
              resources: [{
                type: 'foo',
                attribute: 'bar',
              }],
            },
          },
          dragon: {
            permissions: {
              policyName: 'policy',
              trigger: 'drogon',
              actions: ['actions'],
              resources: [{
                type: 'foo',
                attribute: 'bar',
              }],
            },
          },
        };
      });
    });

    afterEach(() => {
      triggers = {};
      jest.resetAllMocks();
    });

    it('...it should call getTriggerMetadata once for each key (1 result)', async () => {
      triggers = { arya: ['stark'] };
      await triggerFlow.getTriggerPermissions(
        context,
        JSON.stringify(triggers),
        category,
        functionName,
      );
      expect(metadataSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should call getTriggerMetadata once for each key (2 results)', async () => {
      triggers = { arya: ['stark'], tyrion: ['lannister'] };
      await triggerFlow.getTriggerPermissions(
        context,
        JSON.stringify(triggers),
        category,
        functionName,
      );
      expect(metadataSpy).toHaveBeenCalledTimes(2);
    });

    it('...it should return permissions corresponding to the key (1 result)', async () => {
      triggers = { arya: ['stark'], tyrion: ['lannister'] };
      const result = await triggerFlow.getTriggerPermissions(
        context,
        JSON.stringify(triggers),
        category,
        functionName,
      );
      expect(result.length).toEqual(1);
    });

    it('...it should return permissions corresponding to the key (2 results)', async () => {
      triggers = { arya: ['stark'], drogon: ['dragon'] };
      const result = await triggerFlow.getTriggerPermissions(
        context,
        JSON.stringify(triggers),
        category,
        functionName,
      );
      expect(result.length).toEqual(2);
    });
  });

  describe('When calling getTriggerEnvVariables...', () => {
    let metadataSpy;
    beforeEach(() => {
      metadataSpy = jest.spyOn(context.amplify, 'getTriggerMetadata').mockImplementation(() => {
        return {
          stark: {
            env: [
              {
                key: 'functionName',
                value: 'functionName',
              },
              {
                key: 'REDIRECTURL',
                value: 'askUser',
                question: {
                  name: 'REDIRECTURL',
                  type: 'input',
                  message: 'Enter the URL that your users will be redirected to upon account confirmation:',
                },
              },
            ],
          },
        };
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...it should call getTriggerMetadata once', async () => {
      await triggerFlow.getTriggerEnvVariables(
        context,
        { key: 'stark' },
        functionName,
      );
      expect(metadataSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should call getTriggerMetadata once and return one result', async () => {
      const result = await triggerFlow.getTriggerEnvVariables(
        context,
        { key: 'arya', modules: ['stark'] },
        functionName,
      );
      expect(result.length).toEqual(1);
    });

    it('...it should call getTriggerMetadata once and return zero results', async () => {
      const result = await triggerFlow.getTriggerEnvVariables(
        context,
        { key: 'arya', modules: ['lannister'] },
        functionName,
      );
      expect(result.length).toEqual(0);
    });
  });

  describe('When calling deleteTrigger...', () => {
    let forceRemoveSpy;
    beforeEach(() => {
      forceRemoveSpy = jest.spyOn(context.amplify, 'forceRemoveResource');
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...it should call forceRemoveResource once', async () => {
      await triggerFlow.deleteTrigger(context, functionName, path);
      expect(forceRemoveSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should throw an error if parameter is missing', async () => {
      let error;
      try {
        await triggerFlow.deleteTrigger();
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });
  });

  describe('When calling deleteAllTriggers...', () => {
    let triggers;
    let deleteTriggerSpy;
    beforeEach(() => {
      deleteTriggerSpy = jest.spyOn(context.amplify, 'deleteTrigger');
    });

    afterEach(() => {
      jest.resetAllMocks();
      triggers = {};
    });

    it('...it should call forceRemoveResource once for each key (test with two keys)', async () => {
      triggers = { arya: ['stark'], sandor: ['clegane'] };
      await triggerFlow.deleteAllTriggers(triggers, functionName, path, context);
      expect(deleteTriggerSpy).toHaveBeenCalledTimes(2);
    });

    it('...it should call forceRemoveResource once for each key (test with one key)', async () => {
      triggers = { arya: ['stark'] };
      await triggerFlow.deleteAllTriggers(triggers, functionName, path, context);
      expect(deleteTriggerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('When calling getTriggerEnvInputs...', () => {
    let triggerKey = '';
    let vals = [];
    let envVals = {};
    let metadataSpy;
    let inquirerSpy;
    beforeEach(() => {
      inquirerSpy = jest.spyOn(inquirer, 'prompt').mockImplementation(() => ({ REDIRECTURL: 'hello' }));
      metadataSpy = jest.spyOn(context.amplify, 'getTriggerMetadata').mockImplementation(() => {
        return {
          stark: {
            env: [{
              key: 'REDIRECTURL',
              value: 'askUser',
              question: {
                name: 'REDIRECTURL',
                type: 'input',
                message: 'Enter the URL that your users will be redirected to upon account confirmation:',
              },
            }],
          },
        };
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
      triggerKey = '';
      vals = [];
      envVals = {};
    });

    it('...it should call getTriggerMetadata once', async () => {
      triggerKey = 'arya';
      vals = ['stark'];
      await triggerFlow.getTriggerEnvInputs(context, path, triggerKey, vals, envVals);
      expect(metadataSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should call inquirer.prompt once for each intersection index', async () => {
      triggerKey = 'arya';
      vals = ['stark'];
      await triggerFlow.getTriggerEnvInputs(context, path, triggerKey, vals, envVals);
      expect(inquirerSpy).toHaveBeenCalledTimes(1);
    });

    it('...it should return the prompt answers (when no currentEnvValues are present)', async () => {
      triggerKey = 'arya';
      vals = ['stark'];
      const result = await triggerFlow
        .getTriggerEnvInputs(context, path, triggerKey, vals, envVals);
      expect(result.REDIRECTURL).toEqual('hello');
    });
    it('...it should return the prompt answers along with currentEnvValues', async () => {
      triggerKey = 'arya';
      vals = ['stark'];
      envVals = { anotherVar: 'world' };
      const result = await triggerFlow
        .getTriggerEnvInputs(context, path, triggerKey, vals, envVals);
      expect(result.REDIRECTURL).toEqual('hello');
      expect(result.anotherVar).toEqual('world');
      expect(Object.keys(result).length).toEqual(2);
    });
  });

  describe('When calling dependsOnBlock...', () => {
    let triggerKeys = [];
    const provider = 'provider';

    afterEach(() => {
      triggerKeys = [];
      delete context.updatingAuth;
    });

    it('...it should throw an error if context not provided', async () => {
      let error;
      try {
        await triggerFlow.dependsOnBlock(null, [], provider);
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });

    it('...it should throw an error if provider is not provided', async () => {
      let error;
      try {
        await triggerFlow.dependsOnBlock(context, [], null);
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });

    it('...it should return an array with an index for each key (when dependsOn block does not exist for existing resource', async () => {
      triggerKeys = ['arya', 'sandor'];
      const result = await triggerFlow.dependsOnBlock(context, triggerKeys, provider);
      expect(result.length).toEqual(2);
      expect(result[0].resourceName).toEqual('arya');
    });

    it('...it should return an array with an index for each key (and should remove resources that are not current for same provider)', async () => {
      triggerKeys = ['arya', 'sandor'];
      context.updatingAuth = { dependsOn: [{ functionName: 'tyrion', triggerProvider: provider }] };
      const result = await triggerFlow.dependsOnBlock(context, triggerKeys, provider);
      expect(result.length).toEqual(2);
      expect(result[0].resourceName).toEqual('arya');
    });

    it('...it should return an array with an index for each key (and should not remove resources that are for different provider)', async () => {
      triggerKeys = ['arya', 'sandor'];
      context.updatingAuth = { dependsOn: [{ resourceName: 'tyrion', triggerProvider: 'different' }] };
      const result = await triggerFlow.dependsOnBlock(context, triggerKeys, provider);
      expect(result.length).toEqual(3);
      expect(result[0].resourceName).toEqual('tyrion');
    });
  });

  describe('When calling copyFunctions...', () => {
    let readdirSyncSpy;
    let copySyncSpy;
    let triggerKey = '';
    let val = '';

    beforeEach(() => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
      copySyncSpy = jest.spyOn(fsExtra, 'copySync').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...should throw an error when parameter are missing', async () => {
      let error;
      try {
        await triggerFlow.copyFunctions();
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });

    it('...should call readdirSync once', async () => {
      await triggerFlow.copyFunctions(triggerKey, val, category, context, path);
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('...should call copySyncSpy once', async () => {
      triggerKey = 'key';
      val = ['notcustom'];
      await triggerFlow.copyFunctions(triggerKey, val, category, context, path);
      expect(copySyncSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('When calling cleanFunctions...', () => {
    let metadataSpy;
    let readdirSyncSpy;
    let unlinkSyncSpy;

    beforeEach(() => {
      unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => (Promise.resolve()));
      metadataSpy = jest.spyOn(context.amplify, 'getTriggerMetadata').mockImplementation(() => {
        return {
          stark: {
            permissions: {
              policyName: 'policy',
              trigger: 'arya',
              actions: ['actions'],
              resources: [{
                type: 'foo',
                attribute: 'bar',
              }],
            },
          },
          dragon: {
            permissions: {
              policyName: 'policy',
              trigger: 'drogon',
              actions: ['actions'],
              resources: [{
                type: 'foo',
                attribute: 'bar',
              }],
            },
          },
        };
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...should call getTriggerMetadata once', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
      await triggerFlow.cleanFunctions(key, values, category, context, path);
      expect(metadataSpy).toHaveBeenCalledTimes(1);
    });

    it('...should call readdirSync once', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
      await triggerFlow.cleanFunctions(key, values, category, context, path);
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('...should call readdirSync once', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
      await triggerFlow.cleanFunctions(key, values, category, context, path);
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('...should call unlinkSync if the dir contents have values not present in passed values', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['stark.js']));
      await triggerFlow.cleanFunctions(key, values, category, context, path);
      expect(unlinkSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('...should call unlinkSync if the dir contents have values not present in passed values (custom file)', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['custom.js']));
      await triggerFlow.cleanFunctions(key, values, category, context, path);
      expect(unlinkSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('...should throw an error if parameters are missing', async () => {
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
      let error;
      try {
        await triggerFlow.cleanFunctions();
      } catch (e) {
        error = e;
      }
      expect(error.message).toBeTruthy();
    });
  });

  describe(('When calling choicesFromMetadata...'), () => {
    let readdirSyncSpy;
    let readFileSync;
    let statSyncSpy;

    beforeEach(() => {
      statSyncSpy = jest.spyOn(fs, 'statSync').mockImplementation(() => ({ isDirectory: jest.fn() }));
      readFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{}');
      readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockImplementation(() => (['file1', 'file2']));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('...it should call readdirSync once', async () => {
      await triggerFlow.choicesFromMetadata(path, functionName);
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
      expect(statSyncSpy).toHaveBeenCalledTimes(0);
    });

    it('...it should call statSync twice when isDir is true', async () => {
      await triggerFlow.choicesFromMetadata(path, functionName, true);
      expect(readdirSyncSpy).toHaveBeenCalledTimes(1);
      expect(statSyncSpy).toHaveBeenCalledTimes(2);
    });
  });
});
