import Ajv, { AdditionalPropertiesParams } from 'ajv';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { CLIEnvironmentProvider, JSONUtilities, JSONValidationError } from '..';
import { FeatureFlagConfiguration, FeatureFlagRegistration, FeatureFlagsEntry, FeatureFlagType } from '.';
import { amplifyConfigFileName, amplifyConfigEnvFileNameTemplate } from '../constants';
import { FeatureFlagFileProvider } from './featureFlagFileProvider';
import { FeatureFlagEnvironmentProvider } from './featureFlagEnvironmentProvider';

export class FeatureFlags {
  private static instance: FeatureFlags;

  private readonly registrations: Map<string, FeatureFlagRegistration[]> = new Map();
  private effectiveFlags: Readonly<FeatureFlagsEntry> = {};
  private newProjectDefaults: Readonly<FeatureFlagsEntry> = {};
  private existingProjectDefaults: Readonly<FeatureFlagsEntry> = {};

  private constructor(private environmentProvider: CLIEnvironmentProvider, private projectPath: string) {}

  public static initialize = async (environmentProvider: CLIEnvironmentProvider, projectPath: string): Promise<void> => {
    // If we are not running by tests, guard against multiple calls to initialize invocations
    if (typeof jest === 'undefined' && FeatureFlags.instance) {
      throw new Error('FeatureFlags can only be initialzied once');
    }

    if (!environmentProvider) {
      throw new Error(`'environmentProvider' argument is required`);
    }

    if (!projectPath) {
      throw new Error(`'projectPath' argument is required`);
    }

    if (!(await fs.pathExists(projectPath))) {
      throw new Error(`Project path: '${projectPath}' does not exist.`);
    }

    const instance = new FeatureFlags(environmentProvider, projectPath);

    // Populate registrations here, later this can be coming from plugins' manifests
    instance.registerFlags();

    // Create the providers
    const fileValueProvider = new FeatureFlagFileProvider(environmentProvider, {
      projectPath,
    });
    const envValueProvider = new FeatureFlagEnvironmentProvider({
      projectPath,
    });

    // Load the flags from all providers
    const fileFlags = await fileValueProvider.load();
    const envFlags = instance.transformEnvFlags(await envValueProvider.load());

    // Validate the loaded flags from all providers
    instance.validateFlags([
      {
        name: 'File',
        flags: fileFlags,
      },
      {
        name: 'Environment',
        flags: envFlags,
      },
    ]);

    // Build default value objects from registrations
    instance.buildDefaultValues();

    //
    // To make access easy, we are unfolding the values from the providers, dot notation based key value pairs.
    // Example: 'graphqltransformer.transformerversion': 5
    //
    // top to bottom the following order is used:
    // - file project level
    // - file env level
    // - environment project level
    // - environment env level
    //
    // The sections, properties and values are verified against the dynamically built up json schema
    //

    instance.effectiveFlags = _.merge(
      {},
      fileFlags.project,
      fileFlags.environments[environmentProvider.getCurrentEnvName()] ?? {},
      envFlags.project,
      envFlags.environments[environmentProvider.getCurrentEnvName()] ?? {},
    );

    FeatureFlags.instance = instance;
  };

  /**
   * This method reads the project configuration file if exist and adds the features section based on the default feature flags file.
   * If the configuration file does not exist it will be created with the default features. If the configuration file exists and already has a
   * features section it will be preserved and will not be overwritten.
   *
   * @param newProject True if settings for new projects requested or false if default for existing project are requested
   */
  public static ensureDefaultFeatureFlags = async (newProject: boolean): Promise<void> => {
    FeatureFlags.ensureInitialized();

    const configFileName = path.join(FeatureFlags.instance.projectPath, amplifyConfigFileName);

    let config = JSONUtilities.readJson<{ [key: string]: any }>(configFileName, {
      throwIfNotExist: false,
      preserveComments: true,
    });

    // If no configuration file or configuration file exists but does not have a features property create it and overwrite the file
    if (!config || !config.features) {
      config = {
        ...(config ?? {}), // to fix 'Spread types may only be created from object types.(2698)' warning
        features: newProject ? FeatureFlags.getNewProjectDefaults() : FeatureFlags.getExistingProjectDefaults(),
      };

      JSONUtilities.writeJson(configFileName, config, {
        keepComments: true,
      });
    }
  };

