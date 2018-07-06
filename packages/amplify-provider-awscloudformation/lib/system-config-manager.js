const fs = require('fs-extra'); 
const path = require('path'); 
const ini = require('ini'); 
const os = require('os'); 

const dotAWSDirPath = path.normalize(path.join(os.homedir(), ".aws")); 
const credentialsFilePath = path.join(dotAWSDirPath, "credentials"); 
const configFilePath = path.join(dotAWSDirPath, "config"); 

function setProfile(awsConfig, profileName){
    fs.ensureDirSync(dotAWSDirPath);

    let credentials = {}; 
    let config = {}; 
    if(fs.existsSync(credentialsFilePath)){
        credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8')); 
    }
    if(fs.existsSync(configFilePath)){
        config = ini.parse(fs.readFileSync(configFilePath, 'utf-8')); 
    }
    
    let isCredSet = false; 
    Object.keys(credentials).forEach(key=>{
        const keyName = key.trim(); 
        if(profileName === keyName){
            credentials[key]['aws_access_key_id'] = awsConfig.accessKeyId;
            credentials[key]['aws_secret_access_key'] = awsConfig.secretAccessKey;
            isCredSet = true; 
        }
    });
    if(!isCredSet){
        credentials[profileName] = {
            'aws_access_key_id': awsConfig.accessKeyId, 
            'aws_secret_access_key': awsConfig.secretAccessKey
        };
    }

    let isConfigSet = false; 
    Object.keys(config).forEach(key=>{
        const keyName = key.replace('profile', '').trim(); 
        if(profileName === keyName){
            config[key]['region'] = awsConfig.region;
            isConfigSet = true; 
        }
    });
    if(!isConfigSet){
        config['profile ' + profileName] = {
            'region': awsConfig.region, 
        };
    }

    fs.writeFileSync(credentialsFilePath, ini.stringify(credentials));
    fs.writeFileSync(configFilePath, ini.stringify(config));
}

function getProfile(profileName){
    let awsConfig; 
    if(fs.existsSync(credentialsFilePath) && fs.existsSync(configFilePath)){
        let accessKeyId; 
        let secretAccessKey; 
        let region; 
    
        const credentials = ini.parse(fs.readFileSync(credentialsFilePath, 'utf-8')); 
        const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8')); 
        
        Object.keys(credentials).forEach(key=>{
            const keyName = key.trim(); 
            if(profileName === keyName){
                accessKeyId = credentials[key]['aws_access_key_id'];
                secretAccessKey = credentials[key]['aws_secret_access_key'];
            }
        })
    
        Object.keys(config).forEach(key=>{
            keyName = key.replace('profile', '').trim(); 
            if(profileName === keyName){
                region = config[key]['region'];
            }
        })
    
        if(accessKeyId && secretAccessKey && region){
            awsConfig = {
                accessKeyId,
                secretAccessKey,
                region
            };
        }
    }
    return awsConfig;
}


module.exports = {
    setProfile,
    getProfile,
}
  