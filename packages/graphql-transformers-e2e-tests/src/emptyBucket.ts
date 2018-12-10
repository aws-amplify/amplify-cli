import * as S3 from 'aws-sdk/clients/s3'
const awsS3Client = new S3({ region: 'us-west-2' })

const emptyBucket = async (bucket: string) => {
    let listObjects = await awsS3Client.listObjectsV2({
        Bucket: bucket
    }).promise()
    do {
        try {
            const objectIds = listObjects.Contents.map(content => ({
                Key: content.Key
            }))
            console.log(`Deleting keys: \n${JSON.stringify(objectIds, null, 4)}`)
            await awsS3Client.deleteObjects({
                Bucket: bucket,
                Delete: {
                    Objects: objectIds
                }
            })
        } catch (e) {
            console.error(`Error deleting objects: ${e}`)
        }
        listObjects = await awsS3Client.listObjectsV2({
            Bucket: bucket,
            ContinuationToken: listObjects.NextContinuationToken
        }).promise()
    } while (listObjects.NextContinuationToken);
    try {
        await awsS3Client.deleteBucket({
            Bucket: bucket,
        }).promise()
    } catch (e) {
        console.error(`Error deleting bucket: ${e}`)
    }
}
export default emptyBucket