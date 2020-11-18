import { createDeploymentMachine, DeployMachineContext, StateMachineHelperFunctions } from '../../iterative-deployment/state-machine';
import { interpret } from 'xstate';
describe('deployment state machine', () => {
  const fns: StateMachineHelperFunctions = {
    deployFn: jest.fn().mockResolvedValue(undefined),
    deploymentWaitFn: jest.fn().mockResolvedValue(undefined),
    rollbackFn: jest.fn().mockResolvedValue(undefined),
    rollbackWaitFn: jest.fn().mockResolvedValue(undefined),
    tableReadyWaitFn: jest.fn().mockResolvedValue(undefined),
    stackEventPollFn: jest.fn().mockImplementation(() => {
      return () => {};
    }),
  };

  const initialContext: DeployMachineContext = {
    currentIndex: -1,
    region: 'us-east-2',
    deploymentBucket: 'https://s3.amazonaws.com/amplify-multideploytest-dev-162313-deployment',
    stacks: [
      {
        parameters: {},
        stackName: 'amplify-multideploytest-dev-162313-apimultideploytest-1E3B7HVOV09VD',
        stackTemplatePath: 'stack1/cfn.json',
        tableNames: ['table1'],
      },
      {
        parameters: {},
        stackName: 'amplify-multideploytest-dev-162313-apimultideploytest-1E3B7HVOV09VD',
        stackTemplatePath: 'stack2/cfn.json',
        tableNames: ['table1', 'table2'],
      },
      {
        parameters: {},
        stackName: 'amplify-multideploytest-dev-162313-apimultideploytest-1E3B7HVOV09VD',
        stackTemplatePath: 'stack3/cfn.json',
        tableNames: ['table1'],
      },
    ],
  };
  beforeEach(() => {
    jest.resetAllMocks();
    (fns.deployFn as jest.Mock).mockResolvedValue(undefined);
    (fns.deploymentWaitFn as jest.Mock).mockResolvedValue(undefined);
    (fns.rollbackFn as jest.Mock).mockResolvedValue(undefined);
    (fns.rollbackWaitFn as jest.Mock).mockResolvedValue(undefined);
    (fns.tableReadyWaitFn as jest.Mock).mockResolvedValue(undefined);
  });

  it('should call deployment function multiple times when there are multiple stacks to be deployed', done => {
    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition(state => {
        if (state.value === 'deployed') {
          expect(fns.deployFn).toHaveBeenCalledTimes(3);
          expect(fns.deploymentWaitFn).toHaveBeenCalledTimes(3);
          expect(fns.tableReadyWaitFn).toHaveBeenCalledTimes(3);

          // 1st stack
          const firstStackArg = {
            ...initialContext.stacks[0],
            region: initialContext.region,
            stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[0].stackTemplatePath}`,
          };
          expect((fns.deployFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[0][0]).toEqual(firstStackArg);

          // second stack
          const secondStackArg = {
            ...initialContext.stacks[1],
            region: initialContext.region,
            stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[1].stackTemplatePath}`,
          };

          expect((fns.deployFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[1][0]).toEqual(secondStackArg);

          // third stack
          const thirdStackArg = {
            ...initialContext.stacks[2],
            region: initialContext.region,
            stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[2].stackTemplatePath}`,
          };
          expect((fns.deployFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.deploymentWaitFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);
          expect((fns.tableReadyWaitFn as jest.Mock).mock.calls[2][0]).toEqual(thirdStackArg);

          done();
        }
      })
      .start()
      .send('DEPLOY');
  });

  it('should rollback when one of the deployment fails in reverse order of deployment', done => {
    //  mock deployment fn to fail for second deployment
    (fns.deployFn as jest.Mock).mockImplementation(stack => {
      if (stack.stackTemplatePath === initialContext.stacks[2].stackTemplatePath) {
        return Promise.reject();
      }
      return Promise.resolve();
    });

    const firstStackArg = {
      ...initialContext.stacks[0],
      region: initialContext.region,
      stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[0].stackTemplatePath}`,
    };
    const secondStackArg = {
      ...initialContext.stacks[1],
      region: initialContext.region,
      stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[1].stackTemplatePath}`,
    };
    const thirdStackArg = {
      ...initialContext.stacks[2],
      region: initialContext.region,
      stackTemplateUrl: `${initialContext.deploymentBucket}/${initialContext.stacks[2].stackTemplatePath}`,
    };
    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition(state => {
        if (state.value === 'rolledBack') {
          const rollbackMock = fns.rollbackFn as jest.Mock;
          const deployMock = fns.deployFn as jest.Mock;
          const deployWaitMock = fns.deploymentWaitFn as jest.Mock;
          const tableReadWaitMock = fns.tableReadyWaitFn as jest.Mock;
          expect(deployMock).toHaveBeenCalledTimes(3);
          expect(deployWaitMock).toHaveBeenCalledTimes(2);
          expect(tableReadWaitMock).toHaveBeenCalledTimes(5); // 2 times for deploy and 2 times for rollback and 1 time for before starting rollback

          // First stack deployed
          expect(deployMock.mock.calls[0][0]).toEqual(firstStackArg);
          expect(deployWaitMock.mock.calls[0][0]).toEqual(firstStackArg);
          expect(tableReadWaitMock.mock.calls[0][0]).toEqual(firstStackArg);

          // second stack deployment
          expect(deployMock.mock.calls[1][0]).toEqual(secondStackArg);
          expect(deployWaitMock.mock.calls[1][0]).toEqual(secondStackArg);
          expect(tableReadWaitMock.mock.calls[1][0]).toEqual(secondStackArg);

          // third stack deployment fails
          expect(deployMock.mock.calls[2][0]).toEqual(thirdStackArg);
          // rollback kicks and waits for the table to be ready
          expect(tableReadWaitMock.mock.calls[2][0]).toEqual(thirdStackArg);

          expect(rollbackMock).toHaveBeenCalledTimes(2);

          // rollback of second stack as the thrid stack is automatically rolled back by CFN
          expect(rollbackMock.mock.calls[0][0]).toEqual(secondStackArg);
          expect(tableReadWaitMock.mock.calls[3]).toContainEqual(secondStackArg);

          // rollback of first stack after second one is complete
          expect(rollbackMock.mock.calls[1][0]).toEqual(firstStackArg);
          expect(tableReadWaitMock.mock.calls[4]).toContainEqual(firstStackArg);

          done();
        }
      })
      .start()
      .send('DEPLOY');
  });

  it('should go to failed state when rollback fails', done => {
    const deployFn = fns.deployFn as jest.Mock;
    deployFn.mockImplementation(stack => {
      if (stack.stackTemplatePath === initialContext.stacks[2].stackTemplatePath) {
        return Promise.reject();
      }
      return Promise.resolve();
    });
    const rollBackFn = fns.rollbackFn as jest.Mock;
    rollBackFn.mockRejectedValue(undefined);

    const machine = createDeploymentMachine(initialContext, fns);
    interpret(machine)
      .onTransition(state => {
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
