/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { signUp, configureAmplify } from './signup';
import { getTopic, listTopics, getPost, listPosts, getComment, listComments, fetchUserActivity } from '../src/graphql/queries';
import {
  createTopic,
  updateTopic,
  deleteTopic,
  createPost,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
} from '../src/graphql/mutations';

const client = () => generateClient({ authMode: 'apiKey' });

let username: string;
let password: string;

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('Topic', () => {
  it('creates a topic with correct fields', async () => {
    const currentUser = await getCurrentUser();
    const content = `tech:Test Topic ${Date.now()}`;

    const result = await client().graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: currentUser.userId } },
    });
    const topic = (result as any).data.createTopic;

    expect(typeof topic.id).toBe('string');
    expect(topic.id.length).toBeGreaterThan(0);
    expect(topic.content).toBe(content);
    expect(topic.createdByUserId).toBe(currentUser.userId);
    expect(topic.createdAt).toBeDefined();
    expect(topic.updatedAt).toBeDefined();
  });

  it('reads a topic by id', async () => {
    const currentUser = await getCurrentUser();
    const content = `tech:Read Topic ${Date.now()}`;

    const createResult = await client().graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createTopic;

    const getResult = await client().graphql({ query: getTopic, variables: { id: created.id } });
    const fetched = (getResult as any).data.getTopic;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.content).toBe(content);
    expect(fetched.createdByUserId).toBe(currentUser.userId);
  });

  it('updates a topic and persists changes', async () => {
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createTopic,
      variables: { input: { content: `tech:Original ${Date.now()}`, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createTopic;

    const updatedContent = `tech:Updated Topic ${Date.now()}`;
    await client().graphql({
      query: updateTopic,
      variables: { input: { id: created.id, content: updatedContent } },
    });

    const getResult = await client().graphql({ query: getTopic, variables: { id: created.id } });
    const fetched = (getResult as any).data.getTopic;

    expect(fetched.content).toBe(updatedContent);
  });

  it('deletes a topic', async () => {
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createTopic,
      variables: { input: { content: `tech:Delete Me ${Date.now()}`, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createTopic;

    await client().graphql({ query: deleteTopic, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getTopic, variables: { id: created.id } });
    expect((getResult as any).data.getTopic).toBeNull();
  });

  it('lists topics including a newly created one', async () => {
    const currentUser = await getCurrentUser();
    const content = `tech:List Topic ${Date.now()}`;

    const createResult = await client().graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createTopic;

    const listResult = await client().graphql({ query: listTopics, variables: { limit: 1000 } });
    const items = (listResult as any).data.listTopics.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((t: any) => t.id === created.id);
    expect(found).toBeDefined();
    expect(found.content).toBe(content);
  });
});

describe('Post', () => {
  async function createParentTopic(): Promise<string> {
    const currentUser = await getCurrentUser();
    const result = await client().graphql({
      query: createTopic,
      variables: { input: { content: `tech:Post Parent ${Date.now()}`, createdByUserId: currentUser.userId } },
    });
    return (result as any).data.createTopic.id;
  }

  it('creates a post linked to a topic', async () => {
    const topicId = await createParentTopic();
    const currentUser = await getCurrentUser();
    const content = `Test post created at ${new Date().toISOString()}`;

    const result = await client().graphql({
      query: createPost,
      variables: { input: { content, topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    const post = (result as any).data.createPost;

    expect(typeof post.id).toBe('string');
    expect(post.id.length).toBeGreaterThan(0);
    expect(post.content).toBe(content);
    expect(post.topicPostsId).toBe(topicId);
    expect(post.createdByUserId).toBe(currentUser.userId);
    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
  });

  it('reads a post by id', async () => {
    const topicId = await createParentTopic();
    const currentUser = await getCurrentUser();
    const content = `Read post ${Date.now()}`;

    const createResult = await client().graphql({
      query: createPost,
      variables: { input: { content, topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createPost;

    const getResult = await client().graphql({ query: getPost, variables: { id: created.id } });
    const fetched = (getResult as any).data.getPost;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.content).toBe(content);
    expect(fetched.topicPostsId).toBe(topicId);
  });

  it('updates a post and persists changes', async () => {
    const topicId = await createParentTopic();
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createPost,
      variables: { input: { content: 'Original post', topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createPost;

    const updatedContent = `Updated post at ${new Date().toISOString()}`;
    await client().graphql({
      query: updatePost,
      variables: { input: { id: created.id, content: updatedContent } },
    });

    const getResult = await client().graphql({ query: getPost, variables: { id: created.id } });
    const fetched = (getResult as any).data.getPost;

    expect(fetched.content).toBe(updatedContent);
  });

  it('deletes a post', async () => {
    const topicId = await createParentTopic();
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createPost,
      variables: { input: { content: 'Delete me', topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createPost;

    await client().graphql({ query: deletePost, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getPost, variables: { id: created.id } });
    expect((getResult as any).data.getPost).toBeNull();
  });

  it('lists posts including a newly created one', async () => {
    const topicId = await createParentTopic();
    const currentUser = await getCurrentUser();
    const content = `List post ${Date.now()}`;

    const createResult = await client().graphql({
      query: createPost,
      variables: { input: { content, topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createPost;

    const listResult = await client().graphql({ query: listPosts, variables: { limit: 1000 } });
    const items = (listResult as any).data.listPosts.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(found.content).toBe(content);
  });
});

describe('Comment', () => {
  async function createParentPost(): Promise<string> {
    const currentUser = await getCurrentUser();
    const topicResult = await client().graphql({
      query: createTopic,
      variables: { input: { content: `tech:Comment Parent ${Date.now()}`, createdByUserId: currentUser.userId } },
    });
    const topicId = (topicResult as any).data.createTopic.id;

    const postResult = await client().graphql({
      query: createPost,
      variables: { input: { content: `Parent post ${Date.now()}`, topicPostsId: topicId, createdByUserId: currentUser.userId } },
    });
    return (postResult as any).data.createPost.id;
  }

  it('creates a comment linked to a post', async () => {
    const postId = await createParentPost();
    const currentUser = await getCurrentUser();
    const content = `Test comment at ${new Date().toISOString()}`;

    const result = await client().graphql({
      query: createComment,
      variables: { input: { content, postCommentsId: postId, createdByUserId: currentUser.userId } },
    });
    const comment = (result as any).data.createComment;

    expect(typeof comment.id).toBe('string');
    expect(comment.id.length).toBeGreaterThan(0);
    expect(comment.content).toBe(content);
    expect(comment.postCommentsId).toBe(postId);
    expect(comment.createdByUserId).toBe(currentUser.userId);
    expect(comment.createdAt).toBeDefined();
    expect(comment.updatedAt).toBeDefined();
  });

  it('reads a comment by id', async () => {
    const postId = await createParentPost();
    const currentUser = await getCurrentUser();
    const content = `Read comment ${Date.now()}`;

    const createResult = await client().graphql({
      query: createComment,
      variables: { input: { content, postCommentsId: postId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createComment;

    const getResult = await client().graphql({ query: getComment, variables: { id: created.id } });
    const fetched = (getResult as any).data.getComment;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.content).toBe(content);
    expect(fetched.postCommentsId).toBe(postId);
  });

  it('updates a comment and persists changes', async () => {
    const postId = await createParentPost();
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createComment,
      variables: { input: { content: 'Original comment', postCommentsId: postId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createComment;

    const updatedContent = `Updated comment at ${new Date().toISOString()}`;
    await client().graphql({
      query: updateComment,
      variables: { input: { id: created.id, content: updatedContent } },
    });

    const getResult = await client().graphql({ query: getComment, variables: { id: created.id } });
    const fetched = (getResult as any).data.getComment;

    expect(fetched.content).toBe(updatedContent);
  });

  it('deletes a comment', async () => {
    const postId = await createParentPost();
    const currentUser = await getCurrentUser();

    const createResult = await client().graphql({
      query: createComment,
      variables: { input: { content: 'Delete me', postCommentsId: postId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createComment;

    await client().graphql({ query: deleteComment, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getComment, variables: { id: created.id } });
    expect((getResult as any).data.getComment).toBeNull();
  });

  it('lists comments including a newly created one', async () => {
    const postId = await createParentPost();
    const currentUser = await getCurrentUser();
    const content = `List comment ${Date.now()}`;

    const createResult = await client().graphql({
      query: createComment,
      variables: { input: { content, postCommentsId: postId, createdByUserId: currentUser.userId } },
    });
    const created = (createResult as any).data.createComment;

    const listResult = await client().graphql({ query: listComments, variables: { limit: 1000 } });
    const items = (listResult as any).data.listComments.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((c: any) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.content).toBe(content);
  });
});

describe('fetchUserActivity', () => {
  it('returns an activity array', async () => {
    const currentUser = await getCurrentUser();
    const activityClient = generateClient({ authMode: 'apiKey' });

    const result = await activityClient.graphql({ query: fetchUserActivity, variables: { userId: currentUser.userId } });
    const activities = (result as any).data.fetchUserActivity || [];

    expect(Array.isArray(activities)).toBe(true);
  });
});
