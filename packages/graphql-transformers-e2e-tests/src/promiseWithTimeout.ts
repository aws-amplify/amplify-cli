export async function withTimeOut<T>(
  promiseToWait: Promise<T>,
  timeout: number,
  timeoutMessage?: string,
  cleanupFn?: () => void,
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(async () => {
      if (cleanupFn) {
        await cleanupFn();
      }
      reject(new Error(timeoutMessage || 'Waiting timed out'));
    }, timeout);
  });
  return Promise.race([promiseToWait, timeoutPromise]);
}
