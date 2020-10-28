import { CodeGenConnectionType } from '../utils/process-connections';

// Name of the Generated Java Package
export const GENERATED_PACKAGE_NAME = 'com.amplifyframework.datastore.generated.model';

// Name of the Class Loader package
export const LOADER_CLASS_NAME = 'AmplifyModelProvider';

const JAVA_UTIL_PACKAGES = ['java.util.List', 'java.util.UUID', 'java.util.Objects'];

const ANDROIDX_CORE_PACKAGES = ['androidx.core.util.ObjectsCompat'];

const AMPLIFY_FRAMEWORK_PACKAGES = [
  'com.amplifyframework.core.model.Model',
  'com.amplifyframework.core.model.annotations.Index',
  'com.amplifyframework.core.model.annotations.ModelConfig',
  'com.amplifyframework.core.model.annotations.ModelField',
  'com.amplifyframework.core.model.query.predicate.QueryField',
];

const AMPLIFY_FRAMEWORK_AUTH_PACKAGES_ONLY = [
  'com.amplifyframework.core.model.AuthStrategy',
  'com.amplifyframework.core.model.ModelOperation',
  'com.amplifyframework.core.model.annotations.AuthRule',
];

const AMPLIFY_FRAMEWORK_STATIC_PACKAGES = ['static com.amplifyframework.core.model.query.predicate.QueryField.field'];

export function getModelClassImports(usingAuth: boolean = false): string[] {
  if (usingAuth) {
    // Insert Auth packages into Amplify framework packages
    const AMPLIFY_MERGED_FRAMEWORK_PACKAGES = AMPLIFY_FRAMEWORK_PACKAGES.concat(AMPLIFY_FRAMEWORK_AUTH_PACKAGES_ONLY).sort();
    return [
      ...JAVA_UTIL_PACKAGES,
      '',
      ...ANDROIDX_CORE_PACKAGES,
      '',
      ...AMPLIFY_MERGED_FRAMEWORK_PACKAGES,
      '',
      ...AMPLIFY_FRAMEWORK_STATIC_PACKAGES,
      '',
    ];
  } else {
    return [
      ...JAVA_UTIL_PACKAGES,
      '',
      ...ANDROIDX_CORE_PACKAGES,
      '',
      ...AMPLIFY_FRAMEWORK_PACKAGES,
      '',
      ...AMPLIFY_FRAMEWORK_STATIC_PACKAGES,
      '',
    ];
  }
}

// packages to be imported for model Classes
export const MODEL_CLASS_IMPORT_PACKAGES = getModelClassImports();

// packages to be imported for model classes with Auth
export const MODEL_AUTH_CLASS_IMPORT_PACKAGES = getModelClassImports(true);

// packages to be imported in generated Enums
export const ENUM_IMPORT_PACKAGES = ['com.amplifyframework.core.model.ModelEnum;', ''];
// packages to be imported for Non model Classes
export const NON_MODEL_CLASS_IMPORT_PACKAGES = ['androidx.core.util.ObjectsCompat', '', 'java.util.Objects', 'java.util.List', ''];

// packages to be imported in loader class
export const LOADER_IMPORT_PACKAGES = [
  'com.amplifyframework.util.Immutable',
  'com.amplifyframework.core.model.Model',
  'com.amplifyframework.core.model.ModelProvider',
  '',
  'java.util.Arrays',
  'java.util.HashSet',
  'java.util.Set',
];

export const CONNECTION_RELATIONSHIP_IMPORTS: { [key in CodeGenConnectionType]: string } = {
  BELONGS_TO: 'com.amplifyframework.core.model.annotations.BelongsTo',
  HAS_MANY: 'com.amplifyframework.core.model.annotations.HasMany',
  HAS_ONE: 'com.amplifyframework.core.model.annotations.HasOne',
};
