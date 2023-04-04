import { $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
import { console } from '../../index';

/**
 * Open the AWS console for Analytics resource
 */
export const run = async (context: $TSContext): Promise<$TSAny> => console(context);
export const name = 'console';
