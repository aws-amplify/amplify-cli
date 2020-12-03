import { Machine, assign, EventObject, State } from 'xstate';
import { send } from 'xstate/lib/actions';
import { extractStackInfoFromContext, hasMoreDeployment, hasMoreRollback, stackPollerActivity } from './helpers';

export type DeploymentMachineOp = {
  stackTemplatePath: string;
  parameters: Record<string, string>;
  tableNames: string[];
  stackName: string;
  capabilities?: string[];
  stackTemplateUrl: string;
  region: string;
  clientRequestToken?: string;
};

export type DeploymentMachineStep = {
  deployment: DeploymentMachineOp;
  rollback: DeploymentMachineOp;
};

export type DeployMachineContext = {
  deploymentBucket: string;
  region: string;
  stacks: DeploymentMachineStep[];
  currentIndex: number;
};

export type DeploymentMachineEvents = 'IDLE' | 'DEPLOY' | 'ROLLBACK' | 'INDEX' | 'DONE' | 'NEXT';

export type DeploymentMachineState = State<
  DeployMachineContext,
  { type: DeploymentMachineEvents },
  DeployMachineSchema,
  {
    value: any;
    context: DeployMachineContext;
  }
>;
export interface DeployMachineSchema {
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
  deploymentWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
  deployFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
  rollbackFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
  rollbackWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
  tableReadyWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
  stackEventPollFn: (stack: Readonly<DeploymentMachineOp>) => () => void;
  startRollbackFn: (context: Readonly<DeployMachineContext>) => Promise<void>;
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
                src: extractStackInfoFromContext(helperFns.deployFn, 'deploying'),
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
                src: extractStackInfoFromContext(helperFns.deploymentWaitFn, 'deploying'),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#rollback',
                },
              },
              activities: ['deployPoll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: extractStackInfoFromContext(helperFns.tableReadyWaitFn, 'deploying'),
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
          invoke: {
            id: 'enter-rollback',
            src: helperFns.startRollbackFn,
          },
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
                src: extractStackInfoFromContext(helperFns.rollbackFn, 'rollingback'),
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
                src: extractStackInfoFromContext(helperFns.rollbackWaitFn, 'rollingback'),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#failed',
                },
              },
              activities: ['rollbackPoll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: extractStackInfoFromContext(helperFns.tableReadyWaitFn, 'rollingback'),
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
        deployPoll: stackPollerActivity(helperFns.stackEventPollFn, 'deploying'),
        rollbackPoll: stackPollerActivity(helperFns.stackEventPollFn, 'rollingback'),
      },
    },
  );
  return machine;
}
