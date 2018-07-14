function getPlugin(context, pluginName) {
    let result;
    const {plugins} = context.runtime;
    for(let i=0; i<plugins.length; i++){
        if (plugins[i].name === pluginName){
          result = plugin.directory;
          break;
        }
    }
    return result;
}
  
module.exports = {
    getPlugin,
};
  