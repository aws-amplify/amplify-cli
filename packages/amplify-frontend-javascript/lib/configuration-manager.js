const frameworkConfigMapping = require('./framework-config-mapping');

function init(context){
    const framework = guessFramework(context.initInfo.projectPath); 
    const config = frameworkConfigMapping[framework]; 
    if(!config){
        config = frameworkConfigMapping.default; 
    }
}

function configure(context){
    const projectConfig = context.amplify.getprojectdetails(); 
}

function onInitSuccessful(context){
}

function loadProjectConfig(context){
}

function guessFramework(projectPath){
    let frameWork;
    const packageJsonFilePath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonFilePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'));
        if(packageJson && packageJson.dependencies){
            if(packageJson.dependencies['react']){
                frameWork = 'react' ;
                if(packageJson.dependencies['react-native']){
                    frameWork = 'react-native';
                }
            }else if(packageJson.dependencies['@angular/core']){
                frameWork = 'angular';
                if(packageJson.dependencies['ionic-angular']){
                    frameWork = 'ionic';
                }
            }else if(packageJson.dependencies['vue']){
                frameWork = 'vue';
            }
        }
    }
    return frameWork;
}

module.exports = {
    init,
    onInitSuccessful,
    configure,
    loadProjectConfig,
};
  