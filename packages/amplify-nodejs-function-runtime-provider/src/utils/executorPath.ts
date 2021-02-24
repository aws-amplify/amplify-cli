import * as path from 'path';

// This value is exported in it's own module so that it can be easily mocked in tests
export const executorPath = path.join(__dirname, 'execute.js');
