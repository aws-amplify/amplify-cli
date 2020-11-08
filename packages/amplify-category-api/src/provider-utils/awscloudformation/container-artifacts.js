const buildspec = `version: 0.2
phases:
  install:
    runtime-versions:
      docker: 19
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws --version
      - $(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)
      # - REPOSITORY_URI=694883026597.dkr.ecr.us-east-1.amazonaws.com/docker-on-aws/nodejs
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"%s","imageUri":"%s"}]' $CONTAINER_NAME $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
    files: imagedefinitions.json
    `;
    
export const containerFiles = {
    'buildspec.yml': buildspec,
    Dockerfile: `
  FROM node:alpine
  
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
  