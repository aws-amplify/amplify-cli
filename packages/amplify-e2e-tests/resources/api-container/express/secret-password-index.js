const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
});

app.get('/password', (req, res, next) => {
    try {
        const result = process.env.PASSWORD;
        res.contentType('application/json').send(result);
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
