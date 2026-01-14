/**
 * AWS Profile Manager
 * Manages AWS credentials and config files for named profiles
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { IAWSProfileManager, AWSProfileData, AWSCredentials, ILogger } from '../interfaces';
import { LogContext } from '../types';

type IniSections = Record<string, Record<string, string>>;

export class AWSProfileManager implements IAWSProfileManager {
  private readonly credentialsPath: string;
  private readonly configPath: string;

  constructor(private readonly logger: ILogger, homeDir?: string) {
    const home = homeDir || os.homedir();
    this.credentialsPath = path.join(home, '.aws', 'credentials');
    this.configPath = path.join(home, '.aws', 'config');
  }

  async writeProfile(profileName: string, profileData: AWSProfileData): Promise<void> {
    const context: LogContext = { operation: 'writeProfile' };
    this.logger.debug(`Writing profile: ${profileName}`, context);

    await this.ensureAwsDirectory();

    // Write credentials file
    await this.writeCredentialsFile(profileName, profileData.credentials);

    // Write config file
    await this.writeConfigFile(profileName, profileData.region);

    this.logger.info(`Successfully wrote profile: ${profileName}`, context);
  }

  async removeProfile(profileName: string): Promise<void> {
    const context: LogContext = { operation: 'removeProfile' };
    this.logger.debug(`Removing profile: ${profileName}`, context);

    // Remove from credentials file
    await this.removeFromCredentialsFile(profileName);

    // Remove from config file
    await this.removeFromConfigFile(profileName);

    this.logger.info(`Successfully removed profile: ${profileName}`, context);
  }

  async profileExists(profileName: string): Promise<boolean> {
    const context: LogContext = { operation: 'profileExists' };
    this.logger.debug(`Checking if profile exists: ${profileName}`, context);

    if (!(await fs.pathExists(this.credentialsPath))) {
      return false;
    }

    const content = await fs.readFile(this.credentialsPath, 'utf-8');
    const sections = this.parseIniFile(content);

    return profileName in sections;
  }

  async readProfile(profileName: string): Promise<AWSProfileData | null> {
    const context: LogContext = { operation: 'readProfile' };
    this.logger.debug(`Reading profile: ${profileName}`, context);

    // Read credentials
    const credentials = await this.readCredentials(profileName);
    if (!credentials) {
      return null;
    }

    // Read region from config
    const region = await this.readRegion(profileName);
    if (!region) {
      return null;
    }

    return {
      credentials,
      region,
    };
  }

  private async ensureAwsDirectory(): Promise<void> {
    const awsDir = path.dirname(this.credentialsPath);
    if (!(await fs.pathExists(awsDir))) {
      await fs.mkdir(awsDir, { recursive: true, mode: 0o700 });
    }
  }

  private async writeCredentialsFile(profileName: string, credentials: AWSCredentials): Promise<void> {
    const context: LogContext = { operation: 'writeCredentialsFile' };

    let sections: IniSections = {};

    if (await fs.pathExists(this.credentialsPath)) {
      const content = await fs.readFile(this.credentialsPath, 'utf-8');
      sections = this.parseIniFile(content);
    }

    // Add or update the profile section
    sections[profileName] = {
      aws_access_key_id: credentials.accessKeyId,
      aws_secret_access_key: credentials.secretAccessKey,
    };

    if (credentials.sessionToken) {
      sections[profileName].aws_session_token = credentials.sessionToken;
    }

    const serialized = this.serializeIniFile(sections);
    await this.writeFileWithPermissions(this.credentialsPath, serialized);

    this.logger.debug(`Wrote credentials for profile: ${profileName}`, context);
  }

  private async writeConfigFile(profileName: string, region: string): Promise<void> {
    const context: LogContext = { operation: 'writeConfigFile' };

    let sections: IniSections = {};

    if (await fs.pathExists(this.configPath)) {
      const content = await fs.readFile(this.configPath, 'utf-8');
      sections = this.parseIniFile(content);
    }

    // Config file uses "profile <name>" format for non-default profiles
    const sectionName = profileName === 'default' ? 'default' : `profile ${profileName}`;

    sections[sectionName] = {
      region,
    };

    const serialized = this.serializeIniFile(sections);
    await this.writeFileWithPermissions(this.configPath, serialized);

    this.logger.debug(`Wrote config for profile: ${profileName}`, context);
  }

  private async removeFromCredentialsFile(profileName: string): Promise<void> {
    const context: LogContext = { operation: 'removeFromCredentialsFile' };

    if (!(await fs.pathExists(this.credentialsPath))) {
      this.logger.debug('Credentials file does not exist, nothing to remove', context);
      return;
    }

    const content = await fs.readFile(this.credentialsPath, 'utf-8');
    const sections = this.parseIniFile(content);

    if (!(profileName in sections)) {
      this.logger.debug(`Profile ${profileName} not found in credentials file`, context);
      return;
    }

    delete sections[profileName];

    const serialized = this.serializeIniFile(sections);
    await this.writeFileWithPermissions(this.credentialsPath, serialized);

    this.logger.debug(`Removed profile ${profileName} from credentials file`, context);
  }

  private async removeFromConfigFile(profileName: string): Promise<void> {
    const context: LogContext = { operation: 'removeFromConfigFile' };

    if (!(await fs.pathExists(this.configPath))) {
      this.logger.debug('Config file does not exist, nothing to remove', context);
      return;
    }

    const content = await fs.readFile(this.configPath, 'utf-8');
    const sections = this.parseIniFile(content);

    // Config file uses "profile <name>" format for non-default profiles
    const sectionName = profileName === 'default' ? 'default' : `profile ${profileName}`;

    if (!(sectionName in sections)) {
      this.logger.debug(`Profile ${profileName} not found in config file`, context);
      return;
    }

    delete sections[sectionName];

    const serialized = this.serializeIniFile(sections);
    await this.writeFileWithPermissions(this.configPath, serialized);

    this.logger.debug(`Removed profile ${profileName} from config file`, context);
  }

  private async readCredentials(profileName: string): Promise<AWSCredentials | null> {
    if (!(await fs.pathExists(this.credentialsPath))) {
      return null;
    }

    const content = await fs.readFile(this.credentialsPath, 'utf-8');
    const sections = this.parseIniFile(content);

    if (!(profileName in sections)) {
      return null;
    }

    const section = sections[profileName];
    const accessKeyId = section.aws_access_key_id;
    const secretAccessKey = section.aws_secret_access_key;

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      accessKeyId,
      secretAccessKey,
      sessionToken: section.aws_session_token,
    };
  }

  private async readRegion(profileName: string): Promise<string | null> {
    if (!(await fs.pathExists(this.configPath))) {
      return null;
    }

    const content = await fs.readFile(this.configPath, 'utf-8');
    const sections = this.parseIniFile(content);

    // Config file uses "profile <name>" format for non-default profiles
    const sectionName = profileName === 'default' ? 'default' : `profile ${profileName}`;

    if (!(sectionName in sections)) {
      return null;
    }

    return sections[sectionName].region || null;
  }

  private async writeFileWithPermissions(filePath: string, content: string): Promise<void> {
    const fileExists = await fs.pathExists(filePath);

    await fs.writeFile(filePath, content, 'utf-8');

    // Set file permissions to 600 (owner read/write only)
    if (!fileExists) {
      await fs.chmod(filePath, 0o600);
    }
  }

  /**
   * Parses an INI file content into sections
   * Handles both credentials format [profile] and config format [profile name]
   */
  parseIniFile(content: string): IniSections {
    const sections: IniSections = {};
    let currentSection: string | null = null;

    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith(';')) {
        continue;
      }

      // Check for section header
      const sectionMatch = trimmedLine.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        if (!(currentSection in sections)) {
          sections[currentSection] = {};
        }
        continue;
      }

      // Parse key-value pair
      if (currentSection) {
        const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (keyValueMatch) {
          const key = keyValueMatch[1].trim();
          const value = keyValueMatch[2].trim();
          sections[currentSection][key] = value;
        }
      }
    }

    return sections;
  }

  /**
   * Serializes sections back to INI file format
   */
  serializeIniFile(sections: IniSections): string {
    const lines: string[] = [];

    for (const [sectionName, sectionData] of Object.entries(sections)) {
      lines.push(`[${sectionName}]`);

      for (const [key, value] of Object.entries(sectionData)) {
        lines.push(`${key} = ${value}`);
      }

      lines.push(''); // Empty line between sections
    }

    return lines.join('\n');
  }
}
