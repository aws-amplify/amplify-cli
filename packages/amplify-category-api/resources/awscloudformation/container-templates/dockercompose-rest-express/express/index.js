const express = require("express");
const bodyParser = require('body-parser');
const http = require('http');
const port = process.env.PORT || 3001;

const {
    addPostToDDB,
    scanPostsFromDDB,
    getPostFromDDB
} = require('./DynamoDBActions');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
});

const checkAuthRules = (req, res, next) => {
    const jwt = req.header("Authorization") || "";

    const [, jwtBody] = jwt.split(".");

    const obj = JSON.parse(
        jwtBody ? Buffer.from(jwtBody, "base64").toString("utf-8") : "{}"
    );

    //Customer can perform logic on JWT body
    //console.log(obj);
    next();

    //Failure example:
    // const err = new Error("Access denied");
    // err.statusCode = 403;
    // return next(err);
}

app.use(checkAuthRules);

app.get("/posts", async (req, res, next) => {

    try {
        const result = await scanPostsFromDDB();
        res.contentType("application/json").send(result);
    } catch (err) {
        next(err);
    }
});

app.get("/post", async (req, res, next) => {
    console.log(req.query.id);

    try {
        const result = await getPostFromDDB(req.query.id);
        res.contentType("application/json").send(result);
    } catch (err) {
        next(err);
    }
});

app.post("/post", async (req, res, next) => {

    try {
        const result = await addPostToDDB(req.body);
        res.contentType("application/json").send(result);
    } catch (err) {
        next(err);
    }
});

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
        data.on('end', () => {
            console.log(body);
            try {
                res.contentType("application/json").send(body);
            } catch (err) {
                console.log(err);
                next(err);
            }
        }).on('error', (error) => {
            console.log(error);
        });
    })
});

app.use((req, res, next) => {

    try {
        const result = `Please try GET on /posts, /post?id=xyz, GET on /images, or a POST to /post with JSON {\"id\":\"123\",\"title\":\"Fargate test\"}`;
        res.contentType("application/json").send(result);
    } catch (err) {
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