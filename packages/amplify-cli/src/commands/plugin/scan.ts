import { Context } from '../../domain/context';
import { scan } from '../../plugin-manager';

export const run = async (_: Context) => {
  await scan();
};
