const v8 = require('v8');

const main = async () => {
    console.log(v8.getHeapStatistics());
    console.log(v8.getHeapStatistics().heap_size_limit / 1024 / 1024 / 1024 ,'GB');
  }
  
  main().catch(err => {
    console.log(err);
    process.exit(1);
  });