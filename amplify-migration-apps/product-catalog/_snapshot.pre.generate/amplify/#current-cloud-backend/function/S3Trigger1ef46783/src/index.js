/* Amplify Params - DO NOT EDIT
  API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT
  API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT
  API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const crypto = require('@aws-crypto/sha256-js');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@aws-sdk/protocol-http');

const Sha256 = crypto.Sha256;

const GRAPHQL_ENDPOINT = process.env.API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

function updateProductImageUploadedAtMutation(productId, date) {
  return `mutation ProductImageUploadedAtMutation { updateProduct(input: {id: "${productId}", imageUploadedAt: "${date}"}) { id } }`;
}

exports.handler = async function (event) {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  const key = event.Records[0].s3.object.key;

  const productId = key.split('_')[0].split('/')[2];

  await updateProductImageUploadedAt(productId);
};

async function updateProductImageUploadedAt(productId) {
  const endpoint = new URL(GRAPHQL_ENDPOINT);

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: AWS_REGION,
    service: 'appsync',
    sha256: Sha256,
  });

  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({
      query: updateProductImageUploadedAtMutation(productId, new Date().toISOString()),
    }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT, signed);

  const response = await fetch(request);
  const status = response.status;
  const body = await response.json();

  if (status !== 200) {
    throw new Error(status);
  }

  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }

  console.log(JSON.stringify(body.data, null, 2));
}
