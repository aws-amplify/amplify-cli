import { GraphQLAPIProvider, TransformerResourceHelperProvider, ModelFieldMap } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter, Token } from '@aws-cdk/core';
import { StackManager } from './stack-manager';
import md5 from 'md5';
import { ModelResourceIDs } from 'graphql-transformer-common';
import { ModelFieldMapImpl } from './model-field-map';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  private api?: GraphQLAPIProvider;

  // a mapping of models that have been renamed with @mapsTo
  readonly #modelNameMap = new Map<string, string>();

  // a map of objects that define fields of a model that are renamed
  readonly #modelFieldMaps = new Map<string, ModelFieldMap>();

  constructor(private stackManager: StackManager) {
    // set the model name mapping in ModelResourceIDs to use the same mapping as this class
    // yes, it would be better if ModelResourceIDs didn't have a bunch of static methods and this map could be injected into that class
    // but it would also be better if I could eat chocolate cake all day
    ModelResourceIDs.setModelNameMap(this.#modelNameMap);
  }
  generateTableName = (modelName: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    const baseName = this.#modelNameMap.get(modelName) ?? modelName;
    return `${baseName}-${apiId}-${env}`;
  };

  public generateIAMRoleName = (name: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    // 38 = 26(apiId) + 10(env) + 2(-)
    const shortName = `${Token.isUnresolved(name) ? name : name.slice(0, 64 - 38 - 6)}${md5(name).slice(0, 6)}`;
    return `${shortName}-${apiId}-${env}`; // max of 64.
  };

  bind(api: GraphQLAPIProvider) {
    this.api = api;
  }

  setModelNameMapping = (modelName: string, mappedName: string) => {
    this.#modelNameMap.set(modelName, mappedName);
  };

  getModelNameMapping = (modelName: string) => this.#modelNameMap.get(modelName) ?? modelName;

  isModelRenamed = (modelName: string) => this.getModelNameMapping(modelName) !== modelName;

  getModelFieldMap = (modelName: string) => {
    if (!this.#modelFieldMaps.has(modelName)) {
      this.#modelFieldMaps.set(modelName, new ModelFieldMapImpl());
    }
    return this.#modelFieldMaps.get(modelName)!;
  };

  getFieldNameMapping = (modelName: string, fieldName: string): string => {
    if (!this.#modelFieldMaps.has(modelName)) {
      return fieldName;
    }
    return (
      this.#modelFieldMaps
        .get(modelName)
        ?.getMappedFields()
        .find(entry => entry.currentFieldName === fieldName)?.originalFieldName || fieldName
    );
  };

  getModelFieldMapKeys = () => [...this.#modelFieldMaps.keys()];

  private ensureEnv = (): void => {
    if (!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  };
}
