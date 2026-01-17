/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
  API_FITNESSTRACKER_GRAPHQLAPIIDOUTPUT
  API_FITNESSTRACKER_MEALTABLE_ARN
  API_FITNESSTRACKER_MEALTABLE_NAME
  ENV
  REGION
Amplify Params - DO NOT EDIT */

const TABLE_NAME = process.env.API_FITNESSTRACKER_MEALTABLE_NAME;

const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const crypto = require('crypto');

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.post('/nutrition/log', async function (req, res) {
  const userName = req.body.userName;
  const content = req.body.content;
  const timestamp = new Date().toISOString();

  let message;
  try {
    await dynamoDB.send(
      new PutCommand({
        TableName: TABLE_NAME,
        // since this table is defined as model we need to populate all fields that are augmented by amplify.
        // its very ugly I know, but i just want this API to actually store some data somewhere.
        Item: { id: crypto.randomUUID(), userName, content, timestamp, createdAt: timestamp, updatedAt: timestamp, __typename: 'Meal' },
      }),
    );
    message = 'logged successfully';
  } catch (error) {
    message = error.message;
  }

  res.json({ message });
});

app.post('/nutrition/log/*', async function (req, res) {
  // Add your code here
  res.json({ success: 'post call succeed!', url: req.url, body: req.body });
});

app.listen(3000, function () {
  console.log('App started');
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
