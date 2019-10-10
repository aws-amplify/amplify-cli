const xrManager = require('../../lib/xr-manager');

describe('xrManager', () => {
  const mockContextWithXR = {
    amplify: {
      removeResource: jest.fn(),
    },
    exeInfo: {
      amplifyMeta: {
        xr: {
          scene1: {},
          scene2: {},
        },
      },
    },
  };

  const mockContextWithoutXR = {
    exeInfo: {
      amplifyMeta: {},
    },
  };

  describe('isXRSetup', () => {
    it('should return true when xr is configured in amplifyMeta', () => {
      expect(xrManager.isXRSetup(mockContextWithXR)).toBeTruthy();
    });

    it('should return false when xr is configured in amplifyMeta', () => {
      expect(xrManager.isXRSetup(mockContextWithoutXR)).toBeFalsy();
    });
  });

  describe('getExistingScenes', () => {
    it('should return a list of scene resoureces', () => {
      const existingScenes = xrManager.getExistingScenes(mockContextWithXR);
      expect(existingScenes).toHaveLength(2);
      expect(existingScenes).toContain('scene1');
      expect(existingScenes).toContain('scene2');
    });

    it('should return an empty list if xr is not configured', () => {
      const existingScenes = xrManager.getExistingScenes(mockContextWithoutXR);
      expect(existingScenes).toHaveLength(0);
      expect(existingScenes).toEqual([]);
    });
  });
});
