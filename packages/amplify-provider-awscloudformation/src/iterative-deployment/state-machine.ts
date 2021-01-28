import { EventObject, Machine, State, assign } from 'xstate';
import {
  getDeploymentActivityPollerHandler,
  getDeploymentOperationHandler,
  getRollbackActivityPollerHandler,
  getRollbackOperationHandler,
  isDeploymentComplete,
  isRollbackComplete,
  collectError,
} from './helpers';
import { send } from 'xstate/lib/actions';

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
  errors?: StateMachineError[];
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

export type StateMachineError = {
  error: Error;
  stateValue: number;
  currentIndex: number;
}
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
                NEXT: [{ target: '#deployed', cond: 'isDeploymentComplete' }, { target: 'deploying' }],
              },
            },
            deploying: {
              invoke: {
                id: 'deploy-stack',
                src: getDeploymentOperationHandler(helperFns.deployFn),
                onDone: {
                  target: 'waitingForDeployment',
                },
                onError: {
                  target: '#rollback',
                  actions: assign(collectError),
                },
              },
            },
            waitingForDeployment: {
              invoke: {
                id: 'wait-for-deploy-stack',
                src: getDeploymentOperationHandler(helperFns.deploymentWaitFn),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#rollback',
                  actions: assign(collectError),
                },
              },
              activities: ['deployPoll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: getDeploymentOperationHandler(helperFns.tableReadyWaitFn),
                onDone: {
                  target: 'triggerDeploy',
                  actions: send('NEXT'),
                },
                onError: {
                  actions: assign(collectError),
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
                NEXT: [{ target: '#rolledBack', cond: 'isRollbackComplete' }, { target: 'rollingBack' }],
              },
            },
            rollingBack: {
              invoke: {
                id: 'rollback-stack',
                src: getRollbackOperationHandler(helperFns.rollbackFn),
                onDone: {
                  target: 'waitingForRollback',
                },
                onError: {
                  target: '#failed',
                  actions: assign(collectError),
                },
              },
            },
            waitingForRollback: {
              invoke: {
                id: 'wait-for-deployment',
                src: getRollbackOperationHandler(helperFns.rollbackWaitFn),
                onDone: {
                  target: 'waitForTablesToBeReady',
                },
                onError: {
                  target: '#failed',
                  actions: assign(collectError),
                },
              },
              activities: ['rollbackPoll'],
            },
            waitForTablesToBeReady: {
              invoke: {
                id: 'wait-for-table-to-be-ready',
                src: getRollbackOperationHandler(helperFns.tableReadyWaitFn),
                onDone: {
                  target: 'triggerRollback',
                  actions: send('NEXT'),
                },
                onError: {
                  actions: assign(collectError),
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
          type: 'final',
        },
        failed: {
          id: 'failed',
          type: 'final',
        },
      },
    },
    {
      guards: {
        isDeploymentComplete,
        isRollbackComplete,
      },
      activities: {
        deployPoll: getDeploymentActivityPollerHandler(helperFns.stackEventPollFn),
        rollbackPoll: getRollbackActivityPollerHandler(helperFns.stackEventPollFn),
      },
    },
  );
  return machine;
}
