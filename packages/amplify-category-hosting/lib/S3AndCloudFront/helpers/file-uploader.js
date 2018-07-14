const chalk = require('chalk'); 
const mime = require('mime-types');
const fileScanner = require('./file-scanner'); 
const serviceName = 'S3AndCloudFront';
const providerName = "amplify-provider-awscloudformation";
const publishIgnore = {
    DirectoryList: [],
    FileList: []
},

function run(context, distributionDirPath){
    const s3Client = getS3Client(context);
    const hostingBucketName = getHostingBucketName(context);
    
    let fileList = fileScanner.scan(distributionDirPath, publishIgnore.DirectoryList, publishIgnore.FileList);

    let uploadFileTasks = [];

    fileList.forEach(filePath => {
        uploadFileTasks.push(()=>uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath));
    });

    return Promise.all(uploadFileTasks);
}

function getS3Client(context){
    const {projectConfig} = context.exeInfo; 
    const provider = require(projectConfig.providers[providerName]);
    const aws = provider.getConfiguredAWSClient(context); 
    return new aws.S3(); 
}

function getHostingBucketName(context){
    const {amplifyMeta} = context.exeInfo; 
    return amplifyMeta[constants.CategoryName][serviceName]['output']['HostingBucketName'];
}

function uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath){
    return new Promise((resolve, reject)=>{
        let relativeFilePath = path.relative(distributionDirPath, filePath);
                
        // make Windows-style relative paths compatible to S3
        relativeFilePath = relativeFilePath.replace(/\\/g, '/');
        
        let fileStream = fs.createReadStream(filePath);
        let contentType = mime.lookup(relativeFilePath)
        let uploadParams = {
            Bucket: hostingBucketName, 
            Key: relativeFilePath, 
            Body: fileStream, 
            ContentType: contentType? contentType: "text/plain"
        };
        
        s3Client.upload(uploadParams, function (err, data) {
            if (err) {
                reject(err);
            }else{
                resolve(data); 
            }
        })
    })
}

module.exports = {
    run
}