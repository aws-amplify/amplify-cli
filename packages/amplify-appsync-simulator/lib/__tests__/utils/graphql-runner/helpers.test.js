"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const helpers_1 = require("../../../utils/graphql-runner/helpers");
describe('getOperationType', () => {
    it('should return subscription when operation is subscription', () => {
        const doc = (0, graphql_1.parse)(`
      subscription mySubscription {
        name
        address
      }
    `);
        expect((0, helpers_1.getOperationType)(doc)).toEqual('subscription');
    });
    it('should return mutation when operation is mutation', () => {
        const doc = (0, graphql_1.parse)(`
      mutation createUser {
        createUser(user: "user1", address: "1200 Westlake") {
          name
          address
        }
      }
    `);
        expect((0, helpers_1.getOperationType)(doc)).toEqual('mutation');
    });
    it('should return query when operation is query', () => {
        const doc = (0, graphql_1.parse)(`
      query listUsers {
        listUsers {
          users {
            name
            address
          }
        }
      }
    `);
        expect((0, helpers_1.getOperationType)(doc)).toEqual('query');
    });
    it('should get operation based on operationName', () => {
        const doc = (0, graphql_1.parse)(`
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
        expect((0, helpers_1.getOperationType)(doc, 'listUsers')).toEqual('query');
    });
    it('should throw error when there ais more then one operation and operation name is missing', () => {
        const doc = (0, graphql_1.parse)(`
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
        expect(() => (0, helpers_1.getOperationType)(doc)).toThrowError('Could not get operation');
    });
    it('should throw error if the document is missig operation', () => {
        const doc = (0, graphql_1.parse)(`
      type User {
        name: String!
        address: String!
      }
    `);
        expect(() => (0, helpers_1.getOperationType)(doc)).toThrowError('Could not get operation');
    });
});
//# sourceMappingURL=helpers.test.js.map