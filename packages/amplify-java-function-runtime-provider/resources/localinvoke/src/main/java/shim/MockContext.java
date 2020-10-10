package shim;

import com.amazonaws.services.lambda.runtime.ClientContext;
import com.amazonaws.services.lambda.runtime.CognitoIdentity;
import com.amazonaws.services.lambda.runtime.Context;

public class MockContext implements Context {
    public String AwsRequestId = "mockAwsRequestId";
    public ClientContext ClientContext =  null;
    public String FunctionName = "mockFunctionName" ;
    public CognitoIdentity Identity = null;
    public MockLogger Logger = new MockLogger();
    public String LogGroupName = "YourCloudWatchLogGroupName";
    public String LogStreamName = "YourCloudWatchStreamName";
    public int MemoryLimitInMB = 128;
    @Override
    public String getAwsRequestId() {
        return AwsRequestId;
    }

    @Override
    public String getLogGroupName() {
        return LogGroupName;
    }

    @Override
    public String getLogStreamName() {
        return LogStreamName;
    }

    @Override
    public String getFunctionName() {
        return FunctionName;
    }

    @Override
    public CognitoIdentity getIdentity() {
        return Identity;
    }

    @Override
    public com.amazonaws.services.lambda.runtime.ClientContext getClientContext() {
        return ClientContext;
    }

    @Override
    public int getRemainingTimeInMillis() {
        return MemoryLimitInMB;
    }

    @Override
    public int getMemoryLimitInMB() {
        return 0;
    }

    @Override
    public MockLogger getLogger() {
        return Logger;
    }

    @Override
    public String getInvokedFunctionArn() {
        return null;
    }

    @Override
    public String getFunctionVersion() {
        return null;
    }
}
