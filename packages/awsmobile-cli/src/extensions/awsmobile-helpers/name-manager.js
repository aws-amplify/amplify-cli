/* 
 * Copyright 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
*/
"use strict";
const moment = require('moment');
const awsmobileConstant = require('./constants');


function generateAWSConfigFileName(projectName)
{
    return projectName + '-'  + makeid() + '.json'
}

function generateIAMUserName()
{
    return 'AWSMobileCLI-'  + makeid()
}

function generateBackendParentStackName(projectName)
{
    return projectName + '-' + moment().format(awsmobileConstant.DateTimeFormatStringCompact)
}

function generateDeviceFarmTestRunName(projectInfo)
{
    return Date.now().toString()
}

function generateCloudFrontInvalidationReference(projectInfo)
{
    return Date.now().toString()
}

function generateTempName(seedName)
{
    return seedName + makeid()
}

function generateGraphqlAPIName(projectInfo){
    return projectInfo.BackendProjectName
}

function makeid(n) {
    if(!n){
        n = 5
    }
    let text = ""
    let possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    for (let i = 0; i <n; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
}

module.exports = {
    generateAWSConfigFileName,
    generateIAMUserName,
    generateBackendParentStackName,
    generateDeviceFarmTestRunName,
    generateCloudFrontInvalidationReference,
    generateTempName,
    generateGraphqlAPIName,
    makeid,
}
  