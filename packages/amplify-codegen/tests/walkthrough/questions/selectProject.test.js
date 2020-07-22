const inquirer = require('inquirer');

const askForProject = require('../../../src/walkthrough/questions/selectProject');

jest.mock('inquirer');

describe('Select project', () => {
  const mockContext = 'CONTEXT';
  const mockProjects = [
    { name: 'proj1', value: 'prj-1' },
    { name: 'Proj2', value: 'prj2' },
  ];
  const selectedProject = 'prj2';

  beforeEach(() => {
    jest.resetAllMocks();
    inquirer.prompt.mockReturnValue({
      projectName: selectedProject,
    });
  });

  it('should show a prompt and allow user to select projects', async () => {
    const answer = await askForProject(mockContext, mockProjects);
    expect(answer).toEqual(selectedProject);
    const promptParam = inquirer.prompt.mock.calls[0][0];
    expect(promptParam[0].type).toEqual('list');
    expect(promptParam[0].name).toEqual('projectName');
    expect(promptParam[0].choices).toEqual(mockProjects);
  });

  it('should not prompt when there is a single project', async () => {
    const answer = await askForProject(mockContext, [mockProjects[0]]);
    expect(answer).toEqual(mockProjects[0].value);
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });
});
