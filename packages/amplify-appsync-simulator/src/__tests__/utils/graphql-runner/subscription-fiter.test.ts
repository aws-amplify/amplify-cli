import { filterSubscriptions } from '../../../utils/graphql-runner/subscriptions-filter';

describe('filterSubscriptions', () => {
  it('should return true if there  are no filters', () => {
    expect(filterSubscriptions({ a: 12 }, {})).toBeTruthy();
  });

  it('should return false if there is no payload', () => {
    expect(filterSubscriptions(null, {})).toBeFalsy();
  });

  it('should return true when filter matches partially', () => {
    expect(filterSubscriptions({ a: 1, b: 2 }, { a: 1 })).toBeTruthy();
  });

  it('should return true when filter matches completely', () => {
    expect(filterSubscriptions({ a: 1, b: 2 }, { a: 1, b: 2 })).toBeTruthy();
  });

  it('should return false when filter does not match', () => {
    expect(filterSubscriptions({ a: 1, b: 2 }, { a: 1, b: 3 })).toBeFalsy();
  });
});
