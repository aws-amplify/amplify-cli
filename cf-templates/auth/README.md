# Auth

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

then open amplify/auth/USER_POOL_ID/USER_POOL_ID-cloudformation-template.yml

Changes:
<pre> 
UserPool:
  Type: AWS::Cognito::UserPool
    Properties:
    ...
      <b>UserPoolTags:
        project: !Ref appName
        application: !Join ['',[!Ref appName, '-', !Ref env]]</b>
</pre> 

## Custom attributes

Open amplify/auth/USER_POOL_ID/USER_POOL_ID-cloudformation-template.yml

Changes:
<pre> 
UserPool:
  Type: AWS::Cognito::UserPool
    Properties:
    ...
      Schema:
        
        -
          Name: email
          Required: true
          Mutable: true
          
      <b>
        -
          AttributeDataType: "String"
          Mutable: true
          Name: attributeName
          StringAttributeConstraints:
            MaxLength: 256
            MinLength: 1</b>
</pre> 
