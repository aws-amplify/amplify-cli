import { Context } from '../../domain/context';
import { scan } from '../../plugin-manager';

export async function run(context: Context) {
  await scan();
}
