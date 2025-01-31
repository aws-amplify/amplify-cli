import Ajv, { AdditionalPropertiesParams } from 'ajv';
import { isCI } from 'ci-info';
import * as fs from 'fs-extra';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'; // eslint-disable-line import/no-extraneous-dependencies
import _ from 'lodash';
import * as path from 'path';
import { CLIEnvironmentProvider } from '../cliEnvironmentProvider';
// eslint-disable-next-line import/no-cycle
import { AmplifyError } from '../errors/amplify-error';
import { AmplifyFault } from '../errors/amplify-fault';
import { JSONUtilities } from '../jsonUtilities';
import { pathManager, stateManager } from '../state-manager'; // eslint-disable-line import/no-cycle
/* eslint-disable import/no-cycle */
import { FeatureFlagEnvironmentProvider } from './featureFlagEnvironmentProvider';
import { FeatureFlagFileProvider } from './featureFlagFileProvider'; // eslint-disable-line import/no-cycle
import { FeatureFlagConfiguration, FeatureFlagRegistration, FeatureFlagsEntry, FeatureFlagType } from './featureFlagTypes';
/* eslint-enable */

/**
 * Feature flag class for the CLI
 */
export class FeatureFlags {
  private static instance: FeatureFlags;

  private readonly registrations: Map<string, FeatureFlagRegistration[]> = new Map();
  private fileValueProvider!: FeatureFlagFileProvider;
  private envValueProvider!: FeatureFlagEnvironmentProvider;
  private effectiveFlags: Readonly<FeatureFlagsEntry> = {};
  private newProjectDefaults: Readonly<FeatureFlagsEntry> = {};
  private existingProjectDefaults: Readonly<FeatureFlagsEntry> = {};

  private constructor(private environmentProvider: CLIEnvironmentProvider, private projectPath: string, private useNewDefaults: boolean) {}

  public static initialize = async (
    environmentProvider: CLIEnvironmentProvider,
    useNewDefaults = false,
    additionalFlags?: Record<string, FeatureFlagRegistration[]>,
  ): Promise<void> => {
    // If we are not running by tests, guard against multiple calls to initialize invocations
    if (typeof jest === 'undefined' && FeatureFlags.instance) {
      throw new Error('FeatureFlags can only be initialized once');
    }

    if (!environmentProvider) {
      throw new Error("'environmentProvider' argument is required");
    }

    // fallback to process.cwd() if no projectPath cannot be determined
    const projectPath = pathManager.findProjectRoot() ?? process.cwd();

    await FeatureFlags.removeOriginalConfigFile(projectPath);

    const instance = new FeatureFlags(environmentProvider, projectPath, useNewDefaults);

    // Populate registrations here, later this can be coming from plugins' manifests
    instance.registerFlags();

    if (additionalFlags) {
      Object.keys(additionalFlags).forEach((sectionName) => {
        const flags = additionalFlags[sectionName];

        instance.registerFlag(sectionName, flags);
      });
    }

    // Create the providers
    instance.fileValueProvider = new FeatureFlagFileProvider(environmentProvider, {
      projectPath,
    });
    instance.envValueProvider = new FeatureFlagEnvironmentProvider({
      projectPath,
    });

    await instance.loadValues();

    FeatureFlags.instance = instance;
  };

  /**
   * This method reads the project configuration file if exist and adds the features section based on the default feature flags file.
   * If the configuration file does not exist it will be created with the default features. If the configuration file exists and already has
   * a features section it will be preserved and will not be overwritten.
   *
   * @param newProject True if settings for new projects requested or false if default for existing project are requested
   */
  public static ensureDefaultFeatureFlags = async (newProject: boolean): Promise<void> => {
    FeatureFlags.ensureInitialized();

    let config = stateManager.getCLIJSON(FeatureFlags.instance.projectPath, undefined, {
      throwIfNotExist: false,
      preserveComments: true,
    });

    // If no configuration file or configuration file exists but does not have a features property create it and overwrite the file
    if (!config || !config.features) {
      config = {
        ...(config ?? {}), // to fix 'Spread types may only be created from object types.(2698)' warning
        features: newProject ? FeatureFlags.getNewProjectDefaults() : FeatureFlags.getExistingProjectDefaults(),
      };

      stateManager.setCLIJSON(FeatureFlags.instance.projectPath, config);
    }
  };

