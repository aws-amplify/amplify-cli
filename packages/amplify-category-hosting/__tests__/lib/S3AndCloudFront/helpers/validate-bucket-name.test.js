const validateBucketName = require('../../../../lib/S3AndCloudFront/helpers/validate-bucket-name');

describe('validate-bucket-name', () => {
  test('validate, lentgh', () => {
    const bucketName = 'bn';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, case', () => {
    const bucketName = 'BucketName';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, start', () => {
    const bucketName = '-bucketname';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, end', () => {
    const bucketName = 'bucketname-';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, consecutive periods', () => {
    const bucketName = 'bucket..name';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, dash adjacent to period', () => {
    const bucketName = 'bucket-.name';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, ip address', () => {
    const bucketName = '192.168.1.1';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeFalsy();
  });

  test('validate, good bucket name', () => {
    const bucketName = 'my.bucket-name10';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeTruthy();
    expect(result).toEqual(true);
  });

  test('validate, good bucket name with more than 63 characters', () => {
    const bucketName = 'my.bucket-name10-more-than-63-characters-should-not-be-allowed-pqwew-qwesd-seredasde-wqe';
    const result = validateBucketName(bucketName);
    expect(typeof result === 'boolean').toBeTruthy();
    expect(result).toEqual(true);
  });
});
