/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import {
  getMoodItem,
  listMoodItems,
  getBoard,
  listBoards,
  moodItemsByBoardID,
  getRandomEmoji,
  getKinesisEvents,
} from '../src/graphql/queries';
import { createMoodItem, updateMoodItem, deleteMoodItem, createBoard, updateBoard, deleteBoard } from '../src/graphql/mutations';
import { signUp, configureAmplify } from './signup';

const guest = () => generateClient({ authMode: 'apiKey' });
const auth = () => generateClient({ authMode: 'userPool' });

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  describe('Board', () => {
    it('creates a board with correct fields', async () => {
      const name = `Test Board ${Date.now()}`;
      const result = await guest().graphql({
        query: createBoard,
        variables: { input: { name } },
      });
      const board = (result as any).data.createBoard;

      expect(typeof board.id).toBe('string');
      expect(board.id.length).toBeGreaterThan(0);
      expect(board.name).toEqual(`${name} (new!)`);
      expect(board.createdAt).toBeDefined();
      expect(board.updatedAt).toBeDefined();
    });

    it('reads a board by id', async () => {
      const name = `Read Board ${Date.now()}`;
      const createResult = await guest().graphql({
        query: createBoard,
        variables: { input: { name } },
      });
      const created = (createResult as any).data.createBoard;

      const getResult = await guest().graphql({ query: getBoard, variables: { id: created.id } });
      const fetched = (getResult as any).data.getBoard;

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
    });

    it('updates a board and persists changes', async () => {
      const createResult = await guest().graphql({
        query: createBoard,
        variables: { input: { name: `Update Board ${Date.now()}` } },
      });
      const created = (createResult as any).data.createBoard;

      const updatedName = `Updated Board ${Date.now()}`;
      await guest().graphql({
        query: updateBoard,
        variables: { input: { id: created.id, name: updatedName } },
      });

      const getResult = await guest().graphql({ query: getBoard, variables: { id: created.id } });
      const fetched = (getResult as any).data.getBoard;

      expect(fetched.name).toBe(updatedName);
    });

    it('deletes a board', async () => {
      const createResult = await guest().graphql({
        query: createBoard,
        variables: { input: { name: `Delete Board ${Date.now()}` } },
      });
      const created = (createResult as any).data.createBoard;

      await guest().graphql({ query: deleteBoard, variables: { input: { id: created.id } } });

      const getResult = await guest().graphql({ query: getBoard, variables: { id: created.id } });
      expect((getResult as any).data.getBoard).toBeNull();
    });

    it('lists boards including a newly created one', async () => {
      const name = `List Board ${Date.now()}`;
      const createResult = await guest().graphql({
        query: createBoard,
        variables: { input: { name } },
      });
      const created = (createResult as any).data.createBoard;

      const listResult = await guest().graphql({ query: listBoards, variables: { limit: 1000 } });
      const items = (listResult as any).data.listBoards.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((b: any) => b.id === created.id);
      expect(found).toBeDefined();
      expect(found.name).toBe(`(new!) ${name}`);
    });
  });

  describe('MoodItem', () => {
    let boardId: string;

    beforeAll(async () => {
      const result = await guest().graphql({
        query: createBoard,
        variables: { input: { name: `MoodItem Parent ${Date.now()}` } },
      });
      boardId = (result as any).data.createBoard.id;
    });

    it('creates a mood item with correct fields', async () => {
      const input = {
        title: `Test Mood ${Date.now()}`,
        description: 'A test mood item',
        image: 'https://example.com/test-mood.png',
        boardID: boardId,
      };

      const result = await guest().graphql({ query: createMoodItem, variables: { input } });
      const item = (result as any).data.createMoodItem;

      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.title).toBe(input.title);
      expect(item.description).toBe('A test mood item');
      expect(item.image).toBe('https://example.com/test-mood.png');
      expect(item.boardID).toBe(boardId);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('reads a mood item by id', async () => {
      const title = `Read Mood ${Date.now()}`;
      const createResult = await guest().graphql({
        query: createMoodItem,
        variables: { input: { title, description: 'For read test', image: 'https://example.com/read.png', boardID: boardId } },
      });
      const created = (createResult as any).data.createMoodItem;

      const getResult = await guest().graphql({ query: getMoodItem, variables: { id: created.id } });
      const fetched = (getResult as any).data.getMoodItem;

      expect(fetched).not.toBeNull();
      expect(fetched.id).toBe(created.id);
      expect(fetched.title).toBe(title);
      expect(fetched.description).toBe('For read test');
      expect(fetched.image).toBe('https://example.com/read.png');
      expect(fetched.boardID).toBe(boardId);
    });

    it('updates a mood item and persists changes', async () => {
      const createResult = await guest().graphql({
        query: createMoodItem,
        variables: {
          input: { title: `Update Mood ${Date.now()}`, description: 'Original', image: 'https://example.com/update.png', boardID: boardId },
        },
      });
      const created = (createResult as any).data.createMoodItem;

      const updatedTitle = `Updated Mood ${Date.now()}`;
      await guest().graphql({
        query: updateMoodItem,
        variables: { input: { id: created.id, title: updatedTitle, description: 'Now updated' } },
      });

      const getResult = await guest().graphql({ query: getMoodItem, variables: { id: created.id } });
      const fetched = (getResult as any).data.getMoodItem;

      expect(fetched.title).toBe(updatedTitle);
      expect(fetched.description).toBe('Now updated');
    });

    it('deletes a mood item', async () => {
      const createResult = await guest().graphql({
        query: createMoodItem,
        variables: { input: { title: `Delete Mood ${Date.now()}`, image: 'https://example.com/delete.png', boardID: boardId } },
      });
      const created = (createResult as any).data.createMoodItem;

      await guest().graphql({ query: deleteMoodItem, variables: { input: { id: created.id } } });

      const getResult = await guest().graphql({ query: getMoodItem, variables: { id: created.id } });
      expect((getResult as any).data.getMoodItem).toBeNull();
    });

    it('lists mood items including a newly created one', async () => {
      const title = `List Mood ${Date.now()}`;
      const createResult = await guest().graphql({
        query: createMoodItem,
        variables: { input: { title, image: 'https://example.com/list.png', boardID: boardId } },
      });
      const created = (createResult as any).data.createMoodItem;

      const listResult = await guest().graphql({ query: listMoodItems, variables: { limit: 1000 } });
      const items = (listResult as any).data.listMoodItems.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((m: any) => m.id === created.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(title);
    });

    it('returns mood items filtered by board ID', async () => {
      const boardResult = await guest().graphql({
        query: createBoard,
        variables: { input: { name: `ByBoardID Test ${Date.now()}` } },
      });
      const bid = (boardResult as any).data.createBoard.id;

      const title = `ByBoard Mood ${Date.now()}`;
      await guest().graphql({
        query: createMoodItem,
        variables: { input: { title, description: 'For byBoardID test', image: 'https://example.com/byboard.png', boardID: bid } },
      });

      const result = await guest().graphql({ query: moodItemsByBoardID, variables: { boardID: bid } });
      const items = (result as any).data.moodItemsByBoardID.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((m: any) => m.title === title);
      expect(found).toBeDefined();
      expect(found.boardID).toBe(bid);
    });
  });

  it('cannot call getRandomEmoji', async () => {
    await expect(guest().graphql({ query: getRandomEmoji })).rejects.toBeDefined();
  });

  it('cannot call getKinesisEvents', async () => {
    await expect(guest().graphql({ query: getKinesisEvents })).rejects.toBeDefined();
  });
});

describe('auth', () => {
  it('getRandomEmoji returns a non-empty string', async () => {
    const result = await auth().graphql({ query: getRandomEmoji });
    const emoji = (result as any).data.getRandomEmoji;

    expect(typeof emoji).toBe('string');
    expect(emoji.length).toBeGreaterThan(0);
  });

  it('getKinesisEvents returns parseable JSON', async () => {
    const result = await auth().graphql({ query: getKinesisEvents });
    const raw = (result as any).data.getKinesisEvents;

    expect(typeof raw).toBe('string');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe('object');
  });
});
