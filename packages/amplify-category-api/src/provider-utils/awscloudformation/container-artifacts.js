export const containerFiles = {
  Dockerfile: `FROM node:alpine
  
ENV PORT=8080
EXPOSE 8080

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

CMD [ "node", "index.js" ]
    `,
  'package.json': `{
  "name": "express-lasagna",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "aws-sdk": "^2.792.0",
    "body-parser": "^1.19.0",
    "express": "^4.17.1"
  }
}`,
  'index.js': `const express = require("express");
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

const {
  addPostToDDB,
  scanPostsFromDDB,
  getPostFromDDB
} = require('./DynamoDBActions');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

const checkAuthRules = (req) => {
  const jwt = req.header("Authorization") || "";
  
  const [, jwtBody] = jwt.split(".");
  
  const obj = JSON.parse(
    jwtBody ? Buffer.from(jwtBody, "base64").toString("utf-8") : "{}"
  );
  
  //Customer can perform logic on JWT body
  //console.log(obj);

  //Failure example:
  // const err = new Error("Access denied");
  // err.statusCode = 403;
  // return next(err);
}

app.get("/list", async (req, res, next) => {
  checkAuthRules(req);

  try {
    const result = await scanPostsFromDDB();
    res.contentType("application/json").send(result);
  } catch (err){
    next(err);
  }
});

app.get("/read", async (req, res, next) => {
  checkAuthRules(req);

  try {
    const result = await getPostFromDDB(req.query.id);
    res.contentType("application/json").send(result);
  } catch (err){
    next(err);
  }
});

app.post("/create", async (req, res, next) => {
  checkAuthRules(req);
  
  try {
    const result = await addPostToDDB(req.body);
    res.contentType("application/json").send(result);
  } catch (err){
    next(err);
  }
});

app.use((req, res, next) => {
  checkAuthRules(req);

  try {
    const result = "Please try one of the standard routes such as /list, /read, or /create";
    res.contentType("application/json").send(result);
  } catch (err){
    next(err);
  }
});


// Error middleware must be defined last
app.use((err, req, res, next) => {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
  res
    .status(err.statusCode)
    .json({ message: err.message })
    .end();
});

app.listen(port, () => {
  console.log('Example app listening at http://localhost:' + port);
});  
`,
'DynamoDBActions.js':`const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.STORAGE_POSTS_NAME;

const addPostToDDB = async ({id, title, author, description, topic}) => {

  var params = {
    Item : {
      id: parseInt(id),
      title: title,
      author: author,
      description: description,
      topic: topic
    },
    TableName: TableName
  }
  try {
    const data = await docClient.put(params).promise()
    return params.Item;
  } catch (err) {
    console.log('Error: ' + err);
    return err
  }
}

const scanPostsFromDDB = async () =>{
  var params = {
    TableName: TableName,
  }

  try {
    const data = await docClient.scan(params).promise();
    return data.Items;
  } catch (err){
    console.log('Error: ' + err);
    return err;
  }
}

const getPostFromDDB = async (id) => {
  const key = parseInt(id);
  var params = {
    TableName: TableName,
    Key: { id: key },
  }
  try {
    const data = await docClient.get(params).promise()
    return data.Item;
  } catch (err) {
    console.log('Error: ' + err);
    return err
  }
}

module.exports = {
  addPostToDDB,
  scanPostsFromDDB,
  getPostFromDDB
};`
};
