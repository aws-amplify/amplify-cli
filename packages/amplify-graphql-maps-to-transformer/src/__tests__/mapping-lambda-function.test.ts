//@ts-ignore
import { handler } from '../../resources/mapping-lambda-function';

describe('lambda mapping function', () => {
  it('maps specified fields in the filter', async () => {
    const event = {
      args: {
        filter: {
          or: [
            { articleCommentsId: { eq: 'testtest' } },
            { message: { beginsWith: 'hello' } },
            {
              and: [{ articleCommentsId: { beginsWith: 'aa' } }, { createdAt: { lt: 'date' } }],
            },
          ],
        },
      },
      fieldMap: {
        articleCommentsId: 'postCommentsId',
      },
    };

    const newArgs = await handler(event);
    expect(newArgs).toEqual({
      filter: {
        or: [
          { postCommentsId: { eq: 'testtest' } },
          { message: { beginsWith: 'hello' } },
          {
            and: [{ postCommentsId: { beginsWith: 'aa' } }, { createdAt: { lt: 'date' } }],
          },
        ],
      },
    });
  });

  it('maps specified fields in the condition', async () => {
    const event = {
      args: {
        condition: {
          or: [
            { articleCommentsId: { eq: 'testtest' } },
            { message: { beginsWith: 'hello' } },
            {
              and: [{ articleCommentsId: { beginsWith: 'aa' } }, { createdAt: { lt: 'date' } }],
            },
          ],
        },
      },
      fieldMap: {
        articleCommentsId: 'postCommentsId',
      },
    };

    const newArgs = await handler(event);
    expect(newArgs).toEqual({
      condition: {
        or: [
          { postCommentsId: { eq: 'testtest' } },
          { message: { beginsWith: 'hello' } },
          {
            and: [{ postCommentsId: { beginsWith: 'aa' } }, { createdAt: { lt: 'date' } }],
          },
        ],
      },
    });
  });

  it('maps specified fields in searchable sort input', async () => {
    const event = {
      args: {
        sort: [
          {
            field: 'something',
            direction: 'asc',
          },
          {
            field: 'articleCommentsId',
            direction: 'desc',
          },
        ],
      },
      fieldMap: {
        articleCommentsId: 'postCommentsId',
      },
    };

    const newArgs = await handler(event);
    expect(newArgs).toEqual({
      sort: [
        {
          field: 'something',
          direction: 'asc',
        },
        {
          field: 'postCommentsId',
          direction: 'desc',
        },
      ],
    });
  });

  it('maps specified fields in searchable aggregates input', async () => {
    const event = {
      args: {
        aggregates: [
          {
            field: 'something',
            type: 'terms',
            name: 'some name',
          },
          {
            field: 'articleCommentsId',
            type: 'avg',
            name: 'other name',
          },
        ],
      },
      fieldMap: {
        articleCommentsId: 'postCommentsId',
      },
    };

    const newArgs = await handler(event);
    expect(newArgs).toEqual({
      aggregates: [
        {
          field: 'something',
          type: 'terms',
          name: 'some name',
        },
        {
          field: 'postCommentsId',
          type: 'avg',
          name: 'other name',
        },
      ],
    });
  });

  it('leaves other top level fields unmodified', async () => {
    const event = {
      args: {
        input: {
          articleCommentsId: 'something',
          comments: 'a test string',
        },
      },
      fieldMap: {
        articleCommentsId: 'postCommentsId',
      },
    };

    const newArgs = await handler(event);
    expect(newArgs).toEqual(event.args);
  });
});
