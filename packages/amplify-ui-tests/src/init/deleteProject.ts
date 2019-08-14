import * as AWS from 'aws-sdk';
import * as nexpect from 'nexpect';

import { getCLIPath, isCI } from '../utils';
import { getProjectMeta } from '../utils';
export default function deleteProject(
  cwd: string,
  deleteDeploymentBucket: Boolean = true,
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    const meta = getProjectMeta(cwd).providers.awscloudformation;
    nexpect
      .spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y\r')
      .wait('Project deleted locally.')
      .run(async function(err: Error) {
        if (!err) {
          const { DeploymentBucketName } = meta;
          if (deleteDeploymentBucket) {
            const s3 = new AWS.S3();
            const { Contents: items } = await s3
              .listObjects({ Bucket: DeploymentBucketName })
              .promise();
            const promises = [];
            items.forEach(item => {
              promises.push(s3.deleteObject({ Bucket: DeploymentBucketName, Key: item.Key }).promise());
            });
            await Promise.all(promises);
            await s3.deleteBucket({ Bucket: DeploymentBucketName }).promise();
            resolve();
          } else {
            resolve();
          }
        } else {
          reject(err);
        }
      });
  });
}
