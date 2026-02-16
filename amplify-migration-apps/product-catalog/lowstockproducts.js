const crypto = require('@aws-crypto/sha256-js');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@aws-sdk/protocol-http');
const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const Sha256 = crypto.Sha256;

const GRAPHQL_ENDPOINT = process.env.API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;

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
    const products = await fetchProducts();
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

async function fetchProducts() {
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
    body: JSON.stringify({ query: listProductsQuery }),
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
