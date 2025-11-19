import { AmplifyMigrationCloneStep } from './gen2-migration/clone';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './gen2-migration/_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationCleanupStep } from './gen2-migration/cleanup';
import { AmplifyMigrationDecommissionStep } from './gen2-migration/decommission';
import { AmplifyMigrationGenerateStep } from './gen2-migration/generate';
import { AmplifyMigrationLockStep } from './gen2-migration/lock';
import { AmplifyMigrationRefactorStep } from './gen2-migration/refactor';
import { AmplifyMigrationShiftStep } from './gen2-migration/shift';

const STEPS = {
  cleanup: {
    class: AmplifyMigrationCleanupStep,
    description: 'TODO',
  },
  clone: {
    class: AmplifyMigrationCloneStep,
    description: 'TODO',
  },
  decommission: {
    class: AmplifyMigrationDecommissionStep,
    description: 'TODO',
  },
  generate: {
    class: AmplifyMigrationGenerateStep,
    description: 'TODO',
  },
  lock: {
    class: AmplifyMigrationLockStep,
    description: 'TODO',
  },
  refactor: {
    class: AmplifyMigrationRefactorStep,
    description: 'TODO',
  },
  shift: {
    class: AmplifyMigrationShiftStep,
    description: 'TODO',
  },
};

export const run = async (context: $TSContext) => {
  const step = STEPS[(context.input.subCommands ?? [])[0]];
  if (!step) {
    displayHelp(context);
    return;
  }

  shiftParams(context);

  const skipValidations = (context.input.options ?? {})['skip-validations'] ?? false;
  const validationsOnly = (context.input.options ?? {})['validations-only'] ?? false;
  const skipRollback = (context.input.options ?? {})['skip-rollback'] ?? false;

  if (skipValidations && validationsOnly) {
    throw new AmplifyError('InputValidationError', {
      message: 'Cannot specify both --skip-validations and --validation-only',
    });
  }

  const implementation: AmplifyMigrationStep = new step.class(context);

  if (!skipValidations) {
    printer.info('» validating');
    printer.blankLine();
    await implementation.validate();
  }

  if (!validationsOnly) {
    try {
      printer.info('» executing');
      printer.blankLine();
      await implementation.execute();
    } catch (error: unknown) {
      if (!skipRollback) {
        printer.error(`Execution failed: ${error}`);
        printer.blankLine();
        printer.info('» rolling back');
        printer.blankLine();
        await implementation.rollback();
      }
      throw error;
    }
  }

  printer.success('Done');
};

function shiftParams(context) {
  delete context.parameters.first;
  delete context.parameters.second;
  delete context.parameters.third;
  const { subCommands } = context.input;
  /* eslint-disable */
  if (subCommands && subCommands.length > 1) {
    if (subCommands.length > 1) {
      context.parameters.first = subCommands[1];
    }
    if (subCommands.length > 2) {
      context.parameters.second = subCommands[2];
    }
    if (subCommands.length > 3) {
      context.parameters.third = subCommands[3];
    }
  }
  /* eslint-enable */
}

function displayHelp(context: $TSContext) {
  context.amplify.showHelp(
    'amplify gen2-migration <subcommands>',
    Object.entries(STEPS).map(([name, v]) => ({ name, description: v.description })),
  );
  printer.info('');
}
