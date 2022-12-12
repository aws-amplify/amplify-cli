import {
  addNotificationChannel,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
} from "@aws-amplify/amplify-e2e-core";
import { initJSProjectWithProfile, versionCheck } from "../../../migration-helpers";
import { addLegacySmsNotificationChannel } from "../../../migration-helpers/notifications-helpers";
import { getShortId } from "../../../migration-helpers/utils";

describe("amplify add notifications", () => {
  let projectRoot: string;
  const migrateFromVersion = { v: "10.0.0" };
  const migrateToVersion = { v: "uninitialized" };

  beforeEach(async () => {
    projectRoot = await createNewProjectDir("notification-migration-2");
  });

  afterEach(async () => {
    await deleteProject(projectRoot, undefined, true);
    deleteProjectDir(projectRoot);
  });

  beforeAll(async () => {
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
  });

  it("should add in app notifications if another notification channel added with an older version", async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    const settings = { resourceName: `notification${getShortId()}` };

    await initJSProjectWithProfile(projectRoot, {}, false);
    await addLegacySmsNotificationChannel(projectRoot, settings.resourceName);
    await addNotificationChannel(projectRoot, settings, "In-App Messaging", true, true, true);
    await amplifyPushAuth(projectRoot, true);
  });

  it("should add in app notifications if another notification channel added and pushed with an older version", async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    const settings = { resourceName: `notification${getShortId()}` };

    await initJSProjectWithProfile(projectRoot, {}, false);
    await addLegacySmsNotificationChannel(projectRoot, settings.resourceName);
    await amplifyPushAuth(projectRoot, false);
    await addNotificationChannel(projectRoot, settings, "In-App Messaging", true, true, true);
    await amplifyPushAuth(projectRoot, true);
  });
});
