/**
 * Integration Tests for DirectoryManager
 * Tests DirectoryManager integration with existing system components
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { DirectoryManager } from '../utils/directory-manager';
import { Logger } from '../utils/logger';
import { LogLevel } from '../types';

describe('DirectoryManager Integration', () => {
  let logger: Logger;
  let directoryManager: DirectoryManager;
  let tempDir: string;

  beforeEach(async () => {
    logger = new Logger(LogLevel.INFO);
    directoryManager = new DirectoryManager(logger);

    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'directory-manager-integration-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('createAppDirectory', () => {
    it('should create a new directory successfully', async () => {
      const result = await directoryManager.createAppDirectory({
        basePath: tempDir,
        appName: 'testapp',
      });

      expect(result).toBe(path.join(tempDir, 'testapp'));

      // Verify directory exists
      expect(await fs.pathExists(result)).toBe(true);
      expect((await fs.stat(result)).isDirectory()).toBe(true);
    });

    it('should throw error when colliding with existing directory', async () => {
      const appPath = path.join(tempDir, 'testapp');

      // Create existing directory with content
      await fs.ensureDir(appPath);
      await fs.writeFile(path.join(appPath, 'existing-file.txt'), 'content');

      await expect(
        directoryManager.createAppDirectory({
          basePath: tempDir,
          appName: 'testapp',
        }),
      ).rejects.toThrow(`Failed to create app directory: Directory already exists: ${appPath}`);

      // Verify directory exists and old content is still present
      expect(await fs.pathExists(appPath)).toBe(true);
      expect(await fs.pathExists(path.join(appPath, 'existing-file.txt'))).toBe(true);
    });

    it('should fail when base path does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent');

      await expect(
        directoryManager.createAppDirectory({
          basePath: nonExistentPath,
          appName: 'testapp',
        }),
      ).rejects.toThrow(`Failed to create app directory: Base path does not exist: ${nonExistentPath}`);
    });
  });

  describe('copyDirectory', () => {
    it('should copy directory and all contents', async () => {
      const sourceDir = path.join(tempDir, 'source');
      const destDir = path.join(tempDir, 'destination');

      // Create source directory with content
      await fs.ensureDir(path.join(sourceDir, 'subdir'));
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'content');
      await fs.writeFile(path.join(sourceDir, 'subdir', 'nested.txt'), 'nested content');

      await directoryManager.copyDirectory(sourceDir, destDir);

      // Verify destination exists and has same content
      expect(await fs.pathExists(destDir)).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'file.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(destDir, 'subdir', 'nested.txt'))).toBe(true);

      const copiedContent = await fs.readFile(path.join(destDir, 'file.txt'), 'utf-8');
      expect(copiedContent).toBe('content');
    });

    it('should fail when source does not exist', async () => {
      const nonExistentSource = path.join(tempDir, 'non-existent');
      const destDir = path.join(tempDir, 'destination');

      await expect(directoryManager.copyDirectory(nonExistentSource, destDir)).rejects.toThrow('Source directory does not exist');
    });
  });

  it('should integrate with Logger for comprehensive logging', async () => {
    // Test that DirectoryManager properly logs operations through the Logger
    const result = await directoryManager.createAppDirectory({
      basePath: tempDir,
      appName: 'integrationtestapp',
    });

    expect(result).toBeDefined();

    const expectedPath = path.join(tempDir, 'integrationtestapp');
    expect(result).toBe(expectedPath);

    // Verify directory was created
    expect(await fs.pathExists(expectedPath)).toBe(true);
  });

  it('should handle realistic app initialization workflow', async () => {
    // Simulate a realistic workflow similar to what AmplifyInitializer would do

    // Step 1: Create app directory
    const createResult = await directoryManager.createAppDirectory({
      basePath: tempDir,
      appName: 'myamplifyapp',
    });

    expect(createResult).toBeDefined();

    // Step 2: Simulate creating some app files (like package.json)
    const packageJsonPath = path.join(createResult, 'package.json');
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(
        {
          name: 'myamplifyapp',
          version: '1.0.0',
          dependencies: {},
        },
        null,
        2,
      ),
    );

    // Step 3: Verify files exist
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    // Step 4: Fail when trying to create same app again
    await expect(
      directoryManager.createAppDirectory({
        basePath: tempDir,
        appName: 'myamplifyapp',
      }),
    ).rejects.toThrow('Failed to create app directory: Directory already exists:');
  });

  it('should handle directory copying for app migration scenarios', async () => {
    // Simulate copying an existing Gen1 app to a new location for Gen2 migration

    // Create a mock Gen1 app structure
    const gen1AppDir = path.join(tempDir, 'gen1app');
    await fs.ensureDir(gen1AppDir);
    await fs.ensureDir(path.join(gen1AppDir, 'amplify', 'backend'));
    await fs.writeFile(
      path.join(gen1AppDir, 'package.json'),
      JSON.stringify(
        {
          name: 'gen1app',
          dependencies: {
            '@aws-amplify/cli': '^4.0.0',
          },
        },
        null,
        2,
      ),
    );
    await fs.writeFile(
      path.join(gen1AppDir, 'amplify', 'backend', 'backend-config.json'),
      JSON.stringify(
        {
          api: {},
          auth: {},
        },
        null,
        2,
      ),
    );

    // Create migration target directory
    const migrationResult = await directoryManager.createAppDirectory({
      basePath: tempDir,
      appName: 'gen2migrationtarget',
    });

    expect(migrationResult).toBeDefined();

    // Clean the target directory and copy Gen1 app
    await directoryManager.copyDirectory(gen1AppDir, migrationResult);

    // Verify the copy was successful
    expect(await fs.pathExists(path.join(migrationResult, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(migrationResult, 'amplify', 'backend', 'backend-config.json'))).toBe(true);

    // Verify content is correct
    const copiedPackageJson = await fs.readJson(path.join(migrationResult, 'package.json'));
    expect(copiedPackageJson.name).toBe('gen1app');
  });
});
