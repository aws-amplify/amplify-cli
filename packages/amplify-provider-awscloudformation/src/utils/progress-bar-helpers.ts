import columnify from 'columnify';

const COLUMNIFY_WIDTH = 30;

export const CFN_SUCCESS_STATUS = [
  'UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE',
  'DELETE_SKIPPED', 'UPDATE_ROLLBACK_COMPLETE', 'ROLLBACK_COMPLETE',
];
export const CNF_ERROR_STATUS = [
  'CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED',
  'UPDATE_ROLLBACK_FAILED', 'ROLLBACK_FAILED',
];

type ItemPayload = {
  LogicalResourceId: string,
  ResourceType: string,
  ResourceStatus: string,
  Timestamp: string,
}

/**
 * Custom item formatter for progress bar
 */
export const createItemFormatter = (payload: ItemPayload) : { renderString: string, color: string } => {
  let color = '';
  const e = [{
    logicalResourceId: payload.LogicalResourceId,
    resourceType: payload.ResourceType,
    resourceStatus: payload.ResourceStatus,
    timeStamp: (new Date(payload.Timestamp)).toString(),
  }];

  const renderString = columnify(e, {
    showHeaders: false,
    truncate: true,
    maxWidth: COLUMNIFY_WIDTH,
    minWidth: COLUMNIFY_WIDTH,
  });

  if (CFN_SUCCESS_STATUS.includes(payload.ResourceStatus)) {
    color = 'green';
  }
  if (CNF_ERROR_STATUS.includes(payload.ResourceStatus)) {
    color = 'red';
  }
  return { renderString, color };
};

type ProgressPayload = {
  progressName: string,
  envName: string
}

/**
 * Event map type
 */
export type EventMap = {
  rootStackName: string,
  envName: string,
  projectName: string,
  rootResources: {key: string, category: string}[],
  eventToCategories: Map<string, string>,
  categories: {name: string, size: number}[]
}

/**
 * Custom progress bar formatter
 */
export const createProgressBarFormatter = (payload : ProgressPayload,
  value: number,
  total: number) : string => {
  let statusString = 'Deploying';
  const progressNameParts = payload.progressName.split('-');
  const name = progressNameParts.length === 1 ? progressNameParts[0] : `${progressNameParts[0]} ${progressNameParts[1]}`;
  if (total === value) {
    statusString = 'Deployed';
  }
  return `${statusString} ${name}`;
};
