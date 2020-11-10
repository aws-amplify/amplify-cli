export const containerFiles = {
    Dockerfile: `
  FROM node:node
  
  ENV PORT=8080
  EXPOSE \${PORT}
  
  WORKDIR /usr/src/app
  
  COPY index.js ./
  COPY package.json ./
  
  RUN npm i
  
  CMD [ "node", "index.js" ]
    `,
    'package.json': `
    {
      "name": "express-lasagna",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "test": "echo \\"Error: no test specified\\" && exit 1"
      },
      "keywords": [],
      "author": "",
      "license": "ISC",
      "dependencies": {
        "express": "^4.17.1"
      }
    }  
    `,
    'index.js': `
    const express = require("express");
    const app = express();
    const port = process.env.PORT;
  
    // Enable CORS for all methods
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*")
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
      next()
    });
    
    app.get("/", (req, res) => {
      const jwt = req.header("Authorization") || "";
    
      const [, jwtBody] = jwt.split(".");
    
      const obj = JSON.parse(
        jwtBody ? Buffer.from(jwtBody, "base64").toString("utf-8") : "{}"
      );
    
      const result = JSON.stringify(obj, null, 2);
    
      res.contentType("application/json").send(result);
    });
    
    app.listen(port, () => {
      console.log(\`Example app listening at http://localhost:\${port}\`);
    });  
    `,
  };
  