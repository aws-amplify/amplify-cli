/* Amplify Params - DO NOT EDIT
	ANALYTICS_APP6KINESIS_KINESISSTREAMARN
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { KinesisClient, ListShardsCommand, GetShardIteratorCommand, GetRecordsCommand } = require('@aws-sdk/client-kinesis');

const kinesis = new KinesisClient({ region: process.env.REGION });

// Extract stream name from ARN
function getStreamName(arn) {
  // ARN format: arn:aws:kinesis:region:account:stream/stream-name
  const parts = arn.split('/');
  return parts[parts.length - 1];
}

exports.handler = async (event) => {
  console.log('EVENT:', JSON.stringify(event));

  const streamArn = process.env.ANALYTICS_APP6KINESIS_KINESISSTREAMARN;
  const streamName = getStreamName(streamArn);

  console.log('Reading from stream:', streamName);

  try {
    // 1. List shards
    const shardsResponse = await kinesis.send(
      new ListShardsCommand({
        StreamName: streamName,
      }),
    );

    if (!shardsResponse.Shards || shardsResponse.Shards.length === 0) {
      return { events: [], message: 'No shards found' };
    }

    const shardId = shardsResponse.Shards[0].ShardId;
    console.log('Using shard:', shardId);

    // 2. Get shard iterator (read latest records)
    const iteratorResponse = await kinesis.send(
      new GetShardIteratorCommand({
        StreamName: streamName,
        ShardId: shardId,
        ShardIteratorType: 'TRIM_HORIZON',
      }),
    );

    // 3. Get records (iterate to get all)
    let allRecords = [];
    let shardIterator = iteratorResponse.ShardIterator;
    let iterations = 0;
    const maxIterations = 20; // Increased to fetch more records

    while (shardIterator && iterations < maxIterations) {
      const recordsResponse = await kinesis.send(
        new GetRecordsCommand({
          ShardIterator: shardIterator,
          Limit: 1000,
        }),
      );

      if (recordsResponse.Records && recordsResponse.Records.length > 0) {
        allRecords = allRecords.concat(recordsResponse.Records);
      }

      // Stop if no more records
      if (!recordsResponse.Records || recordsResponse.Records.length === 0) {
        break;
      }

      shardIterator = recordsResponse.NextShardIterator;
      iterations++;
    }

    console.log('Found records:', allRecords.length, 'after', iterations, 'iterations');

    // 4. Get latest 50 records (reverse to show newest first)
    const latestRecords = allRecords.slice(-50).reverse();

    // 5. Decode and return records
    const events = latestRecords.map((record) => {
      const data = Buffer.from(record.Data).toString('utf-8');
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      return {
        data: JSON.stringify(parsedData),
        sequenceNumber: record.SequenceNumber,
        timestamp: record.ApproximateArrivalTimestamp?.toISOString() || null,
      };
    });

    return {
      streamName,
      shardId,
      events,
    };
  } catch (error) {
    console.error('Error reading from Kinesis:', error);
    return {
      error: error.message,
      streamName,
    };
  }
};
