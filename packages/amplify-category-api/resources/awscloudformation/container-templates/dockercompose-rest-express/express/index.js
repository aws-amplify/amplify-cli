const express = require("express");
const bodyParser = require('body-parser');
const http = require('http');
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

app.get("/images", (req, res, next) => {
  const options = {
    port: 5000,
    host: 'localhost',
    method: 'GET',
    path: '/images'
  };

  http.get(options, data => {
    var body = '';
    data.on('data', (chunk) => {
      body += chunk;
    });
    data.on('end', () =>{
      console.log(body);
      try {
        res.contentType("application/json").send(body);
      } catch (err){
        console.log(err);
        next(err);
      }
    }).on('error', (error) => {
      console.log(error);
    });
  })
});

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
