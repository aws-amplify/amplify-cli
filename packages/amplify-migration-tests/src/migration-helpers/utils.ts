import { v4 as uuid } from 'uuid';

/**
 * generates a random string
 */
export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};
