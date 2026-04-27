/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { getNote, addUserToGroup, removeUserFromGroup } from '../src/graphql/queries';
import { createNote } from '../src/graphql/mutations';
import { signUp, config } from './signup';

const guest = () => generateClient({ authMode: 'apiKey' });
const auth = () => generateClient({ authMode: 'userPool' });

it('admin group member can read notes owned by other users', async () => {
  // Ensure no leftover session from other test files
  await signOut().catch(() => {});

  // User A creates a note
  const userA = await signUp(config);
  await signIn({ username: userA.username, password: userA.password });

  const createResult = await auth().graphql({
    query: createNote,
    variables: { input: { title: `Admin Test ${Date.now()}`, content: 'Created by user A' } },
  });
  const noteId = (createResult as any).data.createNote.id;

  // Create user B and sign in
  const userB = await signUp(config);
  await signOut();
  await signIn({ username: userB.username, password: userB.password });

  // User B (not admin) cannot see user A's note
  await expect(auth().graphql({ query: getNote, variables: { id: noteId } })).rejects.toBeDefined();

  // Add user B to Admin group via public API
  const session = await fetchAuthSession();
  const userSub = session.tokens?.idToken?.payload.sub as string;
  await guest().graphql({ query: addUserToGroup, variables: { userSub, group: 'Admin' } });

  // Re-sign-in to refresh tokens with Admin group claim
  await signOut();
  await signIn({ username: userB.username, password: userB.password });

  // User B (now admin) can see user A's note
  const afterAdmin = await auth().graphql({ query: getNote, variables: { id: noteId } });
  const note = (afterAdmin as any).data.getNote;
  expect(note).not.toBeNull();
  expect(note.id).toBe(noteId);
  expect(note.content).toBe('Created by user A');

  // Cleanup
  await guest().graphql({ query: removeUserFromGroup, variables: { userSub, group: 'Admin' } });
  await signOut();
}, 60_000);
