import { CfnGraphQLSchema } from '@aws-cdk/aws-appsync';
import { Lazy } from '@aws-cdk/core';
import { GraphQLApi } from '../graphql-api';
import { FileAsset } from './file-asset';

export class TransformerSchema {
  private asset?: FileAsset;
  private api?: GraphQLApi;
  private definition = '';

  private schemaConstruct?: CfnGraphQLSchema;
  bind = (api: GraphQLApi): CfnGraphQLSchema => {
    if (!this.schemaConstruct) {
      const schema = this;
      this.api = api;
      this.schemaConstruct = new CfnGraphQLSchema(api, 'TransformerSchema', {
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
      throw new Error('Schema not bound');
    }
    if (!this.asset) {
      this.asset = new FileAsset(this.api, 'schema', { fileName: 'schema.graphql', fileContent: this.definition });
    }
    return this.asset;
  };
  addToSchema = (addition: string, delimiter: string): void => {
    const sep = delimiter ?? '';
    this.definition = `${this.definition}${sep}${addition}\n`;
  };
}
