import {
  addApi,
  addFunction,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendConfig,
  initJSProjectWithProfile,
  getProjectMeta,
  getFunction
} from "@aws-amplify/amplify-e2e-core";
import { v4 as uuid } from "uuid";
import path from "path";
import { existsSync } from "fs";

describe("Lambda AppSync nodejs", () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir("lambda-appsync-nodejs");
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, "amplify", "#current-cloud-backend", "amplify-meta.json");
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it.only("add nodejs appsync function", async () => {
    await initJSProjectWithProfile(projRoot, {});

    // await addApi(projRoot, {
    //   "API key": {},
    //   transformerVersion: 2
    // });
    // await amplifyPush(projRoot);

    // expect(getBackendConfig(projRoot)).toBeDefined();

    // var beforeMeta = getBackendConfig(projRoot);
    // console.log(beforeMeta);
    // const apiName = Object.keys(beforeMeta.api)[0];
    // console.log(apiName);

    // expect(apiName + " abc").toContain("lambdaappsyncnodejs4");

    const [shortId] = uuid().split("-");
    const funcName = `lambdaappsync${shortId}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: "AppSync Todo"
        // additionalPermissions: {
        //   permissions: ["api"],
        //   choices: ["api"],
        //   resources: ["api"],
        //   operations: ["Query"],
        //   actions: ["API_KEY"]
        // }
      },
      "nodejs"
    );

    const beforeMeta = getBackendConfig(projRoot);
    console.log(beforeMeta);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key]
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeUndefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});
