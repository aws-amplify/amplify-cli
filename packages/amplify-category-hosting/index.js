const addCommand = require('./commands/hosting/add'); 
const removeCommand = require('./commands/hosting/remove'); 
const publishCommand = require('./commands/hosting/publish'); 

function add(context){
    return addCommand.run(context); 
}

function remove(context){
    return removeCommand.run(context); 
}

function publish(context){
    return publishCommand.run(context); 
}

module.exports = {
    add,
    remove,
    publish
}