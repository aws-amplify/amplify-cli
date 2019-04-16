# Function

## Tagging
Go to the amplify directory in your project.

Open amplify/api/YOUR_FUNCTION/YOUR_FUNCTION-cloudformation-template.json

Changes:
<pre> 
"LambdaFunction": {
    "Type": "AWS::Lambda::Function",
    "Metadata": {
        "aws:asset:path": "./src",
        "aws:asset:property": "Code"
    },
    "Properties": {
    ...
        <b>"Tags": [
            {
                "Key": "project",
                "Value": "YOUR_FUNCTION"
            },
            {
                "Key": "application",
                "Value": {
                    "Fn::Join": [
                        "",
                        [
                            "YOUR_FUNCTION",
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