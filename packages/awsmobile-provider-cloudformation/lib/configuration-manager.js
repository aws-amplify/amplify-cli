function configure(context){
}

// function getConfiguration(context){
// }

function getConfiguration(context){
    const region = "<region>";
    const credential = {
        accessKeyId: "<accessKeyId>",
        secretAccessKey: "<secretAccessKey>",
    }
    return {
        accessKeyId: credential.accessKeyId,
        secretAccessKey: credential.secretAccessKey,
        region,
    };
}

module.exports = {
    configure,
    getConfiguration
}