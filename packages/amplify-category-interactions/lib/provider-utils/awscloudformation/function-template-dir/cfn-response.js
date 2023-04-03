"use strict";
exports.SUCCESS = 'SUCCESS';
exports.FAILED = 'FAILED';
exports.send = function (event, context, responseStatus, responseData, physicalResourceId, noEcho) {
    const responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
        PhysicalResourceId: physicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        NoEcho: noEcho || false,
        Data: responseData,
    });
    console.log('Response body:\n', responseBody);
    const https = require('https');
    const url = require('url');
    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length,
        },
    };
    const request = https.request(options, (response) => {
        console.log(`Status code: ${response.statusCode}`);
        console.log(`Status message: ${response.statusMessage}`);
        context.done();
    });
    request.on('error', (error) => {
        console.log(`send(..) failed executing https.request(..): ${error}`);
        context.done();
    });
    request.write(responseBody);
    request.end();
};
//# sourceMappingURL=cfn-response.js.map