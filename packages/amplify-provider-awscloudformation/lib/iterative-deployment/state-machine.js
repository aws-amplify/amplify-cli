"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRollbackDeploymentMachine = exports.createDeploymentMachine = void 0;
const xstate_1 = require("xstate");
const helpers_1 = require("./helpers");
const actions_1 = require("xstate/lib/actions");
function createDeploymentMachine(initialContext, helperFns) {
    const machine = (0, xstate_1.Machine)({
        id: 'DeployManager',
        initial: 'idle',
        context: initialContext,
        states: {
            idle: {
                on: {
                    DEPLOY: {
                        target: 'deploy',
                        actions: (0, actions_1.send)('NEXT'),
                    },
                },
            },
            deploy: {
                id: 'deploy',
                initial: 'triggerDeploy',
                states: {
                    triggerDeploy: {
                        entry: (0, xstate_1.assign)((context) => {
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
                            src: (0, helpers_1.getDeploymentOperationHandler)(helperFns.deployFn),
                            onDone: {
                                target: 'waitingForDeployment',
                            },
                            onError: {
                                target: '#rollback',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                    waitingForDeployment: {
                        invoke: {
                            id: 'wait-for-deploy-stack',
                            src: (0, helpers_1.getDeploymentOperationHandler)(helperFns.deploymentWaitFn),
                            onDone: {
                                target: 'waitForTablesToBeReady',
                            },
                            onError: {
                                target: '#rollback',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                        activities: ['deployPoll'],
                    },
                    waitForTablesToBeReady: {
                        invoke: {
                            id: 'wait-for-table-to-be-ready',
                            src: (0, helpers_1.getDeploymentOperationHandler)(helperFns.tableReadyWaitFn),
                            onDone: {
                                target: 'triggerDeploy',
                                actions: (0, actions_1.send)('NEXT'),
                            },
                            onError: {
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
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
                        entry: (0, xstate_1.assign)((context) => {
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
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.rollbackFn),
                            onDone: {
                                target: 'waitingForRollback',
                            },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                    waitingForRollback: {
                        invoke: {
                            id: 'wait-for-deployment',
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.rollbackWaitFn),
                            onDone: {
                                target: 'waitForTablesToBeReady',
                            },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                        activities: ['rollbackPoll'],
                    },
                    waitForTablesToBeReady: {
                        invoke: {
                            id: 'wait-for-table-to-be-ready',
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.tableReadyWaitFn),
                            onDone: {
                                target: 'triggerRollback',
                                actions: (0, actions_1.send)('NEXT'),
                            },
                            onError: {
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
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
    }, {
        guards: {
            isDeploymentComplete: helpers_1.isDeploymentComplete,
            isRollbackComplete: helpers_1.isRollbackComplete,
        },
        activities: {
            deployPoll: (0, helpers_1.getDeploymentActivityPollerHandler)(helperFns.stackEventPollFn),
            rollbackPoll: (0, helpers_1.getRollbackActivityPollerHandler)(helperFns.stackEventPollFn),
        },
    });
    return machine;
}
exports.createDeploymentMachine = createDeploymentMachine;
function createRollbackDeploymentMachine(initialContext, helperFns) {
    const machine = (0, xstate_1.Machine)({
        id: 'DeployManager',
        initial: 'idle',
        context: initialContext,
        states: {
            idle: {
                on: {
                    ROLLBACK: {
                        target: 'preRollback',
                    },
                },
            },
            preRollback: {
                id: 'pre-rollback',
                initial: 'previousDeploymentReadyCheck',
                states: {
                    previousDeploymentReadyCheck: {
                        id: 'previous-deployment-ready-check',
                        invoke: {
                            src: (0, helpers_1.getPreRollbackOperationHandler)(helperFns.rollbackWaitFn),
                            onDone: { target: 'previousTableReadyCheck' },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                    previousTableReadyCheck: {
                        id: 'previous-table-ready-check',
                        invoke: {
                            src: (0, helpers_1.getPreRollbackOperationHandler)(helperFns.preRollbackTableCheck),
                            onDone: { target: '#rollback' },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                },
            },
            rollback: {
                id: 'rollback',
                initial: 'enterRollback',
                states: {
                    enterRollback: {
                        invoke: {
                            id: 'enter-rollback',
                            src: helperFns.startRollbackFn,
                            onDone: {
                                target: 'triggerRollback',
                                actions: (0, actions_1.send)('NEXT'),
                            },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                    triggerRollback: {
                        entry: (0, xstate_1.assign)((context) => {
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
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.rollbackFn),
                            onDone: { target: 'waitingForRollback' },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                    },
                    waitingForRollback: {
                        invoke: {
                            id: 'wait-for-deployment',
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.rollbackWaitFn),
                            onDone: { target: 'waitForTablesToBeReady' },
                            onError: {
                                target: '#failed',
                                actions: (0, xstate_1.assign)(helpers_1.collectError),
                            },
                        },
                        activities: ['rollbackPoll'],
                    },
                    waitForTablesToBeReady: {
                        invoke: {
                            id: 'wait-for-table-to-be-ready',
                            src: (0, helpers_1.getRollbackOperationHandler)(helperFns.tableReadyWaitFn),
                            onDone: {
                                target: 'triggerRollback',
                                actions: (0, actions_1.send)('NEXT'),
                            },
                            onError: { actions: (0, xstate_1.assign)(helpers_1.collectError) },
                        },
                    },
                },
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
    }, {
        guards: { isRollbackComplete: helpers_1.isRollbackComplete },
        activities: { rollbackPoll: (0, helpers_1.getRollbackActivityPollerHandler)(helperFns.stackEventPollFn) },
    });
    return machine;
}
exports.createRollbackDeploymentMachine = createRollbackDeploymentMachine;
//# sourceMappingURL=state-machine.js.map