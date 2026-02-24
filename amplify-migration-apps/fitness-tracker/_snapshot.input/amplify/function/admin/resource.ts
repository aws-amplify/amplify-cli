import { defineFunction } from "@aws-amplify/backend";

const branchName = process.env.AWS_BRANCH ?? "sandbox";

export const admin = defineFunction({
    entry: "./index.js",
    name: `admin-${branchName}`,
    timeoutSeconds: 25,
    memoryMB: 128,
    environment: { ENV: `${branchName}`, REGION: "us-east-1" },
    runtime: 22,
    resourceGroupName: 'auth',
});
