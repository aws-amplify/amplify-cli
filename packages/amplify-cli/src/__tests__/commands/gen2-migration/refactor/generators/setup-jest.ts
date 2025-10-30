import { expect } from '@jest/globals';
import { toBeACloudFormationCommand } from './custom-test-matchers';

expect.extend({
  toBeACloudFormationCommand,
});
