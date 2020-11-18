import { Machine, assign, EventObject } from 'xstate';
import { send } from 'xstate/lib/actions';
import { extractStackInfoFromContext, hasMoreDeployment, hasMoreRollback, stackPollerActivity } from './helpers';

export type DeploymentStep = {
  stackTemplatePath: string;
  parameters: Record<string, string>;
  tableNames: string[];
  stackName: string;
};

export type StackParameter = DeploymentStep & {
  stackTemplateUrl: string;
  region: string;
};
export type DeployMachineContext = {
  deploymentBucket: string;
  region: string;
  stacks: DeploymentStep[];
  currentIndex: number;
};

type DeploymentMachineEvents = 'IDLE' | 'DEPLOY' | 'ROLLBACK' | 'INDEX' | 'DONE' | 'NEXT';

interface DeployMachineSchema {
  states: {
    idle: {};
    deploy: {
      states: {
        triggerDeploy: {};
        deploying: {};
        waitingForDeployment: {};
        waitForTablesToBeReady: {};
      };
    };
    rollback: {
      states: {
        triggerRollback: {};
        rollingBack: {};
        waitingForRollback: {};
        waitForTablesToBeReady: {};
      };
    };
    deployed: {};
    rolledBack: {};
    failed: {};
  };
}

interface DeployMachineEvent extends EventObject {
  type: DeploymentMachineEvents;
}

export type StateMachineHelperFunctions = {
  deploymentWaitFn: (stack: Readonly<StackParameter>) => Promise<void>;
  deployFn: (stack: Readonly<StackParameter>) => Promise<void>;
  rollbackFn: (stack: Readonly<StackParameter>) => Promise<void>;
  rollbackWaitFn: (stack: Readonly<StackParameter>) => Promise<void>;
  tableReadyWaitFn: (stack: Readonly<StackParameter>) => Promise<void>;
  stackEventPollFn: (stack: Readonly<StackParameter>) => () => void;
};
export function createDeploymentMachine(initialContext: DeployMachineContext, helperFns: StateMachineHelperFunctions) {
  const machine = Machine<DeployMachineContext, DeployMachineSchema, DeployMachineEvent>(
    {
      id: 'DeployManager',
      initial: 'idle',
      context: initialContext,
      states: {
        idle: {
          on: {
            DEPLOY: {
              target: 'deploy',
              actions: send('NEXT'),
            },
          },
        },
        deploy: {
          id: 'deploy',
          initial: 'triggerDeploy',
          states: {
            triggerDeploy: {
              entry: assign(context => {
                return {
                  ...context,
                  currentIndex: context.currentIndex + 1,
                };
              }),
              on: {
                NEXT: [{ target: 'deploying', cond: 'hasMoreDeployment' }, { target: '#deployed' }],
              },
            },
            deploying: {
              invoke: {
                id: 'deploy-stack',
                src: extractStackInfoFromContext(helperFns.deployFn),
                onDone: {
                  target: 'waitingForDeployment',
                },
                onError: {
                  target: '#rollback',
                },
              },
            },
            waitingForDeployment: {
              invoke: {
                id: 'wait-for-deploy-stack',
                src: extractStackInfoFromContext(helperFns.deploymentWaitFn),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#rollback',
                },
              },
              activities: ['poll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: extractStackInfoFromContext(helperFns.tableReadyWaitFn),
                onDone: {
                  target: 'triggerDeploy',
                  actions: send('NEXT'),
                },
              },
            },
          },
        },
        rollback: {
          id: 'rollback',
          initial: 'waitForTablesToBeReady',
          states: {
            triggerRollback: {
              entry: assign((context: DeployMachineContext) => {
                return {
                  ...context,
                  currentIndex: context.currentIndex - 1,
                };
              }),
              on: {
                NEXT: [{ target: 'rollingBack', cond: 'hasMoreRollback' }, { target: '#rolledBack' }],
              },
            },
            rollingBack: {
              invoke: {
                id: 'rollback-stack',
                src: extractStackInfoFromContext(helperFns.rollbackFn),
                onDone: {
                  target: 'waitingForRollback',
                },
                onError: {
                  target: '#failed',
                },
              },
            },
            waitingForRollback: {
              invoke: {
                id: 'wait-for-deployment',
                src: extractStackInfoFromContext(helperFns.rollbackWaitFn),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#failed',
                },
              },
              activities: ['poll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: extractStackInfoFromContext(helperFns.tableReadyWaitFn),
                onDone: {
                  target: 'triggerRollback',
                  actions: send('NEXT'),
                },
              },
            },
          },
        },
        deployed: {
          id: 'deployed',
          type: 'final',
        },
        rolledBack: {
          id: 'rolledBack',
        },
        failed: {
          id: 'failed',
          type: 'final',
        },
      },
    },
    {
      guards: {
        hasMoreDeployment,
        hasMoreRollback,
      },
      activities: {
        poll: stackPollerActivity(helperFns.stackEventPollFn),
      },
    },
  );
  return machine;
}
