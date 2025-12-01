Sanjana

## Step 1: Run npm create vite@latest

```
npm create vite@latest
✔ Project name: product-catalog
✔ Select a framework: › React
✔ Select a variant: › TypeScript
✔ Use rolldown-vite (Experimental)?: No  
✔ Install with npm and start now? Yes

```

 ## Step 2: Initialize the project

```
amplify init
```
```
Do you want to continue with Amplify Gen 1? (y/N) · yes  
Why would you like to use Amplify Gen 1? · Prefer not to answer  
Enter a name for the project productcatalog  

The following configuration will be applied:  
Project information  
| Name: productcatalog 
| Environment: dev  
| Default editor: Visual Studio Code  
| App type: javascript  
| Javascript framework: react
| Source Directory Path: src  
| Distribution Directory Path: dist  
| Build Command: npm run-script build  
| Start Command: npm run-script start  

? Initialize the project with the above configuration? Yes  
Using default provider awscloudformation  
? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use: default
```

## Step 3: Add GraphQL API

```
amplify add api
```
```
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create.
  Name: productcatalog
  Conflict detection (required for DataStore): Disabled
  Select a setting to edit or continue Authorization modes: API key (default, expiration time: 7 days from now)
? Choose the default authorization type for the API IAM
? Configure additional auth types? No
? Here is the GraphQL API that we will create. Select a setting to edit or continue Continue
? Choose a schema template: One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)

Do you want to edit the schema now? (Y/n) › Y
```
Open your GraphQL schema in the editor

amplify/backend/api/your-api-name/schema.graphql

```
# Multi-user Product Catalog with IAM-based Role Access Control

enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

type User @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "id" }
]) {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Product @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: public, provider: apiKey, operations: [read] }
]) {
  id: ID!
  serialno: Int!
  engword: String!
  price: Float
  category: String
  description: String
  stock: Int
  brand: String
  imageKey: String
  images: [String]
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  comments: [Comment] @hasMany(indexName: "byProduct", fields: ["id"])
}

type Comment @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "authorId" }
]) {
  id: ID!
  productId: ID! @index(name: "byProduct")
  product: Product @belongsTo(fields: ["productId"])
  authorId: String!
  authorName: String!
  content: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type LowStockProduct {
  name: String!
  stock: Int!
}

type LowStockResponse {
  message: String!
  lowStockProducts: [LowStockProduct!]!
}

type Query {
  checkLowStock: LowStockResponse @function(name: "lowstockproductcatalog-${env}") @auth(rules: [
    { allow: private, provider: iam },
    { allow: public, provider: apiKey }
  ])
}
```
```
amplify push
```
```
✔ Are you sure you want to continue? (Y/n) · yes
✔ Would you like to create an API Key? (y/N) · yes
✔ Enter a description for the API key: · graphqlapi
✔ After how many days from now the API key should expire (1-365): · 7
? Do you want to generate code for your newly created GraphQL API Yes
? Choose the code generation language target typescript
? Enter the file name pattern of graphql queries, mutations and subscriptions src/graphql/**/*.ts
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2
? Enter the file name for the generated code src/API.ts
```


## Step 4: Add Authentication

```
amplify add auth
```
```
? Do you want to use the default authentication and security configuration? Default configuration

Warning: you will not be able to edit these selections.
? How do you want users to be able to sign in? Email
? Do you want to configure advanced settings? No, I am done.
```

## Step 5: Add S3 Storage

```
amplify add storage
```
```
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
✔ Provide a friendly name for your resource that will be used to label this category in the project: · productimages3
✔ Provide bucket name: · productimages3bucket
✔ Who should have access: · Auth users only
✔ What kind of access do you want for Authenticated users? · create/update, read, delete
✔ Do you want to add a Lambda Trigger for your S3 Bucket? (y/N) · no
```

## Step 6: Add Lambda function to display low stock alerts

```
amplify add function
```
```
 Select which capability you want to add: Lambda function (serverless function)
? Provide an AWS Lambda function name: lowstockproductcatalog
? Choose the runtime that you want to use: NodeJS
? Choose the function template that you want to use: Hello World

 Do you want to configure advanced settings? Yes
? Do you want to access other resources in this project from your Lambda function? Yes
? Select the categories you want this function to have access to. 
 ◉ api
 ◉ auth
❯◉ function
 ◯ storage

Select the operations you want to permit on productcatalog Query, Mutation, Subscription
? Select the operations you want to permit on productcatalog6e145452 create, read, update, delete
? Do you want to invoke this function on a recurring schedule? No
? Do you want to enable Lambda layers for this function? No
? Do you want to configure environment variables for this function? No
? Do you want to configure secret values this function can access? No
✔ Choose the package manager that you want to use: · NPM

Do you want to edit the local lambda function now? Yes
Edit the file in your editor: amplify/backend/function/lowstockproductcatalog/src/index.js
? Press enter to continue
```
In the lowstockproductcatalog/src/index.js file, replace existing code with the following code.
**Note: Make sure the commented out portion at the beginning does not get deleted.** 

```
const https = require('https');

const GRAPHQL_ENDPOINT = process.env.API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT;
const GRAPHQL_API_KEY = process.env.API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT;
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
        const products = await fetchProducts();
        const lowStockProducts = products.filter(product => 
            product.stock !== null && product.stock < LOW_STOCK_THRESHOLD
        );
        
        console.log(`Found ${lowStockProducts.length} low stock products`);
        
        return {
            message: `Checked ${products.length} products, found ${lowStockProducts.length} low stock items`,
            lowStockProducts: lowStockProducts.map(p => ({
                name: p.engword,
                stock: p.stock
            }))
        };
        
    } catch (error) {
        console.error('Error checking stock:', error.message);
        console.error('Full error:', error);
        throw new Error(`Error checking stock: ${error.message}`);
    }
};

async function fetchProducts() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            query: listProductsQuery
        });
        
        const url = new URL(GRAPHQL_ENDPOINT);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': GRAPHQL_API_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.errors) {
                        reject(new Error(response.errors[0].message));
                    } else {
                        resolve(response.data.listProducts.items || []);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}
```























