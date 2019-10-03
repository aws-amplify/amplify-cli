const ddbSimulator = require('..');
const fs = require('fs-extra');
const { execSync } = require('child_process');

describe('emulator operations', () => {
    const dbPath = `${__dirname}/dynamodb-data/${process.pid}`;
    // taken from dynamodb examples.
    const dbParams = {
        AttributeDefinitions: [
            {
                AttributeName: 'Artist',
                AttributeType: 'S'
            },
            {
                AttributeName: 'SongTitle',
                AttributeType: 'S'
            }
        ],
        KeySchema: [
            {
                AttributeName: 'Artist',
                KeyType: 'HASH'
            },
            {
                AttributeName: 'SongTitle',
                KeyType: 'RANGE'
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    const ensureNoDbPath = () => {
        if (fs.existsSync(dbPath)) {
            fs.removeSync(dbPath);
        }
    };

    beforeEach(ensureNoDbPath);
    afterEach(ensureNoDbPath);

    let emulators;
    beforeEach(() => {
        emulators = [];
        jest.setTimeout(40 * 1000);
    });
    afterEach(async () => await Promise.all(emulators.map(emu => emu.terminate())));

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
                ...dbParams
            })
            .promise();
        await emuOne.terminate();

        const emuTwo = await ddbSimulator.launch({ dbPath });
        emulators.push(emuTwo);
        const dynamoTwo = await ddbSimulator.getClient(emuTwo);
        const t = await dynamoTwo.listTables().promise();
        expect(t).toEqual({
            TableNames: ['foo']
        });
        emuTwo.terminate();
    });

    it('should start on specific port', async () => {
        const port = await require('portfinder').getPortPromise();
        const emu = await ddbSimulator.launch({ port });
        emulators.push(emu);
        expect(emu.port).toBe(port);
    });
});
