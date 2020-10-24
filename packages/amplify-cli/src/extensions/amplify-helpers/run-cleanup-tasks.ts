import { Context } from '../../domain/context';

export async function runCleanUpTasks(context: Context) {
  const listOfTasks = context.amplify.getCleanUpTasks();
  const promises = listOfTasks.map(fn => fn(context));
  await Promise.all(promises);
}
