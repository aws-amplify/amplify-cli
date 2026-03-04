export type SigninIdentifier = 'email' | 'phone' | 'username';

export type SignupAttribute = 'email' | 'phone' | 'username';

export interface AmplifyConfig {
  aws_user_pools_id?: string;
  aws_user_pools_web_client_id?: string;
  aws_cognito_region?: string;
  aws_cognito_username_attributes?: string[];
  aws_cognito_signup_attributes?: string[];
}

export interface TestUser {
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
}

// Re-export runner and signup for backwards compatibility
export { TestRunner, type TestFailure } from './runner';
export { provisionTestUser } from './signup';
