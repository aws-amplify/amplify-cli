import { recursiveOmit } from '../../utils';
import { $TSObject } from '../..';

describe('recursiveOmit', () => {
  let testObject: $TSObject;

  beforeEach(() => {
    testObject = {
      prop1: {
        prop2: {
          prop3: 'val3',
          prop4: 'val4',
        },
        prop5: {
          prop6: 'val6',
        },
      },
    };
  });

  test('empty path does not mutate object', () => {
    const result = {
      prop1: {
        prop2: {
          prop3: 'val3',
          prop4: 'val4',
        },
        prop5: {
          prop6: 'val6',
        },
      },
    };

    recursiveOmit(testObject, []);
    expect(testObject).toEqual(result);
  });

  test('wrong path does not mutate object', () => {
    const result = {
      prop1: {
        prop2: {
          prop3: 'val3',
          prop4: 'val4',
        },
        prop5: {
          prop6: 'val6',
        },
      },
    };

    recursiveOmit(testObject, ['prop1', 'prop7']);
    expect(testObject).toEqual(result);
  });

  test('deleting a key with subkeys removes them all', () => {
    const result = {};

    recursiveOmit(testObject, ['prop1']);
    expect(testObject).toEqual(result);
  });

  test('deleting a key with subkeys does not mutate sibling keys and subkeys', () => {
    const result = {
      prop1: {
        prop5: {
          prop6: 'val6',
        },
      },
    };

    recursiveOmit(testObject, ['prop1', 'prop2']);
    expect(testObject).toEqual(result);
  });

  test('deleting a key in a specific path does not affect sibling keys if there are any', () => {
    const result = {
      prop1: {
        prop2: {
          prop4: 'val4',
        },
        prop5: {
          prop6: 'val6',
        },
      },
    };

    recursiveOmit(testObject, ['prop1', 'prop2', 'prop3']);
    expect(testObject).toEqual(result);
  });

  test('deleting a key in a specific path results in deleting keys that no longer have child keys', () => {
    const result = {
      prop1: {
        prop2: {
          prop3: 'val3',
          prop4: 'val4',
        },
      },
    };

    recursiveOmit(testObject, ['prop1', 'prop5', 'prop6']);
    expect(testObject).toEqual(result);
  });
});
