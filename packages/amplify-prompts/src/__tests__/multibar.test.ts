import { MultiProgressBar as MultiBar } from '../progressbars/multibar';
import { BarOptions, ItemPayload, ProgressPayload } from '../progressbars/progressbar';

const options: BarOptions = {
  progressBarFormatter: (payload: ProgressPayload) => payload.progressName,
  itemFormatter: (payload: ItemPayload) => ({ renderString: payload.ResourceStatus, color: '' }),
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

describe('Bar update operations', () => {
  let multiBar: MultiBar;

  beforeEach(() => {
    multiBar = new MultiBar(options);
    multiBar.create([
      {
        name: 'test-bar',
        value: 0,
        total: 2,
        payload: {
          progressName: 'test',
          envName: 'dev',
        },
      },
    ]);
  });

  afterEach(() => {
    multiBar.stop();
  });

  it('Check if an item can be added to a bar', () => {
    multiBar.updateBar('test-bar', {
      name: 'test-item',
      payload: {
        ResourceStatus: 'pending',
        LogicalResourceId: 'id1',
        Timestamp: '100',
        ResourceType: 'User',
      },
    });
    const barDetails = multiBar.getBar('test-bar');
    if (barDetails) {
      const barUpdated = barDetails.bar;
      const item = barUpdated.getItem('test-item');
      if (item) {
        expect(item.status).toBe('pending');
      }
    }
  });

  it('Check if an existing item can be updated in a bar', () => {
    multiBar.updateBar('test-bar', {
      name: 'test-item',
      payload: {
        ResourceStatus: 'pending',
        LogicalResourceId: 'id1',
        Timestamp: '100',
        ResourceType: 'User',
      },
    });
    multiBar.updateBar('test-bar', {
      name: 'test-item',
      payload: {
        ResourceStatus: 'finished',
        LogicalResourceId: 'id1',
        Timestamp: '100',
        ResourceType: 'User',
      },
    });
    const barDetails = multiBar.getBar('test-bar');
    if (barDetails) {
      const barUpdated = barDetails.bar;
      const item = barUpdated.getItem('test-item');
      if (item) {
        expect(item.status).toBe('finished');
      }
    }
  });

  it('Check if bar value is incremented during update', () => {
    multiBar.updateBar('test-bar', {
      name: 'test-item',
      payload: {
        ResourceStatus: 'CREATE_COMPLETE',
        LogicalResourceId: 'id1',
        Timestamp: '100',
        ResourceType: 'User',
      },
    });
    const barDetails = multiBar.getBar('test-bar');
    if (barDetails) {
      const barUpdated = barDetails.bar;
      expect(barUpdated.getValue()).toBe(1);
    }
  });

  it('Checks if a bar can be incremented', () => {
    multiBar.incrementBar('test-bar', 1);
    const barDetails = multiBar.getBar('test-bar');
    if (barDetails) {
      const barUpdated = barDetails.bar;
      expect(barUpdated.getValue()).toBe(1);
    }
  });

  it('Checks if a bar can be finished', () => {
    multiBar.finishBar('test-bar');
    const barDetails = multiBar.getBar('test-bar');
    if (barDetails) {
      const barUpdated = barDetails.bar;
      expect(barUpdated.getValue()).toBe(2);
    }
  });
});