  /**
   * If feature flag exists do nothing, otherwise initialize the given feature flag with the default value.
   * If the configuration file does not exist it will be created with the default features.
   */
  public static ensureFeatureFlag = async (featureFlagSection: string, featureFlagName: string): Promise<void> => {
    FeatureFlags.ensureInitialized();

    const config = stateManager.getCLIJSON(FeatureFlags.instance.projectPath, undefined, {
      throwIfNotExist: false,
      preserveComments: true,
    });

    if (!config?.features) {
      await FeatureFlags.ensureDefaultFeatureFlags(false);
    } else if (config.features?.[featureFlagSection]?.[featureFlagName] === undefined) {
      const features = FeatureFlags.getExistingProjectDefaults();
      _.setWith(config, ['features', featureFlagSection, featureFlagName], features[featureFlagSection][featureFlagName]);

      stateManager.setCLIJSON(FeatureFlags.instance.projectPath, config);
    }
  };

  public static getBoolean = (flagName: string): boolean => {
    FeatureFlags.ensureInitialized();

    return FeatureFlags.instance.getValue<boolean>(flagName, 'boolean');
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

  public static removeFeatureFlagConfiguration = async (removeProjectConfiguration: boolean, envNames: string[]): Promise<void> => {
    FeatureFlags.ensureInitialized();

    if (!envNames) {
      // this is an internal issue, we either couldn't load the environment names
      // or their configuration is invalid, further troubleshooting is needed
      throw new AmplifyFault('ConfigurationFault', {
        message: 'Environment names could not be loaded or were not provided.',
      });
    }

    if (removeProjectConfiguration) {
      const configFileName = pathManager.getCLIJSONFilePath(FeatureFlags.instance.projectPath);

      await fs.remove(configFileName);
    }

    for (const envName of envNames) {
      const configFileName = pathManager.getCLIJSONFilePath(FeatureFlags.instance.projectPath, envName);
      await fs.remove(configFileName);
    }
  };

  public static isInitialized = (): boolean => FeatureFlags.instance !== undefined;

  public static reloadValues = async (): Promise<void> => {
    FeatureFlags.ensureInitialized();

    await FeatureFlags.instance.loadValues();
  };

  private static removeOriginalConfigFile = async (projectPath: string): Promise<void> => {
    // Try to read in original `amplify.json` in project root and if it is a valid JSON
    // and contains a top level `features` property, remove the file.
    const originalConfigFileName = 'amplify.json';

    try {
      if (!projectPath) {
        return;
      }

      const originalConfigFilePath = path.join(projectPath, originalConfigFileName);

      const configFileData = JSONUtilities.readJson<{ features: FeatureFlagsEntry }>(originalConfigFilePath, {
        throwIfNotExist: false,
      });

      if (configFileData?.features !== undefined) {
        fs.removeSync(originalConfigFilePath);
      }
    } catch {
      // Intentionally left blank
    }
  };

  private static ensureInitialized = (): void => {
    if (!FeatureFlags.instance) {
      throw new Error('FeatureFlags is not initialized');
    }
  };

  private getValue = <T extends boolean | number | string>(flagName: string, type: FeatureFlagType): T => {
    if (!flagName) {
      throw new Error("'flagName' argument is required");
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

    const flagRegistrationEntry = sectionRegistration?.find((flag) => flag.name === parts[1]);

    if (!flagRegistrationEntry) {
      throw new Error(`Flag '${parts[1]}' within '${parts[0]}' is not registered in feature provider`);
    }

    if (flagRegistrationEntry?.type !== type) {
      throw new Error(`'${flagName}' is a ${flagRegistrationEntry.type} type, not ${type}`);
    }

    // Check if effective values has a value for the requested flag
    value = <T>this.effectiveFlags[parts[0]]?.[parts[1]];

    // If there is no value, return the registered defaults for existing projects
    if (value === undefined && flagRegistrationEntry) {
      if (this.useNewDefaults) {
        value = <T>(flagRegistrationEntry.defaultValueForNewProjects as unknown);
      } else {
        value = <T>(flagRegistrationEntry.defaultValueForExistingProjects as unknown);
      }
    }

    return value ?? false;
  };

  private buildJSONSchemaFromRegistrations = (): JSONSchema7 =>
    [...this.registrations.entries()].reduce<JSONSchema7>(
      (schema: JSONSchema7, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        const currentSection = <JSONSchema7>(schema.properties![r[0].toLowerCase()] ?? {
          type: 'object',
          additionalProperties: false,
        });

        currentSection.properties = r[1].reduce<{ [key: string]: JSONSchema7Definition }>((p, fr) => {
          /* eslint-disable no-param-reassign */
          p![fr.name.toLowerCase()] = {
            type: fr.type,
            default: fr.defaultValueForNewProjects,
          };
          /* eslint-enable */

          return p;
        }, {});

        /* eslint-disable no-param-reassign */
        schema.properties![r[0].toLowerCase()] = currentSection;
        /* eslint-enable */

        return schema;
      },
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    );

  private buildDefaultValues = (): void => {
    this.newProjectDefaults = [...this.registrations.entries()].reduce<FeatureFlagsEntry>(
      (result: FeatureFlagsEntry, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        /* eslint-disable @typescript-eslint/ban-types */
        const nest = r[1].reduce<{ [key: string]: {} }>((p, fr) => {
          /* eslint-disable no-param-reassign */
          p![fr.name] = fr.defaultValueForNewProjects;
          /* eslint-enable */

          return p;
        }, {});

        /* eslint-disable no-param-reassign */
        result[r[0]] = {
          ...result[r[0]],
          ...nest,
        };
        /* eslint-enable */

        return result;
      },
      {},
    );

    this.existingProjectDefaults = [...this.registrations.entries()].reduce<FeatureFlagsEntry>(
      (result: FeatureFlagsEntry, r: [string, FeatureFlagRegistration[]]) => {
        // r is a tuple, 0=section, 1=array of registrations for that section
        /* eslint-disable @typescript-eslint/ban-types */
        const nest = r[1].reduce<{ [key: string]: {} }>((p, fr) => {
          /* eslint-disable no-param-reassign */
          p![fr.name] = fr.defaultValueForExistingProjects;
          /* eslint-enable */

          return p;
        }, {});

        /* eslint-disable no-param-reassign */
        result[r[0]] = {
          ...result[r[0]],
          ...nest,
        };
        /* eslint-enable */

        return result;
      },
      {},
    );
  };

  private validateFlags = (allFlags: { name: string; flags: FeatureFlagConfiguration }[]): void => {
    const schema = this.buildJSONSchemaFromRegistrations();
    const ajv = new Ajv({
      allErrors: true,
    });
    const schemaValidate = ajv.compile(schema);

    const validator = (flags: FeatureFlagsEntry): void => {
      const valid = schemaValidate(flags);

      if (!valid && schemaValidate.errors) {
        const unknownFlags: string[] = [];
        const otherErrors: string[] = [];

        schemaValidate.errors.forEach((error) => {
          if (error.keyword === 'additionalProperties') {
            const additionalProperty = (<AdditionalPropertiesParams>error.params)?.additionalProperty;
            let flagName: string = error.dataPath.length > 0 && error.dataPath[0] === '.' ? `${error.dataPath.slice(1)}.` : '';

            if (additionalProperty) {
              if (flags[flagName.replace('.', '')][additionalProperty] === false) {
                return;
              }
              flagName += additionalProperty;
            }

            if (flagName.length > 0) {
              unknownFlags.push(flagName);
            }
          } else {
            const errorMessage =
              error.dataPath.length > 0 && error.dataPath[0] === '.'
                ? `${error.dataPath.slice(1)}: ${error.message}`
                : `${error.dataPath}: ${error.message}`;

            otherErrors.push(errorMessage);
          }
        });

        if (unknownFlags.length > 0 || otherErrors.length > 0) {
          throw new AmplifyError('FeatureFlagsValidationError', {
            message: 'Invalid feature flag configuration',
            details:
              (unknownFlags.length > 0
                ? `These feature flags are defined in the "amplify/cli.json" configuration file and are unknown to the currently running Amplify CLI:\n${unknownFlags
                    .map((el) => `- ${el}`)
                    .join(',\n')}\n`
                : '') +
              (otherErrors.length > 0
                ? `The following feature flags have validation errors:\n${otherErrors.map((el) => `- ${el}`).join(',\n')}`
                : ''),
            resolution: `This issue likely happens when the project has been pushed with a newer version of Amplify CLI, try updating to a newer version.${
              isCI ? '\nEnsure that the CI/CD pipeline is not using an older or pinned down version of Amplify CLI.' : ''
            }`,
            link: 'https://docs.amplify.aws/cli/reference/feature-flags',
          });
        }
      }
    };

    const featureFlagsValidator = (features: FeatureFlagConfiguration): void => {
      validator(features.project);

      Object.keys(features.environments).forEach((env) => {
        validator(features.environments[env]);
      });
    };

    allFlags.forEach((flagItem) => {
      // Validate file provider settings
      featureFlagsValidator(flagItem.flags);
    });
  };

  private transformEnvFlags = (features: FeatureFlagConfiguration): FeatureFlagConfiguration => {
    // In this function we to rewrite the featureFlags object and convert property values
    // based on the registered data type, since validation and object merge requires type
    // matching values, but environment variables are all strings.

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const convertValue = (section: string, flagName: string, value: any): any => {
      /* eslint-enable */
      const sectionRegistration = this.registrations.get(section);

      if (!sectionRegistration) {
        throw new Error(`Section '${section}' is not registered in feature provider`);
      }

      const flagRegistrationEntry = sectionRegistration.find((flag) => flag.name === flagName);

      if (!flagRegistrationEntry) {
        throw new Error(`Flag '${flagName}' within '${section}' is not registered in feature provider`);
      }

      switch (flagRegistrationEntry.type) {
        case 'boolean':
          if (value === 'true') {
            return true;
          }
          if (value === 'false') {
            return false;
          }
          throw new Error(`Invalid boolean value: '${value}' for '${flagName}' in section '${section}'`);

        case 'number': {
          const n = Number.parseInt(value, 10);
          if (!Number.isNaN(n)) {
            return n;
          }
          throw new Error(`Invalid number value: '${value}' for '${flagName}' in section '${section}'`);
        }
        default:
          throw new Error(`Invalid number value: ${value} for ${flagName}`);
      }
    };

    const mapFeatureFlagEntry = (input: FeatureFlagsEntry): FeatureFlagsEntry =>
      Object.keys(input).reduce<FeatureFlagsEntry>((result, section) => {
        const sourceObject = input[section];

        /* eslint-disable no-param-reassign */
        result[section] = Object.keys(sourceObject).reduce<FeatureFlagsEntry>((resultFlag, flagName) => {
          const sourceValue = sourceObject[flagName];

          resultFlag[flagName] = convertValue(section, flagName, sourceValue);

          return resultFlag;
        }, {});

        return result;
      }, {});

    features.project = mapFeatureFlagEntry(features.project);

    Object.keys(features.environments).forEach((env) => {
      features.environments[env] = mapFeatureFlagEntry(features.environments[env]);
    });
    /* eslint-enable */

    return features;
  };

  private loadValues = async (): Promise<void> => {
    // Load the flags from all providers
    const fileFlags = await this.fileValueProvider.load();
    const envFlags = this.transformEnvFlags(await this.envValueProvider.load());

    // Validate the loaded flags from all providers
    this.validateFlags([
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
    this.buildDefaultValues();

    //
    // To make access easy, we are unfolding the values from the providers, dot notation based key value pairs.
    // Example: 'graphqlTransformer.transformerVersion': 5
    //
    // top to bottom the following order is used:
    // - file project level
    // - file env level
    // - environment project level
    // - environment env level
    //
    // The sections, properties and values are verified against the dynamically built up json schema
    //

    this.effectiveFlags = _.merge(
      this.useNewDefaults ? this.newProjectDefaults : this.existingProjectDefaults,
      fileFlags.project,
      fileFlags.environments[this.environmentProvider.getCurrentEnvName()] ?? {},
      envFlags.project,
      envFlags.environments[this.environmentProvider.getCurrentEnvName()] ?? {},
    );
  };

  private registerFlag = (section: string, flags: FeatureFlagRegistration[]): void => {
    if (!section) {
      throw new Error("'section' argument is required");
    }

    if (!flags) {
      throw new Error("'flags' argument is required");
    }

    const newFlags = this.registrations.get(section.toLowerCase()) ?? new Array<FeatureFlagRegistration>();

    flags.forEach((flag) => {
      if (!flag.name || flag.name.trim().length === 0) {
        throw new Error('Flag does not have a name specified');
      }

      if (newFlags.find((f) => f.name === flag.name.toLowerCase())) {
        throw new Error(`Flag with name: '${flag.name}' is already registered in section: '${section}'`);
      }

      /* eslint-disable no-param-reassign */
      flag.name = flag.name.toLowerCase(); // Convert name to lowercase for optimal lookup
      /* eslint-enable */

      newFlags.push(flag);
    });

    this.registrations.set(section.toLowerCase(), newFlags);
  };

  // DEVS: Register feature flags here
  private registerFlags = (): void => {
    // Examples:
    // this.registerFlag('keyTransformer', [
    //   {
    //     name: 'defaultQuery',
    //     type: 'boolean',
    //     defaultValueForExistingProjects: false,
    //     defaultValueForNewProjects: true,
    //   },
    // ]);
    this.registerFlag('graphQLTransformer', [
      {
        name: 'addMissingOwnerFields',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'improvePluralization',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
      {
        name: 'validateTypeNameReservedWords',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: true,
      },
      {
        name: 'useExperimentalPipelinedTransformer',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'enableIterativeGSIUpdates',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'secondaryKeyAsGSI',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'skipOverrideMutationInputTypes',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'transformerVersion',
        type: 'number',
        defaultValueForExistingProjects: 1,
        defaultValueForNewProjects: 2,
      },
      {
        name: 'suppressSchemaMigrationPrompt',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: true,
      },
      {
        name: 'securityEnhancementNotification',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: false,
      },
      {
        name: 'showFieldAuthNotification',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: false,
      },
      {
        name: 'useSubUsernameForDefaultIdentityClaim',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: true,
      },
      {
        name: 'useFieldNameForPrimaryKeyConnectionField',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
      {
        name: 'enableAutoIndexQueryNames',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'respectPrimaryKeyAttributesOnConnectionField',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'shouldDeepMergeDirectiveConfigDefaults',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
      {
        name: 'populateOwnerFieldForStaticGroupAuth',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'subscriptionsInheritPrimaryAuth',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
    ]);

    this.registerFlag('frontend-ios', [
      {
        name: 'enableXcodeIntegration',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
    ]);

    this.registerFlag('auth', [
      {
        name: 'enableCaseInsensitivity',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'useInclusiveTerminology',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'breakCircularDependency',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'forceAliasAttributes',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
      {
        name: 'useEnabledMfas',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
    ]);

    this.registerFlag('codegen', [
      {
        name: 'useAppSyncModelgenPlugin',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'useDocsGeneratorPlugin',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'useTypesGeneratorPlugin',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'cleanGeneratedModelsDirectory',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'retainCaseStyle',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'addTimestampFields',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'handleListNullabilityTransparently',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'emitAuthProvider',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'generateIndexRules',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'enableDartNullSafety',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
      {
        name: 'generateModelsForLazyLoadAndCustomSelectionSet',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: false,
      },
    ]);

    this.registerFlag('appSync', [
      {
        name: 'generateGraphQLPermissions',
        type: 'boolean',
        defaultValueForExistingProjects: false,
        defaultValueForNewProjects: true,
      },
    ]);

    this.registerFlag('latestRegionSupport', [
      {
        name: 'pinpoint',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
      {
        name: 'translate',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
      {
        name: 'transcribe',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
      {
        name: 'rekognition',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
      {
        name: 'textract',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
      {
        name: 'comprehend',
        type: 'number',
        defaultValueForExistingProjects: 0,
        defaultValueForNewProjects: 1,
      },
    ]);

    this.registerFlag('project', [
      {
        name: 'overrides',
        type: 'boolean',
        defaultValueForExistingProjects: true,
        defaultValueForNewProjects: true,
      },
    ]);
  };
}
