import { Lambda } from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

const LAMBDA_CODE = `exports.handler = async (event) => {
    console.log(event);
    return event;
};`;

export class LambdaHelper {
    client: Lambda;
    constructor(region: string = 'us-west-2') {
        this.client = new Lambda({
            region
        })
    }

    async createFunction(name: string, roleArn: string) {
        const zipContents = fs.readFileSync(path.join(__dirname, 'testfunctions', 'echoFunction.zip'));
        return await this.client.createFunction({
            FunctionName: name,
            Code: {
                ZipFile: zipContents,
            },
            Runtime: 'nodejs8.10',
            Handler: 'echoFunction.handler',
            Role: roleArn
        }).promise();
    }

    async deleteFunction(name: string) {
        return await this.client.deleteFunction({FunctionName: name}).promise();
    }
}