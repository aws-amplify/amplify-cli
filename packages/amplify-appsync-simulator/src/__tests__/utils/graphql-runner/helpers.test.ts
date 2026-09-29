import { parse } from 'graphql';
import { getOperationType } from '../../../utils/graphql-runner/helpers';

describe('getOperationType', () => {
  it('should return subscription when operation is subscription', () => {
    const doc = parse(/* GraphQL */ `
      subscription mySubscription {
        name
        address
      }
    `);
    expect(getOperationType(doc)).toEqual('subscription');
  });

  it('should return mutation when operation is mutation', () => {
    const doc = parse(/* GraphQL */ `
      mutation createUser {
        createUser(user: "user1", address: "1200 Westlake") {
          name
          address
        }
      }
    `);
    expect(getOperationType(doc)).toEqual('mutation');
  });

  it('should return query when operation is query', () => {
    const doc = parse(/* GraphQL */ `
      query listUsers {
        listUsers {
          users {
            name
            address
          }
        }
      }
    `);

    expect(getOperationType(doc)).toEqual('query');
  });

  it('should get operation based on operationName', () => {
    const doc = parse(/* GraphQL */ `
      query listUsers {
        listUsers {
          users {
            name
            address
          }
        }
      }

      mutation createUser {
        createUser(user: "user1", address: "1200 Westlake") {
          name
          address
        }
      }
    `);
    expect(getOperationType(doc, 'listUsers')).toEqual('query');
  });

  it('should throw error when there ais more then one operation and operation name is missing', () => {
    const doc = parse(/* GraphQL */ `
      query listUsers {
        listUsers {
          users {
            name
            address
          }
        }
      }

      mutation createUser {
        createUser(user: "user1", address: "1200 Westlake") {
          name
          address
        }
      }
    `);
    expect(() => getOperationType(doc)).toThrowError('Could not get operation');
  });

  it('should throw error if the document is missig operation', () => {
    const doc = parse(/* GraphQL */ `
      type User {
        name: String!
        address: String!
      }
    `);
    expect(() => getOperationType(doc)).toThrowError('Could not get operation');
  });
});
