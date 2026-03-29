const crypto = require('@aws-crypto/sha256-js');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@aws-sdk/protocol-http');
const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const Sha256 = crypto.Sha256;

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

// Resolve the GraphQL endpoint from (in order):
// 1. Environment variable (works when Amplify CLI wires up API access)
// 2. The invoking AppSync event's host header (works for @function invocations)
function getGraphQLEndpoint(event) {
  // Try the standard env var name
  const fromEnv = process.env.API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT
    || Object.entries(process.env).find(([k]) => k.startsWith('API_') && k.endsWith('_GRAPHQLAPIENDPOINTOUTPUT'))?.[1];

  if (fromEnv && fromEnv.startsWith('http')) return fromEnv;

  // Extract from the invoking AppSync API's host header.
  // When AppSync invokes a Lambda via @function, the event contains the
  // request headers from the original GraphQL call, including the host.
  const host = event?.request?.headers?.host;
  if (host && host.includes('appsync-api')) {
    const endpoint = `https://${host}/graphql`;
    console.log(`Using endpoint from event host header: ${endpoint}`);
    return endpoint;
  }

  throw new Error('Could not determine GraphQL endpoint from env vars or event');
}

const listProductsQuery = `
  query ListProducts {
    listProducts {
      items {
        id
        engword
        stock
        price
        category
      }
    }
  }
`;

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  try {
    const secretValue = await fetchSecret();
    const products = await fetchProducts(event);
    const lowStockProducts = products.filter((product) => product.stock !== null && product.stock < LOW_STOCK_THRESHOLD);

    console.log(`Found ${lowStockProducts.length} low stock products`);

    return {
      message: `Checked ${products.length} products, found ${lowStockProducts.length} low stock items (secret value: ${secretValue})`,
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.engword,
        stock: p.stock,
      })),
    };
  } catch (error) {
    console.error('Error checking stock:', error.message);
    console.error('Full error:', error);
    throw new Error(`Error checking stock: ${error.message}`);
  }
};

async function fetchProducts(event) {
  const graphqlEndpoint = getGraphQLEndpoint(event);
  const endpoint = new URL(graphqlEndpoint);

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
    body: JSON.stringify({ query: listProductsQuery }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(graphqlEndpoint, signed);

  const response = await fetch(request);
  const status = response.status;
  const body = await response.json();

  if (status !== 200) {
    throw new Error(status);
  }

  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }

  return body.data.listProducts.items;
}

async function fetchSecret() {
  const client = new SSMClient({ region: AWS_REGION });
  const { Parameters } = await client.send(
    new GetParametersCommand({
      Names: ['PRODUCT_CATALOG_SECRET'].map((secretName) => process.env[secretName]),
      WithDecryption: true,
    }),
  );

  return Parameters[0].Value;
}
