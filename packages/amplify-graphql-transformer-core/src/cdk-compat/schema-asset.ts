import { CfnGraphQLSchema, GraphqlApi, Schema } from '@aws-cdk/aws-appsync';
import { Lazy } from '@aws-cdk/core';
import { FileAsset } from './file-asset';

export class TransformerSchema extends Schema {
  private asset?: FileAsset;
  private api?: GraphqlApi;

  private schemaConstruct?: CfnGraphQLSchema;
  bind = (api: GraphqlApi): CfnGraphQLSchema => {
    if (!this.schemaConstruct) {
      const schema = this;
      this.api = api;
      this.schemaConstruct = new CfnGraphQLSchema(api, 'Schemaasdf', {
        apiId: api.apiId,
        definitionS3Location: Lazy.stringValue({
          produce: () => {
            const asset = schema.addAsset();
            return asset.s3Url;
          },
        }),
      });
    }
    return this.schemaConstruct;
  };

  private addAsset = (): FileAsset => {
    if (!this.api) {
      throw new Error('Shcema not bound');
    }
    if (!this.asset) {
      this.asset = new FileAsset(this.api, 'schema', { fileName: 'schema.graphql', fileContent: this.definition });
    }
    return this.asset;
  };
  // Todo: subsclass with proper implementation of all the methods.
  addToSchema = (addition: string, delimiter: string): void => {
    const sep = delimiter ?? '';
    this.definition = `${this.definition}${sep}${addition}\n`;
  };
}
