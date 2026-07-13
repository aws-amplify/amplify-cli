/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { getProject, getTodo, listProjects, listTodos } from '../src/graphql/queries';
import { createProject, updateProject, deleteProject, createTodo, updateTodo, deleteTodo } from '../src/graphql/mutations';
import { ProjectStatus } from '../src/API';
import { signUp, config } from './signup';

const getRandomQuote = /* GraphQL */ `
  query GetRandomQuote {
    getRandomQuote {
      message
      quote
      author
      timestamp
      totalQuotes
    }
  }
`;

const guest = () => generateClient({ authMode: 'apiKey' });
const auth = () => generateClient({ authMode: 'userPool' });

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  it('getRandomQuote returns a quote with all expected fields', async () => {
    const result = await guest().graphql({ query: getRandomQuote });
    const quote = (result as any).data.getRandomQuote;

    expect(quote).toBeDefined();
    expect(typeof quote.message).toBe('string');
    expect(quote.message.length).toBeGreaterThan(0);
    expect(typeof quote.quote).toBe('string');
    expect(quote.quote.length).toBeGreaterThan(0);
    expect(typeof quote.author).toBe('string');
    expect(typeof quote.timestamp).toBe('string');
    expect(typeof quote.totalQuotes).toBe('number');
    expect(quote.totalQuotes).toBeGreaterThan(0);
  });

  it('lists projects', async () => {
    const result = await guest().graphql({ query: listProjects });
    const items = (result as any).data.listProjects.items;

    expect(Array.isArray(items)).toBe(true);
  });

  it('reads a project by id', async () => {
    const listResult = await guest().graphql({ query: listProjects });
    const items = (listResult as any).data.listProjects.items;
    if (items.length === 0) return;

    const result = await guest().graphql({ query: getProject, variables: { id: items[0].id } });
    const project = (result as any).data.getProject;

    expect(project).not.toBeNull();
    expect(project.id).toBe(items[0].id);
    expect(project.title).toBeDefined();
    expect(project.status).toBeDefined();
  });

  it('lists todos', async () => {
    const result = await guest().graphql({ query: listTodos });
    const items = (result as any).data.listTodos.items;

    expect(Array.isArray(items)).toBe(true);
  });

  it('reads a todo by id', async () => {
    const listResult = await guest().graphql({ query: listTodos });
    const items = (listResult as any).data.listTodos.items;
    if (items.length === 0) return;

    const result = await guest().graphql({ query: getTodo, variables: { id: items[0].id } });
    const todo = (result as any).data.getTodo;

    expect(todo).not.toBeNull();
    expect(todo.id).toBe(items[0].id);
    expect(todo.name).toBeDefined();
  });

  it('cannot create a project', async () => {
    await expect(
      guest().graphql({
        query: createProject,
        variables: { input: { title: `Unauthorized ${Date.now()}`, status: ProjectStatus.ACTIVE } },
      }),
    ).rejects.toBeDefined();
  });

  it('cannot create a todo', async () => {
    await expect(
      guest().graphql({
        query: createTodo,
        variables: { input: { name: `Unauthorized ${Date.now()}` } },
      }),
    ).rejects.toBeDefined();
  });
});

