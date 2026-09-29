import { Amplify } from 'aws-amplify';

export const NUTRITION_API_NAME = 'nutritionapi';
export const ADMIN_API_NAME = 'adminapi';

export function configureAmplify(config: any): void {
  Amplify.configure(config);
}
