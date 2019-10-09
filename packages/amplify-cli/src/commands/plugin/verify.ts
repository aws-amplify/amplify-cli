import { Context } from '../../domain/context';
import { verifyPlugin } from '../../plugin-manager';

export async function run(context: Context) {
  context.print.warning('Run this command at the root directory of the plugin package.');
  const verificatonResult = await verifyPlugin(process.cwd());
  if (verificatonResult.verified) {
    context.print.success('The current directory is verified to be a valid Amplify CLI plugin package.');
    context.print.info('');
  } else {
    context.print.error('The current directory faied Amplify CLI plugin verification.');
    context.print.info(`Error code: ${verificatonResult.error}`);
    context.print.info('');
  }
}
