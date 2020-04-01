import { setupAWSProfile } from './profile-helper';

process.nextTick(() => {
  try {
    setupAWSProfile();
  } catch (e) {
    console.log(e.stack);
    process.exit(1);
  }
});
