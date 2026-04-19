/* Amplify Params - DO NOT EDIT
	API_MOODBOARD_GRAPHQLAPIENDPOINTOUTPUT
	API_MOODBOARD_GRAPHQLAPIIDOUTPUT
	API_MOODBOARD_GRAPHQLAPIKEYOUTPUT
	ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const https = require('https');
const url = require('url');

const GRAPHQL_ENDPOINT = process.env.API_MOODBOARD_GRAPHQLAPIENDPOINTOUTPUT;
const API_KEY = process.env.API_MOODBOARD_GRAPHQLAPIKEYOUTPUT;

const createKinesisEventCount = /* GraphQL */ `
  mutation CreateKinesisEventCount($input: CreateKinesisEventCountInput!) {
    createKinesisEventCount(input: $input) {
      id
    }
  }
`;

function graphqlRequest(query, variables) {
  const endpoint = url.parse(GRAPHQL_ENDPOINT);
  const body = JSON.stringify({ query, variables });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: endpoint.hostname,
        path: endpoint.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log('Kinesis trigger fired with', event.Records.length, 'records');

  for (const _record of event.Records) {
    await graphqlRequest(createKinesisEventCount, {
      input: {
        processedAt: new Date().toISOString(),
      },
    });
  }

  console.log('Logged', event.Records.length, 'events');
  return { statusCode: 200 };
};
