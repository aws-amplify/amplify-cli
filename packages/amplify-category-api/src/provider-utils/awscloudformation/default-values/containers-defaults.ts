import { v4 as uuid } from 'uuid';

export const getAllDefaults = () => {
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `container${shortId}`,
  };

  return defaults;
};
