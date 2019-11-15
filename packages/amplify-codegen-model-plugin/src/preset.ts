import { Types } from '@graphql-codegen/plugin-helpers';
import { isEnumType, TypeDefinitionNode, Kind } from 'graphql';
import { join } from 'path';

import { JAVA_SCALAR_MAP, SWIFT_SCALAR_MAP, TYPESCRIPT_SCALAR_MAP } from './scalars';
const APPSYNC_LOCAL_CODEGEN_TARGETS = ['java', 'android', 'swift', 'ios', 'javascript', 'typescript'];
const JAVA_PACKAGE_NAME = 'com.amplify.datastore.generated';

export type AppSyncLocalCodeGenPresetConfig = {
  /**
   * @name target
   * @type string
   * @description Required, target language for codegen
   *
   * @example
   * ```yml
   * generates:
   * Models:
   *  preset: appsync-local-codegen-plugin
   *  presetConfig:
   *    target: java
   *  plugins:
   *    - appsync-local-codegen-plugin
   * ```
   */
  target: 'java' | 'android' | 'ios' | 'swift' | 'javascript' | 'typescript';
};

const hasDirective = (directiveName: string) => (typeObj: TypeDefinitionNode): boolean => {
  if (typeObj && typeObj.directives && typeObj.directives.length) {
    return typeObj.directives.find(d => d.name.value === directiveName) !== undefined;
  }
  return false;
};

const generateJavaPreset = (
  options: Types.PresetFnArgs<AppSyncLocalCodeGenPresetConfig>,
  models: TypeDefinitionNode[]
): Types.GenerateOptions[] => {
  const config: Types.GenerateOptions[] = [];
  const baseOutputDir = [options.baseOutputDir, ...JAVA_PACKAGE_NAME.split('.')];
  models.forEach(model => {
    const modelName = model.name.value;
    config.push({
      ...options,
      filename: join(...baseOutputDir, `${modelName}.java`),
      config: {
        ...options.config,
        scalars: { ...JAVA_SCALAR_MAP, ...options.config.scalars },
        metadata: false,
        selectedType: modelName,
      },
    });
  });
  return config;
};

const generateSwiftPreset = (
  options: Types.PresetFnArgs<AppSyncLocalCodeGenPresetConfig>,
  models: TypeDefinitionNode[]
): Types.GenerateOptions[] => {
  const config: Types.GenerateOptions[] = [];
  models.forEach(model => {
    const modelName = model.name.value;
    config.push({
      ...options,
      filename: join(options.baseOutputDir, `${modelName}.swift`),
      config: {
        ...options.config,
        scalars: { ...SWIFT_SCALAR_MAP, ...options.config.scalars },
        generate: 'code',
        selectedType: modelName,
      },
    });
    if (model.kind !== Kind.ENUM_TYPE_DEFINITION) {
      config.push({
        ...options,
        filename: join(options.baseOutputDir, `${modelName}+Schema.swift`),
        config: {
          ...options.config,
          target: 'swift',
          scalars: { ...SWIFT_SCALAR_MAP, ...options.config.scalars },
          generate: 'metadata',
          selectedType: modelName,
        },
      });
    }
  });
  // metadata
  config.push({
    ...options,
    filename: join(options.baseOutputDir, `metadata.json`),
    config: {
      ...options.config,
      scalars: { ...SWIFT_SCALAR_MAP, ...options.config.scalars },
      target: 'metadata',
    },
  });

  // class loader
  config.push({
    ...options,
    filename: join(options.baseOutputDir, `AmplifyModels.swift`),
    config: {
      ...options.config,
      scalars: { ...SWIFT_SCALAR_MAP, ...options.config.scalars },
      target: 'swift',
      generate: 'loader',
    },
  });
  return config;
};

const generateTypeScriptPreset = (
  options: Types.PresetFnArgs<AppSyncLocalCodeGenPresetConfig>,
  models: TypeDefinitionNode[]
): Types.GenerateOptions[] => {
  const config: Types.GenerateOptions[] = [];
  const modelFolder = join(options.baseOutputDir, 'models');
  config.push({
    ...options,
    filename: join(modelFolder, 'index.ts'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      metadata: false,
    },
  });
  // metadata
  config.push({
    ...options,
    filename: join(modelFolder, 'schema.ts'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      target: 'metadata',
      metaDataTarget: 'typescript',
    },
  });
  return config;
};

const generateJavasScriptPreset = (
  options: Types.PresetFnArgs<AppSyncLocalCodeGenPresetConfig>,
  models: TypeDefinitionNode[]
): Types.GenerateOptions[] => {
  const config: Types.GenerateOptions[] = [];
  const modelFolder = join(options.baseOutputDir, 'models');
  config.push({
    ...options,
    filename: join(modelFolder, 'index.js'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      metadata: false,
    },
  });

  //indx.d.ts
  config.push({
    ...options,
    filename: join(modelFolder, 'index.d.ts'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      metadata: false,
      isDeclaration: true,
    },
  });
  // metadata schema.js
  config.push({
    ...options,
    filename: join(modelFolder, 'schema.js'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      target: 'metadata',
      metaDataTarget: 'javascript',
    },
  });

  // schema.d.ts
  config.push({
    ...options,
    filename: join(modelFolder, 'schema.d.ts'),
    config: {
      ...options.config,
      scalars: { ...TYPESCRIPT_SCALAR_MAP, ...options.config.scalars },
      target: 'metadata',
      metaDataTarget: 'typedeclaration',
    },
  });
  return config;
};

export const preset: Types.OutputPreset<AppSyncLocalCodeGenPresetConfig> = {
  buildGeneratesSection: (options: Types.PresetFnArgs<AppSyncLocalCodeGenPresetConfig>): Types.GenerateOptions[] => {
    const codeGenTarget = options.config.target;
    const config: Types.GenerateOptions[] = [];

    const hasModelDirective = hasDirective('model');
    const models: TypeDefinitionNode[] = options.schema.definitions.filter(
      t =>
        (t.kind === 'ObjectTypeDefinition' && hasModelDirective(t)) || (t.kind === 'EnumTypeDefinition' && !t.name.value.startsWith('__'))
    ) as any;

    switch (codeGenTarget) {
      case 'java':
      case 'android':
        return generateJavaPreset(options, models);
        break;
      case 'swift':
      case 'ios':
        return generateSwiftPreset(options, models);
        break;
      case 'javascript':
        return generateJavasScriptPreset(options, models);
        break;
      case 'typescript':
        return generateTypeScriptPreset(options, models);
        break;
      default:
        throw new Error(
          `AppSyncLocal codegen does not support language target ${codeGenTarget}. Supported codegen targets arr ${APPSYNC_LOCAL_CODEGEN_TARGETS.join(
            ', '
          )}`
        );
    }
  },
};
