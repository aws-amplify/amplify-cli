# Function

## Tagging
Go to the amplify directory in your project.

The function CloudFormation templates do not have generated parameter.json files at the moment. 
But this does not stop you from creating one. 

Create a parameter.json file in amplify/api/YOUR_FUNCTION/parameter.json

Changes:
<pre>
{
    "appName": "YOUR_PROJECT"
}
</pre>

The Amplify CLI will use this file if it exists.
 
then open amplify/api/YOUR_FUNCTION/YOUR_FUNCTION-cloudformation-template.json

Changes:
<pre> 
	"Parameters": {
    ...
		<b>"appName": {
			"Type": "String"
		}</b>
	},
	...
	"Resources": {
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
