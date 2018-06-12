
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
function run(handle){
    return new Promise((resolve, reject)=>{
        process.stdin.resume()
        process.stdin.setEncoding('utf8')
        console.log(handle.message)
        process.stdin.once('data', function(data){
            handle.data = data
            resolve(handle)
        })
    })
}

module.exports = {
    run
}