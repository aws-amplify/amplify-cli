import { StackFacade } from '../stack-facade';

export const GEN2_NATIVE_APP_CLIENT = 'UserPoolNativeAppClient';

const GEN1_AUTH_STACK_TYPE_DESCRIPTION = 'auth-Cognito';
const GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION = 'auth-Cognito-UserPool-Groups';

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
  const description = await gen1Env.fetchStackDescription(stackId);
  const stackDescription = description.Description;
  if (!stackDescription) return null;

  try {
    const parsed = JSON.parse(stackDescription);
    if (typeof parsed === 'object' && 'stackType' in parsed) {
      if (parsed.stackType === GEN1_AUTH_STACK_TYPE_DESCRIPTION) return 'auth';
      if (parsed.stackType === GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION) return 'auth-user-pool-group';
    }
  } catch {
    // Description might not be valid JSON
  }
  return null;
}
