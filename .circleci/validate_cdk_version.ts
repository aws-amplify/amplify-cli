import { exec } from 'child_process';

// @aws-cdk/core indicates CDK v1.
exec('yarn why @aws-cdk/core', (err, stdout, stderr) => {

  const cdkV1AbsenceIndicator = "We couldn't find a match";
  if (stdout.toString().includes(cdkV1AbsenceIndicator) || stderr.toString().includes(cdkV1AbsenceIndicator)) {
    console.log('Success! CDK V1 not found');
  } else {
    console.log('Failure! Found CDK V1 references');
    console.log(stdout.toString());
    process.exit(1);
  }
});

