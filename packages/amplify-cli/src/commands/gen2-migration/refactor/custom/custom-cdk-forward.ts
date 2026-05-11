import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource } from '../../_common/cfn-template';
import { ForwardCategoryRefactorer } from '../workflow/forward-category-refactorer';
import { prompter } from '@aws-amplify/amplify-prompts';
import { extractStackNameFromId } from '../../_common/utils';

const CHOICE_SEPERATOR = ' ';

/**
 * Forward refactorer for custom CDK resources.
 * Moves custom CDK resources from Gen1 to Gen2.
 */
export class CustomCDKForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen1Env, `custom${this.resource.resourceName}`);
  }

  protected async fetchDestStackId(): Promise<string | undefined> {
    return this.findNestedStack(this.gen2Branch, `custom${this.resource.resourceName}`);
  }

  protected resourceTypes(): string[] {
    // custom resources may contain all possible types of stateful resources.
    return this.gen1App.statefulResourceTypes;
  }

  protected async gen2LogicalId(sourceId: string, sourceResource: CFNResource, targetResources: Map<string, CFNResource>): Promise<string> {
    const candidates = Array.from(targetResources.keys()).filter((r) => targetResources.get(r)!.Type === sourceResource.Type);
    if (candidates.length === 0) {
      throw new AmplifyError('MigrationError', {
        message: `Unable to map Gen1 resource ${sourceId} (${sourceResource.Type}) to Gen2 resource`,
      });
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    // if we got here then this.fetchDestStackId() already returned a stack id once before.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const gen2StackId = (await this.fetchDestStackId())!;
    const gen2Resources = await this.gen2Branch.fetchStackResources(gen2StackId);

    function gen2PhysicalResourceId(logicalId: string) {
      const physicalId = gen2Resources.find((r) => r.LogicalResourceId === logicalId)?.PhysicalResourceId;
      if (!physicalId) {
        throw new AmplifyError('MigrationError', {
          message: `Unable to find physical ID of resource ${logicalId} in stack ${extractStackNameFromId(gen2StackId)}`,
        });
      }
      return physicalId;
    }

    // multiple candidates found - prompt the user. note that we only do this
    // for custom resources since we have no way of knowing which resource should
    // map to which.
    const choices = candidates.map((c) => `${c}${CHOICE_SEPERATOR}(${gen2PhysicalResourceId(c)})`);

    this.logger.pause();
    const selection = await prompter.pick<'one', string>(
      `(${this.resource.category}/${this.resource.resourceName}) Multiple refactor candidates detected. Choose which Gen2 resource corresponds to Gen1 resource '${sourceId}' (${sourceResource.Type})`,
      choices,
    );
    this.logger.resume();
    return selection.split(CHOICE_SEPERATOR)[0];
  }
}
