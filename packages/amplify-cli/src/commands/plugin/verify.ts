import { Context } from '../../domain/context';
import { verifyPlugin } from '../../plugin-manager';

export const run = async (context: Context) => {
  context.print.warning('Run this command at the root directory of the plugin package.');
  const verificationResult = await verifyPlugin(process.cwd());
  if (verificationResult.verified) {
    context.print.success('The current directory is verified to be a valid Amplify CLI plugin package.');
    context.print.info('');
  } else {
    context.print.error('The current directory failed Amplify CLI plugin verification.');
    context.print.info(`Error code: ${verificationResult.error}`);
    context.print.info('');
  }
};
