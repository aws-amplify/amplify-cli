import { Lambda } from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

export class LambdaHelper {
  client: Lambda;
  constructor(region: string = 'us-west-2') {
    this.client = new Lambda({
      region,
    });
  }

  async createFunction(name: string, roleArn: string, filePrefix: string) {
    const filePath = path.join(__dirname, 'testfunctions', `${filePrefix}.zip`);
    const zipContents = fs.readFileSync(filePath);
    return await this.client
      .createFunction({
        FunctionName: name,
        Code: {
          ZipFile: zipContents,
        },
        Runtime: 'nodejs14.x',
        Handler: `${filePrefix}.handler`,
        Role: roleArn,
      })
      .promise();
  }

  async deleteFunction(name: string) {
    return await this.client.deleteFunction({ FunctionName: name }).promise();
  }
}
