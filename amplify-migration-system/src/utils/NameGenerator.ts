/**
 * Name generation utilities for the Amplify Migration System
 */

import { v4 as uuidv4 } from 'uuid';
import { INameGenerator, ILogger } from '../interfaces';

export class NameGenerator implements INameGenerator {
  private readonly maxNameLength = 128;
  private readonly validNamePattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/;

  constructor(private readonly logger: ILogger) {}

  generateAppName(baseName: string): string {
    // Generate a unique suffix using timestamp and random string
    const timestamp = Date.now().toString(36);
    const randomSuffix = this.generateRandomString(6);
    const uniqueSuffix = `${timestamp}-${randomSuffix}`;

    // Sanitize base name
    const sanitizedBase = this.sanitizeName(baseName);

    // Combine base name with unique suffix
    const fullName = `${sanitizedBase}-${uniqueSuffix}`;

    // Ensure name doesn't exceed max length
    const truncatedName = this.truncateName(fullName, this.maxNameLength);

    this.logger.debug(`Generated app name: ${truncatedName} from base: ${baseName}`);

    return truncatedName;
  }

  generateResourceName(resourceType: string, appName: string): string {
    const sanitizedType = this.sanitizeName(resourceType);
    const sanitizedApp = this.sanitizeName(appName);
    const randomSuffix = this.generateRandomString(4);

    const resourceName = `${sanitizedApp}-${sanitizedType}-${randomSuffix}`;
    const truncatedName = this.truncateName(resourceName, this.maxNameLength);

    this.logger.debug(`Generated resource name: ${truncatedName} for type: ${resourceType}`);

    return truncatedName;
  }

  validateAppName(name: string): boolean {
    if (!name || name.length === 0) {
      this.logger.warn('App name is empty');
      return false;
    }

    if (name.length > this.maxNameLength) {
      this.logger.warn(`App name exceeds max length: ${name.length} > ${this.maxNameLength}`);
      return false;
    }

    if (!this.validNamePattern.test(name)) {
      this.logger.warn(`App name contains invalid characters: ${name}`);
      return false;
    }

    return true;
  }

  ensureUniqueName(baseName: string, existingNames: string[]): string {
    let uniqueName = baseName;
    let counter = 1;

    while (existingNames.includes(uniqueName)) {
      uniqueName = `${baseName}-${counter}`;
      counter++;
    }

    if (uniqueName !== baseName) {
      this.logger.debug(`Ensured unique name: ${uniqueName} (original: ${baseName})`);
    }

    return uniqueName;
  }

  generateUniqueId(): string {
    return uuidv4();
  }

  generateShortId(length = 8): string {
    const uuid = uuidv4().replace(/-/g, '');
    return uuid.substring(0, length);
  }

  private sanitizeName(name: string): string {
    // Remove invalid characters and replace with hyphens
    let sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/^[^a-z]+/, '') // Ensure starts with letter
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Ensure name starts with a letter
    if (!/^[a-z]/.test(sanitized)) {
      sanitized = `a${sanitized}`;
    }

    return sanitized;
  }

  private truncateName(name: string, maxLength: number): string {
    if (name.length <= maxLength) {
      return name;
    }

    // Truncate and ensure it doesn't end with a hyphen
    let truncated = name.substring(0, maxLength);
    while (truncated.endsWith('-') && truncated.length > 0) {
      truncated = truncated.substring(0, truncated.length - 1);
    }

    return truncated;
  }

  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    return result;
  }

  generateStackName(appName: string, environment: string): string {
    const sanitizedApp = this.sanitizeName(appName);
    const sanitizedEnv = this.sanitizeName(environment);

    return `${sanitizedApp}-${sanitizedEnv}-stack`;
  }

  generateBucketName(appName: string, purpose: string): string {
    const sanitizedApp = this.sanitizeName(appName);
    const sanitizedPurpose = this.sanitizeName(purpose);
    const randomSuffix = this.generateRandomString(8);

    // S3 bucket names have specific requirements
    const bucketName = `${sanitizedApp}-${sanitizedPurpose}-${randomSuffix}`.toLowerCase().replace(/_/g, '-'); // Replace underscores with hyphens for S3

    return this.truncateName(bucketName, 63); // S3 bucket name max length
  }

  generateFunctionName(appName: string, functionPurpose: string): string {
    const sanitizedApp = this.sanitizeName(appName);
    const sanitizedPurpose = this.sanitizeName(functionPurpose);

    return `${sanitizedApp}-${sanitizedPurpose}`;
  }

  generateTableName(appName: string, modelName: string): string {
    const sanitizedApp = this.sanitizeName(appName);
    const sanitizedModel = this.sanitizeName(modelName);

    return `${sanitizedApp}-${sanitizedModel}`;
  }
}
