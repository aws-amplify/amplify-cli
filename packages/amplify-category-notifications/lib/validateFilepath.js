module.exports = (filepath)=>{
    result = false;
    if(filepath){
      result = fs.existsSync(filepath); 
    } 
    return result || 'file path must be valid'; 
};