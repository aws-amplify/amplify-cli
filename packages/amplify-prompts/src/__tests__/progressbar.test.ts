import { ProgressBar as Bar, BarOptions } from '../progressbars/progressbar';

const options: BarOptions = {
  progressBarFormatter: (payload) => payload.progressName,
  itemFormatter: (payload) => ({ renderString: payload.ResourceStatus, color: '' }),
  loneWolf: false,
  hideCursor: true,
  barCompleteChar: '=',
  barIncompleteChar: '-',
  barSize: 40,
  itemCompleteStatus: ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE', 'DELETE_SKIPPED'],
  itemFailedStatus: ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED'],
  prefixText: '',
  successText: '',
  failureText: '',
};

describe('Check item add/update operations', () => {
  let bar: Bar;

  beforeEach(async () => {
    bar = new Bar(options);
    bar.start(1, 0, { progressName: 'test-project', envName: 'dev' });
    bar.addItem('item1', {
      ResourceStatus: 'pending',
      LogicalResourceId: 'id1',
      Timestamp: '100',
      ResourceType: 'User',
    });
  });

  it('Check if an added item can be retrieved', () => {
    const item = bar.getItem('item1');
    if (item) {
      expect(item.status).toBe('pending');
    }
  });

  it('Check if the item is updated properly', () => {
    bar.updateItem('item1', {
      ResourceStatus: 'finished',
      LogicalResourceId: 'id1',
      Timestamp: '100',
      ResourceType: 'User',
    });
    const item = bar.getItem('item1');
    if (item) {
      expect(item.status).toBe('finished');
    }
  });
});

describe('Test progressBar status', () => {
  let bar: Bar;

  beforeEach(async () => {
    bar = new Bar(options);
    bar.start(2, 0, { progressName: 'test-project', envName: 'dev' });
  });

  it('Checks if bar increment works', () => {
    bar.increment();
    expect(bar.getValue()).toBe(1);
  });

  it('Checks if bar finish works', () => {
    bar.finish();
    expect(bar.isFinished()).toBe(true);
  });

  it('Checks if bar failure works', () => {
    bar.addItem('item1', {
      ResourceStatus: 'CREATE_FAILED',
      LogicalResourceId: 'id1',
      Timestamp: '100',
      ResourceType: 'User',
    });
    expect(bar.isFailed()).toBe(true);
  });
});
