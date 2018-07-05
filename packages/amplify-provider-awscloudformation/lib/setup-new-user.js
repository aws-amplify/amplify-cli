const fs = require('fs-extra');
const opn = require('opn');
const chalk = require('chalk');
const inquirer = require('inquirer');

const awsRegions = require('./aws-regions.js').regions;
const constants = require('./constants.js');

function setupNewUser(context){
    let awsConfig = {
        accessKeyId: '<keyID>', 
        secretAccessKey: '<key>',
        region: 'us-east-1'
    }
    let userSelectedRegion = 'us-east-1'
    
    console.log('Please follow these steps to setup your aws access')
    console.log()
    console.log('Please sign up/in your aws account with Administrator Access:')
    console.log(chalk.green(constants.AWSAmazonConsoleUrl))
    opn(constants.AWSAmazonConsoleUrl, {wait: false})

    return context.amplify.pressEnterToContinue.run({message: 'Press Enter to continue'})
    .then((handle)=>{
        console.log('Please specify the new IAM user to be created for amplify-cli')
        return inquirer.prompt([
            {
                type: 'input',
                name: 'userName',
                message: "user name: ",
                default: 'amplify-' + context.amplify.makeId()
            },
            {
                type: 'list',
                name: 'region',
                message: "region: ",
                choices: awsRegions,
                default: 'us-east-1'
            }])
    }).then((answers)=>{
        let deepLinkURL = constants.AWSCreateIAMUsersUrl.replace('{userName}', answers.userName).replace('{region}', answers.region)
        console.log('Please complete the user creation on the aws console')
        console.log(chalk.green(deepLinkURL))
        opn(deepLinkURL, {wait: false})
        userSelectedRegion = answers.region
        return answers.region
    }).then((userSelectedRegion)=>{
        return context.amplify.pressEnterToContinue.run({message: 'Press Enter to continue'})
    }).then((handle)=>{
        console.log('Please enter the access key of the newly created user:')
        return inquirer.prompt([
                {
                    type: 'input',
                    name: 'accessKeyId',
                    message: "accessKeyId: ",
                    default: constants.DefaultAWSAccessKeyId
                },
                {
                    type: 'input',
                    name: 'secretAccessKey',
                    message: "secretAccessKey: ",
                    default: constants.DefaultAWSSecretAccessKey
                }
            ])
    }).then((answers)=>{
        let awsConfigChanged = false
        if(answers.accessKeyId){
            let newKeyId = answers.accessKeyId.trim()
            if(awsConfig.accessKeyId != newKeyId){
                awsConfig.accessKeyId = newKeyId
                awsConfigChanged = true
            }
        }
        if(answers.secretAccessKey){
            let newKey = answers.secretAccessKey.trim()
            if( awsConfig.secretAccessKey != newKey){
                awsConfig.secretAccessKey = newKey
                awsConfigChanged = true
            }  
        }
        if(userSelectedRegion){
            let newRegion = userSelectedRegion.trim()
            if( awsConfig.region != newRegion){
                awsConfig.region = newRegion
                awsConfigChanged = true
            }  
        }
        if(awsConfigChanged){
            let jsonString = JSON.stringify(awsConfig)
            console.log('config changed');
        }
        return awsConfig
    }).then(function(awsConfig){
        if(validateAWSConfig(awsDetails.config)){
            console.log()
            console.log('Successfully set the aws configurations for the amplify-cli')
            if(callback){
                console.log()
                callback(awsDetails)
            }else{
                process.exit()
            }
        }else{
            console.log()
            console.log('Something went wrong, please try again')
            process.exit()
        }
    })
}

function validateAWSConfig(awsConfig){
    return true; 
}


module.exports = {
    setupNewUser
}
  