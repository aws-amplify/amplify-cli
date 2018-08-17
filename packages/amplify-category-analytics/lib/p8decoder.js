const fs = require('fs-extra'); 

// const key = `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgv4+HQL+Whffe8A70
// +5ase92VM8E0uJCkg8S3XOx8cp2gCgYIKoZIzj0DAQehRANCAARV4jEgLetWJYkh
// 3AZSnpSZYi9qfq9Q7LggoyzjYCZit3cl6/ClbcwH6ucO/VWyNjI+4rvVmLklbQQF
// zbg6QoQ3`;

function run(filaPath){
    let content = fs.readFileSync(filaPath, "utf8"); 
    content = content.replace(/-----.*-----/gi, '');
    return content.trim(); 
}

module.exports = {
    run
}