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
      },
      {
        AttributeName: 'SongTitle',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'Artist',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'SongTitle',
        KeyType: 'RANGE',
      },
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

    const tables = await dynamo.listTables().promise();
    expect(tables).toEqual({ TableNames: [] });
  });

  it('should preserve state between restarts with dbPath', async () => {
    const emuOne = await ddbSimulator.launch({ dbPath });
    emulators.push(emuOne);
    const dynamoOne = ddbSimulator.getClient(emuOne);
    await dynamoOne
      .createTable({
        TableName: 'foo',
        ...dbParams,
      })
      .promise();
    await emuOne.terminate();
    emulators = [];
    const emuTwo = await ddbSimulator.launch({ dbPath });
    emulators.push(emuTwo);
    const dynamoTwo = await ddbSimulator.getClient(emuTwo);
    const t = await dynamoTwo.listTables().promise();
    expect(t).toEqual({
      TableNames: ['foo'],
    });
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
