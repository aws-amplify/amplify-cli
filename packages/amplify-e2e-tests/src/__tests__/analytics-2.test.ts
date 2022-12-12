import {
  addFunction,
  addPinpoint,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from "@aws-amplify/amplify-e2e-core";

describe("amplify add analytics", () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir("analytics");
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it("add analytics and function", async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = "pinpointTestApp";
    await addPinpoint(projRoot, { rightName, wrongName: "$" });
    await addFunction(
      projRoot,
      {
        functionTemplate: "Hello World",
        additionalPermissions: {
          permissions: ["analytics"],
          resources: [rightName],
          choices: ["auth", "analytics"],
          operations: ["create", "read"],
        },
      },
      "nodejs"
    );
    await amplifyPushUpdate(projRoot);
  });
});
