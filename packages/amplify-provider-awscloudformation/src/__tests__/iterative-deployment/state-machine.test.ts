import {
  createDeploymentMachine,
  createRollbackDeploymentMachine,
  DeployMachineContext,
  DeploymentMachineOp,
  StateMachineHelperFunctions,
  StateMachineRollbackHelperFunctions,
} from '../../iterative-deployment/state-machine';
import { interpret } from 'xstate';

describe('deployment state machine', () => {
  const fns: StateMachineHelperFunctions = {
    deployFn: jest.fn().mockResolvedValue(undefined),
    deploymentWaitFn: jest.fn().mockResolvedValue(undefined),
    rollbackFn: jest.fn().mockResolvedValue(undefined),
    rollbackWaitFn: jest.fn().mockResolvedValue(undefined),
    tableReadyWaitFn: jest.fn().mockResolvedValue(undefined),
    startRollbackFn: jest.fn().mockResolvedValue(undefined),
    stackEventPollFn: jest.fn().mockImplementation(() => {
      return () => {};
    }),
  };

  const baseDeploymentStep: Omit<DeploymentMachineOp, 'stackTemplateUrl'> = {
    parameters: {},
    stackName: 'amplify-multideploytest-dev-162313-apimultideploytest-1E3B7HVOV09VD',
    stackTemplatePath: 'stack1/cfn.json',
    tableNames: ['table1'],
    region: 'us-east-2',
    capabilities: [],
  };
  const initialContext: DeployMachineContext = {
    currentIndex: -1,
    region: 'us-east-2',
    deploymentBucket: 'https://s3.amazonaws.com/amplify-multideploytest-dev-162313-deployment',
    stacks: [
      {
        deployment: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'step1.json',
          tableNames: ['table1'],
        },
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback1.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1'],
        },
      },
      {
        deployment: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'step2.json',
          tableNames: ['table1', 'table2'],
        },
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback2.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1', 'table2'],
        },
      },
      {
        deployment: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'step3.json',
          tableNames: ['table1', 'table3'],
        },
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback3.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1', 'table3'],
        },
      },
    ],
  };
  beforeEach(() => {
    jest.resetAllMocks();
    (fns.deployFn as jest.Mock).mockResolvedValue(undefined);
    (fns.deploymentWaitFn as jest.Mock).mockResolvedValue(undefined);
    (fns.rollbackFn as jest.Mock).mockResolvedValue(undefined);
    (fns.rollbackWaitFn as jest.Mock).mockResolvedValue(undefined);
    (fns.startRollbackFn as jest.Mock).mockResolvedValue(undefined);
    (fns.tableReadyWaitFn as jest.Mock).mockResolvedValue(undefined);
  });

  it('should call deployment function multiple times when there are multiple stacks to be deployed', (done) => {
    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition((state) => {
        if (state.value === 'deployed') {
          expect(fns.deployFn).toHaveBeenCalledTimes(3);
          expect(fns.deploymentWaitFn).toHaveBeenCalledTimes(3);
          expect(fns.tableReadyWaitFn).toHaveBeenCalledTimes(3);

          // 1st stack
          const firstStackArg = initialContext.stacks[0].deployment;

          expect((fns.deployFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);

          // second stack
          const secondStackArg = initialContext.stacks[1].deployment;

          expect((fns.deployFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);

          // third stack
          const thirdStackArg = initialContext.stacks[2].deployment;

          expect((fns.deployFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);

          done();
        }
      })
      .start()
      .send('DEPLOY');
  });

  it('should rollback when one of the deployment fails in reverse order of deployment', (done) => {
    //  mock deployment fn to fail for second deployment
    (fns.deployFn as jest.Mock).mockImplementation((stack) => {
      if (stack.stackTemplateUrl === initialContext.stacks[2].deployment.stackTemplateUrl) {
        return Promise.reject();
      }
      return Promise.resolve();
    });

    const firstStackDeploymentArg = initialContext.stacks[0].deployment;
    const secondStackDeploymentArg = initialContext.stacks[1].deployment;
    const thirdStackDeploymentArg = initialContext.stacks[2].deployment;

    const firstStackRollbackArg = initialContext.stacks[0].rollback;
    const secoondStackRollbackArg = initialContext.stacks[1].rollback;
    const thirdStackRollbackArg = initialContext.stacks[2].rollback;

    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition((state) => {
        if (state.value === 'rolledBack') {
          const rollbackMock = fns.rollbackFn as jest.Mock;
          const deployMock = fns.deployFn as jest.Mock;
          const deployWaitMock = fns.deploymentWaitFn as jest.Mock;
          const tableReadWaitMock = fns.tableReadyWaitFn as jest.Mock;

          expect(deployMock).toHaveBeenCalledTimes(3);
          expect(deployWaitMock).toHaveBeenCalledTimes(2);
          expect(tableReadWaitMock).toHaveBeenCalledTimes(5); // 2 times for deploy and 2 times for rollback and 1 time for before starting rollback

          // First stack deployed
          expect(deployMock.mock.calls[0][0]).toEqual(firstStackDeploymentArg);
          expect(deployWaitMock.mock.calls[0][0]).toEqual(firstStackDeploymentArg);
          expect(tableReadWaitMock.mock.calls[0][0]).toEqual(firstStackDeploymentArg);

          // second stack deployment
          expect(deployMock.mock.calls[1][0]).toEqual(secondStackDeploymentArg);
          expect(deployWaitMock.mock.calls[1][0]).toEqual(secondStackDeploymentArg);
          expect(tableReadWaitMock.mock.calls[1][0]).toEqual(secondStackDeploymentArg);

          // third stack deployment fails
          expect(deployMock.mock.calls[2][0]).toEqual(thirdStackDeploymentArg);
          // rollback kicks and waits for the table to be ready
          expect(tableReadWaitMock.mock.calls[2][0]).toEqual(thirdStackRollbackArg);

          expect(rollbackMock).toHaveBeenCalledTimes(2);

          // rollback of second stack as the third stack is automatically rolled back by CFN
          expect(rollbackMock.mock.calls[0][0]).toEqual(secoondStackRollbackArg);
          expect(tableReadWaitMock.mock.calls[3]).toContainEqual(secoondStackRollbackArg);

          // rollback of first stack after second one is complete
          expect(rollbackMock.mock.calls[1][0]).toEqual(firstStackRollbackArg);
          expect(tableReadWaitMock.mock.calls[4]).toContainEqual(firstStackRollbackArg);

          // Notify rollback
          expect(fns.startRollbackFn).toHaveBeenCalledTimes(1);

          done();
        }
      })
      .start()
      .send('DEPLOY');
  });

  it('should go to failed state when rollback fails', (done) => {
    const deployFn = fns.deployFn as jest.Mock;
    deployFn.mockImplementation((stack) => {
      if (stack.stackTemplateUrl === initialContext.stacks[2].deployment.stackTemplateUrl) {
        return Promise.reject();
      }
      return Promise.resolve();
    });
    const rollBackFn = fns.rollbackFn as jest.Mock;
    rollBackFn.mockRejectedValue(undefined);

    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition((state) => {
        if (state.value === 'failed') {
          expect(deployFn).toHaveBeenCalledTimes(3);
          expect(rollBackFn).toHaveBeenCalledTimes(1);
          done();
        }
      })
      .start()
      .send('DEPLOY');
  });
});

describe('rollback state machine', () => {
  const fns: StateMachineRollbackHelperFunctions = {
    preRollbackTableCheck: jest.fn().mockResolvedValue(undefined),
    rollbackFn: jest.fn().mockResolvedValue(undefined),
    rollbackWaitFn: jest.fn().mockResolvedValue(undefined),
    tableReadyWaitFn: jest.fn().mockResolvedValue(undefined),
    startRollbackFn: jest.fn().mockResolvedValue(undefined),
    stackEventPollFn: jest.fn().mockImplementation(() => {
      return () => {};
    }),
  };

  const baseDeploymentStep: Omit<DeploymentMachineOp, 'stackTemplateUrl'> = {
    parameters: {},
    stackName: 'amplify-multideploytest-dev-162313-apimultideploytest-1E3B7HVOV09VD',
    stackTemplatePath: 'stack1/cfn.json',
    tableNames: ['table1'],
    region: 'us-east-2',
    capabilities: [],
  };

  const initialContext: DeployMachineContext = {
    previousDeploymentIndex: 2,
    currentIndex: 3,
    region: 'us-east-2',
    deploymentBucket: 'https://s3.amazonaws.com/amplify-multideploytest-dev-162313-deployment',
    stacks: [
      {
        deployment: null,
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback1.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1'],
        },
      },
      {
        deployment: null,
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback2.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1', 'table2'],
        },
      },
      {
        deployment: null,
        rollback: {
          ...baseDeploymentStep,
          stackTemplateUrl: 'rollback3.json',
          parameters: { rollback: 'true' },
          tableNames: ['table1', 'table3'],
        },
      },
    ],
  };
  beforeEach(() => {
    jest.resetAllMocks();
    (fns.preRollbackTableCheck as jest.Mock).mockResolvedValue(undefined), (fns.rollbackFn as jest.Mock).mockResolvedValue(undefined);
    (fns.rollbackWaitFn as jest.Mock).mockResolvedValue(undefined);
    (fns.startRollbackFn as jest.Mock).mockResolvedValue(undefined);
    (fns.tableReadyWaitFn as jest.Mock).mockResolvedValue(undefined);
  });

  it('should call deployment function multiple times when there are multiple stacks to be deployed', (done) => {
    const machine = createRollbackDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition((state) => {
        if (state.value === 'rolledBack') {
          // pre deployment functions only called once
          expect(fns.preRollbackTableCheck).toHaveBeenCalledTimes(1);
          expect(fns.rollbackWaitFn).toHaveBeenCalledTimes(4);
          expect(fns.rollbackFn).toHaveBeenCalledTimes(3);

          const firstStackArg = initialContext.stacks[2].rollback;

          // Pre Stack Check
          expect((fns.rollbackWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          // 1st stack
          expect((fns.rollbackFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.rollbackWaitFn as jest.Mock).mock.calls[1][0]).toEqual(firstStackArg);
          // second stack

          const secondStackArg = initialContext.stacks[1].rollback;
          expect((fns.rollbackFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.rollbackWaitFn as jest.Mock).mock.calls[2][0]).toEqual(secondStackArg);

          // third stack
          const thirdStackArg = initialContext.stacks[0].rollback;

          expect((fns.rollbackFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.rollbackWaitFn as jest.Mock).mock.calls[3][0]).toEqual(thirdStackArg);

          done();
        }
      })
      .start()
      .send('ROLLBACK');
  });

  it('should go to failed state when rollback deployment fails', (done) => {
    const rollbackFn = fns.rollbackFn as jest.Mock;
    rollbackFn.mockImplementation((stack) => {
      if (stack.stackTemplateUrl === initialContext.stacks[1].rollback.stackTemplateUrl) {
        return Promise.reject();
      }
      return Promise.resolve();
    });

    const machine = createRollbackDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition((state) => {
        if (state.value === 'failed') {
          // pre deployment functions only called once
          expect(fns.preRollbackTableCheck).toHaveBeenCalledTimes(1);
          expect(fns.tableReadyWaitFn).toHaveBeenCalledTimes(1);
          expect(rollbackFn).toHaveBeenCalledTimes(2);
          done();
        }
      })
      .start()
      .send('ROLLBACK');
  });
});
