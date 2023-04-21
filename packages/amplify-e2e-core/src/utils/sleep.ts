/**
 * "Sleep" for the specified number of milliseconds
 */
export const sleep = async (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));
