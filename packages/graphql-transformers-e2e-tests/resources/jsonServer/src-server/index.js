'use strict'
const path = require('path');
const fs = require('fs');
const os = require('os');
const awsServerlessExpress = require('aws-serverless-express');
const jsonServer = require('json-server');
const db = require('db.json');

const writableDbPath = path.join(os.tmpdir(), 'db.json');

fs.writeFileSync(writableDbPath, JSON.stringify(db));

const app = jsonServer.create();
const router = jsonServer.router(writableDbPath);
const middlewares = jsonServer.defaults();

app.use(middlewares);
app.use(router);

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
