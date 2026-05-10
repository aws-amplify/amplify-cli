/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { getNote, listNotes, generateThumbnail, addUserToGroup, removeUserFromGroup } from '../src/graphql/queries';
import { createNote, updateNote, deleteNote } from '../src/graphql/mutations';
import { signUp, config } from './signup';

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
  it('generates a thumbnail for an uploaded image', async () => {
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');

    const uploadResult = await uploadData({
      path: ({ identityId }) => `private/${identityId}/media/test-${Date.now()}.png`,
      data: imageBuffer,
    }).result;

    const fullKey = uploadResult.path;
    expect(typeof fullKey).toBe('string');
    expect(fullKey.length).toBeGreaterThan(0);

    const result = await guest().graphql({
      query: generateThumbnail,
      variables: { mediaFileKey: fullKey },
    });
    const response = (result as any).data.generateThumbnail;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });

  it('adds the current user to a group', async () => {
    const session = await fetchAuthSession();
    const userSub = session.tokens?.idToken?.payload.sub as string;
    expect(typeof userSub).toBe('string');

    const result = await guest().graphql({
      query: addUserToGroup,
      variables: { userSub, group: 'Admin' },
    });
    const response = (result as any).data.addUserToGroup;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });

  it('removes the current user from a group', async () => {
    const session = await fetchAuthSession();
    const userSub = session.tokens?.idToken?.payload.sub as string;
    expect(typeof userSub).toBe('string');

    const result = await guest().graphql({
      query: removeUserFromGroup,
      variables: { userSub, group: 'Admin' },
    });
    const response = (result as any).data.removeUserFromGroup;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });

  it('cannot create a note', async () => {
    await expect(
      guest().graphql({
        query: createNote,
        variables: { input: { title: `Unauthorized ${Date.now()}`, content: 'Should fail' } },
      }),
    ).rejects.toBeDefined();
  });

  it('cannot list notes', async () => {
    await expect(guest().graphql({ query: listNotes })).rejects.toBeDefined();
  });
});

describe('auth', () => {
  describe('Note', () => {
    it('creates a note with correct fields', async () => {
      const input = {
        title: `Test Note ${Date.now()}`,
        content: 'Created by jest',
      };

      const result = await auth().graphql({ query: createNote, variables: { input } });
      const note = (result as any).data.createNote;

      expect(typeof note.id).toBe('string');
      expect(note.id.length).toBeGreaterThan(0);
      expect(note.title).toBe(input.title);
      expect(note.content).toBe('Created by jest');
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
      expect(note.owner).toBeDefined();
    });

    it('reads a note by id', async () => {
      const createResult = await auth().graphql({
        query: createNote,
        variables: { input: { title: `Read Test ${Date.now()}`, content: 'For read test' } },
      });
      const created = (createResult as any).data.createNote;

      const getResult = await auth().graphql({ query: getNote, variables: { id: created.id } });
      const fetched = (getResult as any).data.getNote;

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
      expect(fetched.title).toBe(created.title);
      expect(fetched.content).toBe('For read test');
    });

    it('updates a note and persists changes', async () => {
      const createResult = await auth().graphql({
        query: createNote,
        variables: { input: { title: `Update Test ${Date.now()}`, content: 'Original' } },
      });
      const created = (createResult as any).data.createNote;

      await auth().graphql({
        query: updateNote,
        variables: { input: { id: created.id, title: 'Updated Title', content: 'Now updated' } },
      });

      const getResult = await auth().graphql({ query: getNote, variables: { id: created.id } });
      const fetched = (getResult as any).data.getNote;

      expect(fetched.title).toBe('Updated Title');
      expect(fetched.content).toBe('Now updated');
    });

    it('deletes a note', async () => {
      const createResult = await auth().graphql({
        query: createNote,
        variables: { input: { title: `Delete Test ${Date.now()}`, content: 'Delete me' } },
      });
      const created = (createResult as any).data.createNote;

      await auth().graphql({ query: deleteNote, variables: { input: { id: created.id } } });

      const getResult = await auth().graphql({ query: getNote, variables: { id: created.id } });
      expect((getResult as any).data.getNote).toBeNull();
    });

    it('lists notes including a newly created one', async () => {
      const title = `List Test ${Date.now()}`;
      const createResult = await auth().graphql({
        query: createNote,
        variables: { input: { title, content: 'For list test' } },
      });
      const created = (createResult as any).data.createNote;

      const listResult = await auth().graphql({ query: listNotes, variables: { limit: 1000 } });
      const items = (listResult as any).data.listNotes.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((n: any) => n.id === created.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(title);
    });
  });
});