describe('auth', () => {
  describe('Project', () => {
    it('creates a project with correct fields', async () => {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const input = {
        title: `Test Project ${Date.now()}`,
        status: ProjectStatus.ACTIVE,
        description: 'Created by jest',
        deadline,
        color: '#007bff',
      };

      const result = await auth().graphql({ query: createProject, variables: { input } });
      const project = (result as any).data.createProject;

      expect(typeof project.id).toBe('string');
      expect(project.id.length).toBeGreaterThan(0);
      expect(project.title).toBe(input.title);
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.description).toBe('Created by jest');
      expect(project.deadline).toBe(deadline);
      expect(project.color).toBe('#007bff');
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
      expect(project.owner).toBeDefined();
    });

    it('reads a project by id', async () => {
      const createResult = await auth().graphql({
        query: createProject,
        variables: { input: { title: `Read Test ${Date.now()}`, status: ProjectStatus.COMPLETED, description: 'For read test' } },
      });
      const created = (createResult as any).data.createProject;

      const getResult = await auth().graphql({ query: getProject, variables: { id: created.id } });
      const fetched = (getResult as any).data.getProject;

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
      expect(fetched.title).toBe(created.title);
      expect(fetched.status).toBe(ProjectStatus.COMPLETED);
      expect(fetched.description).toBe('For read test');
    });

    it('updates a project and persists changes', async () => {
      const createResult = await auth().graphql({
        query: createProject,
        variables: { input: { title: `Update Test ${Date.now()}`, status: ProjectStatus.ACTIVE, color: '#000000' } },
      });
      const created = (createResult as any).data.createProject;

      await auth().graphql({
        query: updateProject,
        variables: {
          input: { id: created.id, title: 'Updated Title', status: ProjectStatus.ON_HOLD, color: '#28a745', description: 'Now updated' },
        },
      });

      const getResult = await auth().graphql({ query: getProject, variables: { id: created.id } });
      const fetched = (getResult as any).data.getProject;

      expect(fetched.title).toBe('Updated Title');
      expect(fetched.status).toBe(ProjectStatus.ON_HOLD);
      expect(fetched.color).toBe('#28a745');
      expect(fetched.description).toBe('Now updated');
    });

    it('deletes a project', async () => {
      const createResult = await auth().graphql({
        query: createProject,
        variables: { input: { title: `Delete Test ${Date.now()}`, status: ProjectStatus.ARCHIVED } },
      });
      const created = (createResult as any).data.createProject;

      await auth().graphql({ query: deleteProject, variables: { input: { id: created.id } } });

      const getResult = await auth().graphql({ query: getProject, variables: { id: created.id } });
      expect((getResult as any).data.getProject).toBeNull();
    });

    it('lists projects including a newly created one', async () => {
      const title = `List Test ${Date.now()}`;
      const createResult = await auth().graphql({
        query: createProject,
        variables: { input: { title, status: ProjectStatus.ACTIVE } },
      });
      const created = (createResult as any).data.createProject;

      const listResult = await auth().graphql({ query: listProjects, variables: { limit: 1000 } });
      const items = (listResult as any).data.listProjects.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((p: any) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(title);
    });
  });

  describe('Todo', () => {
    async function createParentProject(): Promise<string> {
      const result = await auth().graphql({
        query: createProject,
        variables: { input: { title: `Todo Parent ${Date.now()}`, status: ProjectStatus.ACTIVE } },
      });
      return (result as any).data.createProject.id;
    }

    it('creates a todo linked to a project', async () => {
      const projectId = await createParentProject();
      const input = { name: `Test Todo ${Date.now()}`, description: 'Created by jest', projectID: projectId, images: [] as string[] };

      const result = await auth().graphql({ query: createTodo, variables: { input } });
      const todo = (result as any).data.createTodo;

      expect(typeof todo.id).toBe('string');
      expect(todo.id.length).toBeGreaterThan(0);
      expect(todo.name).toBe(input.name);
      expect(todo.description).toBe('Created by jest');
      expect(todo.projectID).toBe(projectId);
      expect(todo.images).toEqual([]);
      expect(todo.createdAt).toBeDefined();
      expect(todo.owner).toBeDefined();
    });

    it('reads a todo by id', async () => {
      const projectId = await createParentProject();
      const createResult = await auth().graphql({
        query: createTodo,
        variables: { input: { name: `Read Todo ${Date.now()}`, description: 'For read test', projectID: projectId } },
      });
      const created = (createResult as any).data.createTodo;

      const getResult = await auth().graphql({ query: getTodo, variables: { id: created.id } });
      const fetched = (getResult as any).data.getTodo;

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
      expect(fetched.description).toBe('For read test');
      expect(fetched.projectID).toBe(projectId);
    });

    it('updates a todo and persists changes', async () => {
      const projectId = await createParentProject();
      const createResult = await auth().graphql({
        query: createTodo,
        variables: { input: { name: `Update Todo ${Date.now()}`, description: 'Original', projectID: projectId } },
      });
      const created = (createResult as any).data.createTodo;

      await auth().graphql({
        query: updateTodo,
        variables: { input: { id: created.id, name: 'Updated Todo', description: 'Now updated', projectID: projectId } },
      });

      const getResult = await auth().graphql({ query: getTodo, variables: { id: created.id } });
      const fetched = (getResult as any).data.getTodo;

      expect(fetched.name).toBe('Updated Todo');
      expect(fetched.description).toBe('Now updated');
    });

    it('deletes a todo', async () => {
      const projectId = await createParentProject();
      const createResult = await auth().graphql({
        query: createTodo,
        variables: { input: { name: `Delete Todo ${Date.now()}`, projectID: projectId } },
      });
      const created = (createResult as any).data.createTodo;

      await auth().graphql({ query: deleteTodo, variables: { input: { id: created.id } } });

      const getResult = await auth().graphql({ query: getTodo, variables: { id: created.id } });
      expect((getResult as any).data.getTodo).toBeNull();
    });

    it('lists todos including a newly created one', async () => {
      const projectId = await createParentProject();
      const name = `List Todo ${Date.now()}`;
      const createResult = await auth().graphql({
        query: createTodo,
        variables: { input: { name, projectID: projectId } },
      });
      const created = (createResult as any).data.createTodo;

      const listResult = await auth().graphql({ query: listTodos, variables: { limit: 1000 } });
      const items = (listResult as any).data.listTodos.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((t: any) => t.id === created.id);
      expect(found).toBeDefined();
      expect(found.name).toBe(name);
    });

    it('creates a todo with an S3 image path', async () => {
      const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      const fileName = `todo-image-${Date.now()}.png`;
      const s3Path = `public/images/${fileName}`;

      const uploadResult = await uploadData({
        path: s3Path,
        data: imageBuffer,
        options: { contentType: 'image/png' },
      }).result;

      const result = await auth().graphql({
        query: createTodo,
        variables: { input: { name: `Todo with image ${Date.now()}`, description: 'Has an image', images: [uploadResult.path] } },
      });
      const todo = (result as any).data.createTodo;

      expect(todo.images).toBeDefined();
      expect(Array.isArray(todo.images)).toBe(true);
      expect(todo.images.length).toBe(1);
      expect(todo.images[0]).toBe(uploadResult.path);
      expect(todo.images[0]).toContain('public/images/');
    });
  });
});
