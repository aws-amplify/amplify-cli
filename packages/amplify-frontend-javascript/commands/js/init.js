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

// const analyzeProject = require('../init-steps/s1-analyze-project.js')
// const chooseStrategy = require('../init-steps/s2-choose-strategy.js')
// const initialize = require('../init-steps/s3-initialize.js')
// const configure = require('../init-steps/s4-configure.js')
// const setupBackend = require('../init-steps/s5-setup-backend.js')
// const onSuccess = require('../init-steps/s60-on-success.js')
// const onFailure = require('../init-steps/s61-on-failure.js')

function init(yesFlag){

    let projectPath = process.cwd()
    let initInfo = {
        projectPath: projectPath,
        yesFlag: yesFlag
    }

    // return analyzeProject.run(initInfo)
    // .then(chooseStrategy.run)
    // .then(initialize.run)
    // .then(configure.run)
    // .then(setupBackend.run)
    // .then(onSuccess.run)
    // .catch(onFailure.run)
}

module.exports = {
    name: 'init',
    run: async (context) => {
        console.log('int js project///')
        init(true)
    }
}
  