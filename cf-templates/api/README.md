# API

## Tagging
Go to the amplify directory in your project.

Open amplify/api/YOUR_FUNCTION/YOUR_FUNCTION-parameters.json

Changes:
<pre>
{
    "authRoleName": {
        "Ref": "AuthRoleName"
    },
    "unauthRoleName": {
        "Ref": "UnauthRoleName"
    }<b>,
    "appName": "YOUR_PROJECT"</b>
}
</pre>


then open amplify/api/YOUR_FUNCTION/YOUR_FUNCTION-cloudformation-template.json

Changes:
<pre> 
"Parameters": {
    "authRoleName": {
        "Type":  "String"
    },
    "unauthRoleName": {
        "Type":  "String"
    },
    "env": {
        "Type": "String"
    }<b>,
    "appName": {
        "Type": "String"
    }</b>
        
...
        
"DeploymentAPIGWYOUR_FUNCTIONb87d1a21": {
  "Type": "AWS::ApiGateway::Deployment",
  "Properties": {
    ...
    <b>"StageDescription": {
        "Tags": [
           {
             "Key": "project",
             "Value": { "Ref": "appName" }
           },
           {
             "Key": "application",
             "Value": {
               "Fn::Join": [
                 "",
                 [
                   { "Ref": "appName" },
                   "-",
                   {
                     "Ref": "env"
                   }
                 ]
               ]
             }
           }
         ]</b>
    ...
  }
}
</pre> 