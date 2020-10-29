exports.handler = event => {
  // insert code to be executed by your lambda trigger
  console.log(JSON.stringify(event, null, 2));
  let res = '';
  if ('Records' in event) {
    event.Records.forEach(record => {
      console.log(record.eventID);
      console.log(record.eventName);
      console.log('Kinesis Record: %j', record.kinesis);
    });
    res += 'Successfully processed DynamoDB record';
  } else {
    res += 'Kinesis records not present in event';
  }

  return Promise.resolve(res);
};
