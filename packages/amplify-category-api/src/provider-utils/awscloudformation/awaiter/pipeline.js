const AWS = require('aws-sdk');

const stageName = 'Source';
const actionName = 'Source';

const codePipeline = new AWS.CodePipeline();
const cloudFormation = new AWS.CloudFormation();

exports.handler = async function ({ RequestType, ResourceProperties, StackId }) {
    console.log({ RequestType: RequestType, ResourceProperties });

    switch (RequestType) {
        case 'Delete':
            return { IsComplete: true };
        case 'Update':
            const [, StackName] = StackId.split('/');
            const { Stacks } = await cloudFormation.describeStacks({ StackName }).promise();
            const [{ StackStatus }] = Stacks;

            if (StackStatus.includes('ROLLBACK')) {
                return { IsComplete: true };
            }
    }

    const {
        PIPELINE_NAME: pipelineName,
        ARTIFACT_BUCKET_NAME: artifactBucketName,
        ARTIFACT_KEY: artifactKey,
    } = process.env;

    let stages;

    try {
        const { pipeline } = await codePipeline.getPipeline({ name: pipelineName }).promise();

        ({ stages } = pipeline);
    } catch (error) {
        const { code } = error;

        switch (code) {
            case 'PipelineNotFoundException':
                console.warn(error);

                return {
                    IsComplete: false
                };
            default:
                throw error;
        }
    }

    const stage = stages.find(({ name }) => name === stageName);

    if (stage === undefined) {
        throw new Error(`There is no stage named "${stageName}" in the "${pipelineName}" pipeline`);
    }

    const action = stage.actions.find(({ name }) => name === actionName);

    if (action === undefined) {
        throw new Error(`There is no action named "${actionName}" in the "${stageName}" stage of the "${pipelineName}" pipeline`);
    }

    const { configuration, configuration: { S3Bucket, S3ObjectKey } } = action;

    if (S3Bucket !== artifactBucketName || S3ObjectKey !== artifactKey) {
        console.warn(`Bucket "${artifactBucketName}" and key "${artifactKey}" dont match the "${actionName}" action configuration ${JSON.stringify(configuration)}`);

        return {
            IsComplete: false
        }
    }

    let execution;

    try {
        const { pipelineExecutionSummaries } = await codePipeline.listPipelineExecutions({ pipelineName }).promise();

        [execution] = pipelineExecutionSummaries;
    } catch (error) {
        console.warn(error);

        return {
            IsComplete: false,
        };
    }

    console.log(execution);

    const { status } = execution || {};

    if (undefined === status) {
        return { IsComplete: true };
    }

    let IsComplete = false;

    switch (status) {
        case 'Failed':
        case 'Stopped':
            throw new Error("The execution didn't succeed");
        case 'Succeeded':
            IsComplete = true;
    }

    return { IsComplete };
};
