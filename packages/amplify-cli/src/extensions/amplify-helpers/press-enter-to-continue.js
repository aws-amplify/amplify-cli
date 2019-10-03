function run(handle) {
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    console.log(handle.message);
    process.stdin.once('data', data => {
      handle.data = data;
      resolve(handle);
    });
  });
}

module.exports = {
  run,
};
