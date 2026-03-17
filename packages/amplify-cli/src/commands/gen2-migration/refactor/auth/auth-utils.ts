import { StackFacade } from '../stack-facade';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';

/**
 * Discovers Gen1 auth stacks by parsing stack Description JSON.
 * Gen1 may have a main auth stack and a separate UserPoolGroups stack.
 */
export async function discoverGen1AuthStacks(gen1Env: StackFacade): Promise<{ mainAuthStackId?: string; userPoolGroupStackId?: string }> {
  const nestedStacks = await gen1Env.fetchNestedStacks();
  const authStacks = nestedStacks.filter((s) => s.LogicalResourceId?.startsWith('auth'));

  let mainAuthStackId: string | undefined;
  let userPoolGroupStackId: string | undefined;

  for (const stack of authStacks) {
    if (!stack.PhysicalResourceId) continue;
    const authType = await classifyGen1AuthStack(gen1Env, stack.PhysicalResourceId);
    if (authType === 'auth') {
      mainAuthStackId = stack.PhysicalResourceId;
    } else if (authType === 'auth-user-pool-group') {
      userPoolGroupStackId = stack.PhysicalResourceId;
    }
  }

  return { mainAuthStackId, userPoolGroupStackId };
}

/**
 * Classifies a Gen1 auth stack by parsing its Description JSON metadata.
 */
async function classifyGen1AuthStack(gen1Env: StackFacade, stackId: string): Promise<'auth' | 'auth-user-pool-group' | null> {
  const resources = await gen1Env.fetchStackResources(stackId);
  const hasUserPool = resources.find((r) => r.ResourceType === 'AWS::Cognito::UserPool');
  return hasUserPool ? 'auth' : 'auth-user-pool-group';
}
