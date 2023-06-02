import { exec } from 'child_process';

// @aws-cdk/core indicates CDK v1.
exec('yarn why @aws-cdk/core', (err, stdout, stderr) => {
  const cdkV1PresenceIndicator = '@aws-cdk/core';
  if (stdout.toString().includes(cdkV1PresenceIndicator) || stderr.toString().includes(cdkV1PresenceIndicator)) {
    console.log('Failure! Found CDK V1 references');
    console.log(stdout.toString());
    process.exit(1);
  } else {
    console.log('Success! CDK V1 not found');
  }
});
