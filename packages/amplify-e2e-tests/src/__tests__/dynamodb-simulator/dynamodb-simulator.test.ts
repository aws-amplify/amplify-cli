import { AttributeDefinition, CreateTableCommand, KeySchemaElement, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const path = require('path');
const ddbSimulator = require('amplify-dynamodb-simulator');
const fs = require('fs-extra');

jest.setTimeout(90 * 1000);
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue(path.join(process.cwd(), '../', '/amplify-dynamodb-simulator')),
  },
}));

describe('emulator operations', () => {
  const dbPath = path.join(process.cwd(), `../amplify-dynamodb-simulator/dynamodb-data/${process.pid}`);
  // taken from dynamodb examples.
  const dbParams = {
    AttributeDefinitions: [
      {
        AttributeName: 'Artist',
        AttributeType: 'S',
      } as AttributeDefinition,
      {
        AttributeName: 'SongTitle',
        AttributeType: 'S',
      } as AttributeDefinition,
    ],
    KeySchema: [
      {
        AttributeName: 'Artist',
        KeyType: 'HASH',
      } as KeySchemaElement,
      {
        AttributeName: 'SongTitle',
        KeyType: 'RANGE',
      } as KeySchemaElement,
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  const ensureNoDbPath = () => {
    if (fs.existsSync(dbPath)) {
      try {
        fs.removeSync(dbPath);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const realProcessEnv = process.env;

  let emulators;
  beforeEach(async () => {
    jest.resetModules();
    ensureNoDbPath();
    emulators = [];
    jest.setTimeout(40 * 1000);
  });

  afterEach(async () => {
    process.env = { ...realProcessEnv };
    await Promise.all(emulators.map((emu) => emu.terminate()));
    ensureNoDbPath();
  });

  it('should support in memory operations', async () => {
    const emu = await ddbSimulator.launch();
    emulators.push(emu);
    const dynamo = ddbSimulator.getClient(emu);

    const tables = await dynamo.send(new ListTablesCommand());
    expect(tables.TableNames).toEqual([]);
  });

  it('should preserve state between restarts with dbPath', async () => {
    const emuOne = await ddbSimulator.launch({ dbPath });
    emulators.push(emuOne);
    const dynamoOne = ddbSimulator.getClient(emuOne);
    await dynamoOne.send(
      new CreateTableCommand({
        TableName: 'foo',
        ...dbParams,
      }),
    );
    await emuOne.terminate();
    emulators = [];
    const emuTwo = await ddbSimulator.launch({ dbPath });
    emulators.push(emuTwo);
    const dynamoTwo = await ddbSimulator.getClient(emuTwo);
    const t = await dynamoTwo.send(new ListTablesCommand());
    expect(t.TableNames).toEqual(['foo']);
  });

  it('should start on specific port', async () => {
    const port = await require('get-port')();
    const emu = await ddbSimulator.launch({ port });
    emulators.push(emu);
    expect(emu.port).toBe(port);
  });

  it('reports on invalid dbPath values', async () => {
    expect.assertions(1);
    await expect(ddbSimulator.launch({ dbPath: 'dynamodb-data' })).rejects.toThrow('invalid directory for database creation');
  });

  it('reports on invalid dbPath values with extra stderr output', async () => {
    expect.assertions(1);
    // This makes JVM running DynamoDB simulator print an extra line before surfacing real error.
    process.env.JAVA_TOOL_OPTIONS = '-Dlog4j2.formatMsgNoLookups=true';
    await expect(ddbSimulator.launch({ dbPath: 'dynamodb-data' })).rejects.toThrow('invalid directory for database creation');
  });
});
