# Analytics

## Tagging
Go to the amplify directory in your project. 

Open amplify/analytics/YOUR_PROJECT/pinpoint-cloudformation-template.json

Changes:
<pre>
"PinpointFunction": {          
  "Type": "AWS::Lambda::Function",
  "Condition": "ShouldCreatePinpointApp",
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
             ]<b/>
  }
}
</pre>