  public static getBoolean = (flagName: string): boolean => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.getValue<boolean>(flagName, 'boolean');
  };

  public static getString = (flagName: string): string => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.getValue<string>(flagName, 'string');
  };

  public static getNumber = (flagName: string): number => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.getValue<number>(flagName, 'number');
  };

  public static getEffectiveFlags = (): Readonly<FeatureFlagsEntry> => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.effectiveFlags;
  };

  public static getNewProjectDefaults = (): Readonly<FeatureFlagsEntry> => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.newProjectDefaults;
  };

  public static getExistingProjectDefaults = (): Readonly<FeatureFlagsEntry> => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.existingProjectDefaults;
  };

  public static removeFeatureFlagConfiguration = async (removeProjectConfiguration: boolean, envNames: string[]) => {
    FeatureFlags.ensureInitialized();

    if (!envNames) {
      throw new Error(`'envNames' argument is required`);
    }

    if (removeProjectConfiguration) {
      const configFileName = path.join(FeatureFlags.instance.projectPath, amplifyConfigFileName);

      await fs.remove(configFileName);
    }

    for (let envName of envNames) {
      const configFileName = path.join(FeatureFlags.instance.projectPath, amplifyConfigEnvFileNameTemplate(envName));

      await fs.remove(configFileName);
    }
  };

  public static isInitialized = (): boolean => {
    return FeatureFlags.instance !== undefined;
  };

  private static ensureInitialized = (): void => {
    if (!FeatureFlags.instance) {
      throw new Error('FeatureFlags is not initialized');
    }
  };

  private getValue = <T extends boolean | number | string>(flagName: string, type: FeatureFlagType): T => {
    if (!flagName) {
      throw new Error(`'flagName' argument is required`);
    }

    let value: T | undefined;
    const parts = flagName.toLowerCase().split('.');

    if (parts.length !== 2) {
      throw new Error(`Invalid flagName value: '${flagName}'`);
    }

    // Get registration
    const sectionRegistration = this.registrations.get(parts[0]);

    if (!sectionRegistration) {
      throw new Error(`Section '${parts[0]}' is not registered in feature provider`);
    }

    const flagRegistrationEntry = sectionRegistration.find(flag => flag.name === parts[1]);

    if (!flagRegistrationEntry) {
      throw new Error(`Flag '${parts[1]}' within '${parts[0]}' is not registered in feature provider`);
    }

    if (flagRegistrationEntry.type !== type) {
      throw new Error(`'${flagName}' is a ${flagRegistrationEntry.type} type, not ${type}`);
    }

    // Check if effective values has a value for the requested flag
    if (this.effectiveFlags[parts[0]] && this.effectiveFlags[parts[0]][parts[1]]) {
      value = <T>this.effectiveFlags[parts[0]][parts[1]];
    }

    // If there is no value, return the registered defaults for existing projects
    if (!value) {
      value = <T>(flagRegistrationEntry.defaultValueForExistingProjects as unknown);
    }

    return value;
  };

  private buildJSONSchemaFromRegistrations = () => {
    return [...this.registrations.entries()].reduce<JSONSchema7>(
      (s: JSONSchema7, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        const currentSection = <JSONSchema7>(s.properties![r[0].toLowerCase()] ?? {
          type: 'object',
          additionalProperties: false,
        });

        currentSection.properties = r[1].reduce<{ [key: string]: JSONSchema7Definition }>((p, fr) => {
          p![fr.name.toLowerCase()] = {
            type: fr.type,
            default: fr.defaultValueForNewProjects,
          };

          return p;
        }, {});

        s.properties![r[0].toLowerCase()] = currentSection;

        return s;
      },
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    );
  };

  private buildDefaultValues = (): void => {
    this.newProjectDefaults = [...this.registrations.entries()].reduce<FeatureFlagsEntry>(
      (result: FeatureFlagsEntry, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        const nest = r[1].reduce<{ [key: string]: {} }>((p, fr) => {
          p![fr.name] = fr.defaultValueForNewProjects;

          return p;
        }, {});

        result[r[0]] = {
          ...result[r[0]],
          ...nest,
        };

        return result;
      },
      {},
    );

    this.existingProjectDefaults = [...this.registrations.entries()].reduce<FeatureFlagsEntry>(
      (result: FeatureFlagsEntry, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        const nest = r[1].reduce<{ [key: string]: {} }>((p, fr) => {
          p![fr.name] = fr.defaultValueForExistingProjects;

          return p;
        }, {});

        result[r[0]] = {
          ...result[r[0]],
          ...nest,
        };

        return result;
      },
      {},
    );
  };

  private validateFlags = (allFlags: { name: string; flags: FeatureFlagConfiguration }[]): void => {
    const schema = this.buildJSONSchemaFromRegistrations();
    const ajv = new Ajv();
    const schemaValidate = ajv.compile(schema);

    const validator = (target: string, flags: FeatureFlagsEntry) => {
      const valid = schemaValidate(flags);

      if (!valid && schemaValidate.errors) {
        const jsonError = schemaValidate.errors[0];
        const additionalProperty = (<AdditionalPropertiesParams>jsonError?.params)?.additionalProperty;
        const propertyMessage = additionalProperty ? `: '${additionalProperty}'` : '';

        throw new JSONValidationError(`${target}: ${ajv.errorsText(schemaValidate.errors)}${propertyMessage}`);
      }
    };

    const featureFlagsValidator = (type: string, features: FeatureFlagConfiguration) => {
      validator(`${type} project`, features.project);

      for (let env of Object.keys(features.environments)) {
        validator(`${type} environment (${env})`, features.environments[env]);
      }
    };

    for (let flagItem of allFlags) {
      // Validate file provider settings
      featureFlagsValidator(flagItem.name, flagItem.flags);
    }
  };

  private transformEnvFlags = (features: FeatureFlagConfiguration): FeatureFlagConfiguration => {
    // In this function we to rewrite the featureFlags object and convert property values
    // based on the registered data type, since validation and object merge requires type
    // matching values, but environment variables are all strings.

    const convertValue = (section: string, flagName: string, value: any): any => {
      const sectionRegistration = this.registrations.get(section);

      if (!sectionRegistration) {
        throw new Error(`Section '${section}' is not registered in feature provider`);
      }

      const flagRegistrationEntry = sectionRegistration.find(flag => flag.name === flagName);

      if (!flagRegistrationEntry) {
        throw new Error(`Flag '${flagName}' within '${section}' is not registered in feature provider`);
      }

      switch (flagRegistrationEntry.type) {
        case 'boolean':
          if (value === 'true') {
            return true;
          } else if (value === 'false') {
            return false;
          } else {
            throw new Error(`Invalid boolean value: '${value}' for '${flagName}' in section '${section}'`);
          }
        case 'string':
          // no conversion needed
          return value.toString();
        case 'number': {
          const n = Number.parseInt(value, 10);
          if (!Number.isNaN(n)) {
            return n;
          } else {
            throw new Error(`Invalid number value: '${value}' for '${flagName}' in section '${section}'`);
          }
        }
        default:
          throw new Error(`Invalid number value: ${value} for ${flagName}`);
      }
    };

    const mapFeatureFlagEntry = (input: FeatureFlagsEntry) =>
      Object.keys(input).reduce<FeatureFlagsEntry>((result, section) => {
        const sourceObject = input[section];

        result[section] = Object.keys(sourceObject).reduce<FeatureFlagsEntry>((resultFlag, flagName) => {
          const sourceValue = sourceObject[flagName];

          resultFlag[flagName] = convertValue(section, flagName, sourceValue);

          return resultFlag;
        }, {});

        return result;
      }, {});

    features.project = mapFeatureFlagEntry(features.project);

    for (let env of Object.keys(features.environments)) {
      features.environments[env] = mapFeatureFlagEntry(features.environments[env]);
    }

    return features;
  };

  private registerFlag = (section: string, flags: FeatureFlagRegistration[]): void => {
    if (!section) {
      throw new Error(`'section' argument is required`);
    }

    if (!flags) {
      throw new Error(`'flags' argument is required`);
    }

    const newFlags = this.registrations.get(section.toLowerCase()) ?? new Array<FeatureFlagRegistration>();

    for (let flag of flags) {
      if (!flag.name || flag.name.trim().length === 0) {
        throw new Error(`Flag does not have a name specified`);
      }

      if (newFlags.find(f => f.name === flag.name.toLowerCase())) {
        throw new Error(`Flag with name: '${flag.name}' is already registered in section: '${section}'`);
      }

      // Convert name to lowercase for optimal lookup
      flag.name = flag.name.toLowerCase();

      newFlags.push(flag);
    }

    this.registrations.set(section.toLowerCase(), newFlags);
  };

  // DEVS: Register feature flags here
  private registerFlags = (): void => {
    this.registerFlag('graphQLTransformer', [
      {
        name: 'transformerVersion',
        type: 'number',
        defaultValueForExistingProjects: 4,
        defaultValueForNewProjects: 5,
      },
    ]);

    this.registerFlag('keyTransformer', [
      {
        name: 'defaultQuery',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
    ]);

    this.registerFlag('lambdaLayers', [
      {
        name: 'multiEnvLayers',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
    ]);
  };
}
