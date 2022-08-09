import { AuthTest } from './auth';

const MOCK_SUPPORTED_CATEGORY = ['Cognito'];

/**
 * Start Cognito Mock
 */
export const start = async (context):Promise<void> => {
  console.log('Starting Cognito Mock');
  const resources = await context.amplify.getResourceStatus();
  const mockableResources = resources.allResources.filter(
    resource => resource.service && MOCK_SUPPORTED_CATEGORY.includes(resource.service),
  );
  //  const resourceToBePushed = [...resources.resourcesToBeCreated].filter(
  //    resource => resource.service && RESOURCE_NEEDS_PUSH.includes(resource.service),
  //  );

  if (mockableResources.length) {
    /*    if (resourceToBePushed.length) {
      context.print.info(
        'Auth Mocking needs Auth resources to be pushed to the cloud. Please run `amplify auth push` before running storage mock',
      );
      return Promise.resolve(false);
    }*/
    const mockAuth = new AuthTest();
    try {
      await mockAuth.start(context);
    } catch (e) {
      console.log(e);
      // Sending term signal so we clean up after our-self
      process.kill(process.pid, 'SIGTERM');
    }
  }
};
