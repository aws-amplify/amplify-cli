import Context from '../../domain/context';
import { scan as pluginManagerScan } from '../../plugin-manager';

export async function run(context: Context) {
  await pluginManagerScan();
}
