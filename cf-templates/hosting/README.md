# API

## Tagging
Go to the amplify directory in your project.

Open amplify/hosting/S3AndCloudFront/parameters.json

Changes:
<pre>
{
    "bucketName": "YOUR_PROJECT",
    "AcmCertificateArn": "arn:aws:acm:us-east-1:*****:certificate/*****",
    "domainName": "YOUR_PROJECT.example.com",<b>,
    "appName": "YOUR_PROJECT"</b>
}
</pre>


then open amplify/storage/S3AndCloudFront/template.json

Changes:
<pre> 
"Parameters": {
    ...
    "tableName": {
        "Type": "String"
    }<b>,
    "appName": {
        "Type": "String"
    }</b>
        
    ...
    "Resources": {
        "DynamoDBTable": {
            "Type": "AWS::DynamoDB::Table",
            <b>"Tags": [
              {
                "Key": "project",
                "Value": {
                  "Ref": "appName"
                }
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