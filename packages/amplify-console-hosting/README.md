# AWS Amplify CLI plugin use guide

AWS Amplfiy Console CLI Plugin provides Amplify CLI users an easy way to deploy their web app on AWS Amplify Console. There are two kinds of deployment: 
1. continuous deployment: provide Git-based workflow for building and deploying artifacts in AWS Amplify Console
2. manual deployment: allow user directly upload build artifacts to s3 and leverage AWS Amplify console customize settings.

## Manual deployment flow
### amplify add hosting
1. Will run a check method before, if the user's amplify app already has branches, we don't allow him to enable amplify hosting.
2. This command will generates configuration files, including CFN template under /amplify/backend/hosting/amplifyconsole/template.json. 
backend-config, amplify-meta, team-provider-info.json

### amplify push 
1. Deploy AWS::Amplify::Branch resource under user's app.

### amplify hosting publish 
1. Will first run amplify push
2. Build the artifacts via the commands stored in project config (User have to run install commands first, otherwise the build will failed)
3. generated zip file by timestamp.
4. upload zip file to s3 buckets AWS Amplify Console provided.
5. Cleanup zip file and show hosting url.

### amplify hosting configure
1.  will redirect user to AWS Amplify Console page. 

### amplify hosting console
1. will open the hosting url

### amplify env add
1. will duplicate hosting/amplifyconsole settings in team-provider-info to new environment configuration.

### amplify remove hosting
1. will remove all the configuration file && template for current env

## CICD deployment flow
### amplify add hosting
1. Will run a check method before, if the user's amplify app already has branches, we don't allow him to enable amplify hosting.
2. This command will generates configuration files, amplify hosting folder /amplify/backend/hosting/amplifyconsole/. No CFN template file will be genrated. 
backend-config, amplify-meta, team-provider-info.json

### amplify push 
1. Do nothing / No deployment will be executed

### amplify hosting publish 
1. Will open AWS Amplify Console for user

### amplify hosting configure
1.  Will open AWS Amplify Console for user

### amplify hosting console
1. will open the hosting url for current env for user

### amplify env add
1. will duplicate hosting/amplifyconsole settings in team-provider-info to new environment configuration.

### amplify remove hosting
1. will remove all the configuration file && template for current env

## amplify hosting status
Will show a table list all the domains that associated with current amplify app.



