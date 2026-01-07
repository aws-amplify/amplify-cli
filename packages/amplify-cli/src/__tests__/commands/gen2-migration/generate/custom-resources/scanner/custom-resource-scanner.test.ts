import { CustomResourceScanner } from '../../../../../../commands/gen2-migration/generate/custom-resources/scanner/custom-resource-scanner';
import * as fs from 'fs-extra';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CustomResourceScanner', () => {
  let scanner: CustomResourceScanner;

  beforeAll(() => {
    scanner = new CustomResourceScanner();
  });

  it('should return empty array when custom directory does not exist', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-test-'));
    try {
      const resources = await scanner.scanCustomResources(tempDir);
      expect(resources).toEqual([]);
    } finally {
      await fs.remove(tempDir);
    }
  });

  it('should find custom resources with cdk-stack.ts', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-test-'));
    try {
      const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');
      const notificationsDir = path.join(customDir, 'notifications');

      await fsPromises.mkdir(customDir, { recursive: true });
      await fsPromises.mkdir(notificationsDir, { recursive: true });
      await fsPromises.writeFile(path.join(notificationsDir, 'cdk-stack.ts'), '// CDK stack');

      const resources = await scanner.scanCustomResources(tempDir);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('notifications');
      expect(resources[0].cdkStackPath).toContain('cdk-stack.ts');
    } finally {
      await fs.remove(tempDir);
    }
  });

  it('should find multiple custom resources', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-test-'));
    try {
      const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');

      await fsPromises.mkdir(customDir, { recursive: true });
      await fsPromises.mkdir(path.join(customDir, 'notifications'), { recursive: true });
      await fsPromises.mkdir(path.join(customDir, 'analytics'), { recursive: true });
      await fsPromises.writeFile(path.join(customDir, 'notifications', 'cdk-stack.ts'), '// CDK stack');
      await fsPromises.writeFile(path.join(customDir, 'analytics', 'cdk-stack.ts'), '// CDK stack');

      const resources = await scanner.scanCustomResources(tempDir);

      expect(resources).toHaveLength(2);
      expect(resources.map((r) => r.name).sort()).toEqual(['analytics', 'notifications']);
    } finally {
      await fs.remove(tempDir);
    }
  });

  it('should ignore directories without cdk-stack.ts', async () => {
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'amplify-test-'));
    try {
      const customDir = path.join(tempDir, 'amplify', 'backend', 'custom');

      await fsPromises.mkdir(customDir, { recursive: true });
      await fsPromises.mkdir(path.join(customDir, 'notifications'), { recursive: true });
      await fsPromises.mkdir(path.join(customDir, 'other'), { recursive: true });
      await fsPromises.writeFile(path.join(customDir, 'notifications', 'cdk-stack.ts'), '// CDK stack');

      const resources = await scanner.scanCustomResources(tempDir);

      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('notifications');
    } finally {
      await fs.remove(tempDir);
    }
  });
});
