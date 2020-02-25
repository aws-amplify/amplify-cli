const S3 = require('../src/aws-utils/aws-s3.js');
const configManager = require('../lib/system-config-manager');
const uuid = require('uuid');
describe('test S3 utils', () => {
  const profiles = configManager.getNamedProfiles();
  const profileNames = Object.keys(profiles);
  const selectProfileName = profileNames.includes('default') ? 'default' : profileNames[0];
  const credentials = configManager.getProfileCredentials(selectProfileName);
  beforeEach(() => {
    jest.setTimeout(1000 * 60 * 60);
  });

  it('should upload 3000 objects and delete them', async () => {
    const s3 = await new S3({ credentials }, {});
    const bucketName = uuid.v1();
    const count = 3000;
    await s3.createBucket(bucketName);
    const s3Params = [...Array(count).keys()].map(num => {
      return {
        Bucket: bucketName,
        Body: uuid.v1(),
        Key: `${num}.txt`,
      };
    });
    await Promise.all(s3Params.map(p => s3.putFile(p)));
    await s3.deleteS3Bucket(bucketName);
    expect(await s3.ifBucketExists(bucketName)).toEqual(false);
  });
});
