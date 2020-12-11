const express = require("express");
const port = 8080;
const app = express();
const path = require("path");
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
