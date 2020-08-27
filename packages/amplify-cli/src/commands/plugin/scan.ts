import { Context } from '../../domain/context';
import { scan } from '../../plugin-manager';

export const run = async (context: Context) => {
  await scan();
};
