const fs = require('fs');
const pathManager = require('./path-manager');

function getCategoryOutputs() {
    const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

    let categoryOutpus = {}; 

    Object.keys(amplifyMeta).forEach(categoryKey => {
        const categoryMeta = amplifyMeta[categoryKey]; 
        Object.keys(categoryMeta).forEach(serviceUnitKey => {
            const serviceUnitMeta = categoryMeta[serviceUnitKey]; 
            if(serviceUnitMeta['output']){
                if(!categoryOutpus[categoryKey]){
                    categoryOutpus[categoryKey] = {}; 
                }
                categoryOutpus[categoryKey][serviceUnitKey] = serviceUnitMeta['output']; 
            }
        }); 
    });

    return categoryOutpus; 
}

module.exports = {
    getCategoryOutputs,
};
