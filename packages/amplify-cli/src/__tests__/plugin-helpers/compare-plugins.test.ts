import * as path from 'path';
import { PluginManifest, PluginInfo } from 'amplify-cli-core';
import { twoPluginsAreTheSame } from '../../plugin-helpers/compare-plugins';

describe('compare-plugins', () => {
  describe('twoPluginsAreTheSame', () => {
    it('returns true when packageLocation is same', () => {
      const p1 = new PluginInfo(
        'amplify-util-plugin',
        '1.0.0',
        path.join('path', 'to', 'package@1.0.0'),
        new PluginManifest('util-plugin', 'util'),
      );
      const p2 = new PluginInfo(
        'amplify-util-plugin',
        '1.0.0',
        path.join('path', 'to', 'package@1.0.0'),
        new PluginManifest('util-plugin', 'util'),
      );
      expect(twoPluginsAreTheSame(p1, p2)).toBe(true);
    });

    it('returns true when both packageName and packageVersion is same', () => {
      const p1 = new PluginInfo(
        'amplify-util-plugin',
        '1.0.0',
        path.join('path', 'to', 'package1'),
        new PluginManifest('util-plugin', 'util'),
      );
      const p2 = new PluginInfo(
        'amplify-util-plugin',
        '1.0.0',
        path.join('path', 'to', 'package2'),
        new PluginManifest('util-plugin', 'util'),
      );
      expect(twoPluginsAreTheSame(p1, p2)).toBe(true);
    });

    it('returns false when packageLocation, packageName and packageVersion is not same', () => {
      const p1 = new PluginInfo(
        'amplify-util-plugin',
        '1.0.0',
        path.join('path', 'to', 'package1'),
        new PluginManifest('util-plugin', 'util'),
      );
      const p2 = new PluginInfo(
        'amplify-util-plugin',
        '2.0.0',
        path.join('path', 'to', 'package2'),
        new PluginManifest('util-plugin', 'util'),
      );
      expect(twoPluginsAreTheSame(p1, p2)).toBe(false);
    });
  });
});
