import { CodeGenConnectionType } from '../utils/process-connections';

// Name of the Generated Java Package
export const GENERATED_PACKAGE_NAME = 'com.amplifyframework.datastore.generated.model';

// Name of the Class Loader package
export const LOADER_CLASS_NAME = 'AmplifyModelProvider';

// packages to be imported in Generated Class
export const CLASS_IMPORT_PACKAGES = [
  'java.util.List',
  'java.util.UUID',
  'java.util.Objects',
  '',
  'androidx.core.util.ObjectsCompat',
  '',
  'com.amplifyframework.core.model.Model',
  'com.amplifyframework.core.model.annotations.Index',
  'com.amplifyframework.core.model.annotations.ModelConfig',
  'com.amplifyframework.core.model.annotations.ModelField',
  'com.amplifyframework.core.model.query.predicate.QueryField',
  '',
  'static com.amplifyframework.core.model.query.predicate.QueryField.field',
  '',
];
// packages to be imported in generated Enums
export const ENUM_IMPORT_PACKAGES = ['com.amplifyframework.core.model.ModelEnum;', ''];

// packages to be imported in loader class
export const LOADER_IMPORT_PACKAGES = [
  'com.amplifyframework.core.Immutable',
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
