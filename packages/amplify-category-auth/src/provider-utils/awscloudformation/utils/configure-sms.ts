import { AttributeType, CognitoConfiguration } from 'amplify-cli-core';
import { CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';

/**
 * checks whether sms options in enabled in cognito
 */
export const configureSmsOption = (props: CognitoConfiguration | CognitoStackOptions): boolean | undefined =>
  props.autoVerifiedAttributes?.includes('phone_number') ||
  (props.mfaConfiguration !== 'OFF' && props.mfaTypes?.includes('SMS Text Message')) ||
  props.requiredAttributes?.includes('phone_number') ||
  props.usernameAttributes?.includes(AttributeType.PHONE_NUMBER);
