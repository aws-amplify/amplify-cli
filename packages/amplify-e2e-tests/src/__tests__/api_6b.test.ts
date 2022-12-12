import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyPush,
  deleteProject,
  deleteProjectDir,
  updateApiSchema,
  amplifyPushDestructiveApiUpdate,
  addFunction,
  amplifyPushAuth,
} from "@aws-amplify/amplify-e2e-core";

const projName = "apitest";
let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
  await initJSProjectWithProfile(projRoot, { name: projName });
  await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
  await amplifyPush(projRoot);
});
afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe("destructive updates flag", () => {
  it("blocks destructive updates when flag not present", async () => {
    updateApiSchema(projRoot, projName, "simple_model_new_primary_key.graphql");
    await amplifyPushDestructiveApiUpdate(projRoot, false);
    // success indicates that the command errored out
  });

  it("allows destructive updates when flag present", async () => {
    updateApiSchema(projRoot, projName, "simple_model_new_primary_key.graphql");
    await amplifyPushDestructiveApiUpdate(projRoot, true);
    // success indicates that the push completed
  });

  it("disconnects and reconnects functions dependent on replaced table", async () => {
    const functionName = "funcTableDep";
    await addFunction(
      projRoot,
      {
        name: functionName,
        functionTemplate: "Hello World",
        additionalPermissions: {
          permissions: ["storage"],
          choices: ["api", "storage"],
          resources: ["Todo:@model(appsync)"],
          operations: ["create", "read", "update", "delete"],
        },
      },
      "nodejs"
    );
    await amplifyPushAuth(projRoot);
    updateApiSchema(projRoot, projName, "simple_model_new_primary_key.graphql");
    await amplifyPushDestructiveApiUpdate(projRoot, false);
    // success indicates that the push completed
  });
});
