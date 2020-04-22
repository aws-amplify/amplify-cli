using System;
using Amazon.Lambda.Core;

namespace InvocationShim
{
    internal class MockContext : ILambdaContext
    {
        internal MockContext(string functionName) {
            FunctionName = functionName;
        }

        public string AwsRequestId => Guid.NewGuid().ToString();
        public IClientContext ClientContext => throw new NotImplementedException();
        public string FunctionName { get; private set; }
        public string FunctionVersion => "HEAD";
        public ICognitoIdentity Identity => null;
        public string InvokedFunctionArn => "arn:aws:lambda:us-east-1:000000000000:function:<%= props.functionName %>";
        public ILambdaLogger Logger => new MockLogger();
        public string LogGroupName => "YourCloudWatchLogGroupName";
        public string LogStreamName => "YourCloudWatchStreamName";
        public int MemoryLimitInMB => 128;
        public TimeSpan RemainingTime => TimeSpan.FromSeconds(30);
    }
}
