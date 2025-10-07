import { AmplifyMigrationCloneStep } from './gen2-migration/clone';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
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

  const implementation: AmplifyMigrationStep = new step.class(context);

  try {
    printer.info('Validating');
    await implementation.validate();
    printer.info('Executing');
    await implementation.execute();
  } catch (error: unknown) {
    printer.warn(`${error}. Rolling back.`);
    await implementation.rollback();
    throw error;
  }
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
