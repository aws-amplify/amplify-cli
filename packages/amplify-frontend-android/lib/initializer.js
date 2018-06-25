function run(context) {
  return new Promise((resolve) => {
    resolve(context); 
  }); 
}

function onInitSuccessful(context) {
  return context; 
}

module.exports = {
  run,
  onInitSuccessful,
};
