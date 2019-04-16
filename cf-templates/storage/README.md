# API

## Tagging
Go to the amplify directory in your project.

Open amplify/storage/YOUR_FUNCTION/YOUR_FUNCTION-parameters.json

Changes:
<pre>
{
    "tableName": "YOUR_FUNCTION",
    "partitionKeyName": "user_id",
    "partitionKeyType": "S",
    "sortKeyName": "id",
    "sortKeyType": "S",<b>,
    "appName": "YOUR_PROJECT"</b>
}
</pre>


then open amplify/storage/YOUR_FUNCTION/YOUR_FUNCTION-cloudformation-template.json

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