import * as fs from 'fs-extra';
import { DocumentNode, parse } from 'graphql';
import path from 'path';

import { AmplifyDataApiProvider } from '../../amplify-data-interfaces';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';

export class AmplifyDataApi implements AmplifyDataApiProvider {
  private schema?: DocumentNode;

  public constructor() {
    this.schema = undefined;
  }

  public async readSchema(schemaPath: string): Promise<DocumentNode> {
    if (this.schema) {
      return this.schema;
    }

    const fileContentsList = new Array<Promise<Buffer>>();

    const stats = fs.statSync(schemaPath);
    if (stats.isDirectory()) {
      fs.readdirSync(schemaPath).forEach(fileName => {
        fileContentsList.push(fs.readFile(path.join(schemaPath, fileName)));
      });
    } else {
      fileContentsList.push(fs.readFile(schemaPath));
    }

    const bufferList = await Promise.all(fileContentsList);
    const fullSchema = bufferList.map(buff => buff.toString()).join('\n');
    const parsedSchema = parse(fullSchema);/*
    const transformer = {} as GraphQLTransform; // TODO: implement getTransformer();
    const processedSchema = transformer.preProcess(parsedSchema);
    this.schema = processedSchema;
    return processedSchema;*/
    return parsedSchema;
  }
}
