import { getGenericFromDataStore } from '../commands/utils/codegen-ui';
import { HasManyRelationshipType } from '../commands/utils/data-types';
import {
  schemaWithEnums,
  schemaWithNonModels,
  schemaWithRelationships,
  schemaWithRelationshipsV2,
  schemaWithAssumptions,
  schemaWithCPK,
  schemaWithCompositeKeys,
  schemaWithHasManyBelongsTo,
  schemaWithoutJoinTables,
  introspectionSchemaWithCompositeKeys,
  schemaWithBiDirectionalHasManyWithDefinedField,
} from './mock-schemas';

describe('getGenericFromDataStore', () => {
  it('should map fields', () => {
    const genericSchema = getGenericFromDataStore(schemaWithRelationships);
    expect(genericSchema.models.Child.fields).toStrictEqual({
      id: {
        dataType: 'ID',
        required: true,
        readOnly: false,
        isArray: false,
      },
      name: {
        dataType: 'String',
        required: false,
        readOnly: false,
        isArray: false,
      },
      createdAt: {
        dataType: 'AWSDateTime',
        required: false,
        readOnly: true,
        isArray: false,
      },
      updatedAt: {
        dataType: 'AWSDateTime',
        required: false,
        readOnly: true,
        isArray: false,
      },
    });
  });

  it('should map relationships', () => {
    const genericSchema = getGenericFromDataStore(schemaWithRelationships);

    expect(genericSchema.models.PrimaryCareGiver.fields.Child.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Child',
      associatedFields: ['primaryCareGiverChildId'],
    });

    expect(genericSchema.models.PrimaryCareGiver.fields.primaryCareGiverChildId.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Child',
    });

    expect(genericSchema.models.Student.fields.Teachers.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Teacher',
      relatedModelFields: ['student'],
      belongsToFieldOnRelatedModel: 'student',
      canUnlinkAssociatedModel: false,
      relatedJoinFieldName: 'teacher',
      relatedJoinTableName: 'StudentTeacher',
    });

    expect(genericSchema.models.Teacher.fields.students.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Student',
      belongsToFieldOnRelatedModel: 'teacher',
      relatedModelFields: ['teacher'],
      canUnlinkAssociatedModel: false,
      relatedJoinFieldName: 'student',
      relatedJoinTableName: 'StudentTeacher',
    });

    expect(genericSchema.models.Lock.fields.Key.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Key',
      associatedFields: ['lockKeyId'],
    });

    expect(genericSchema.models.Lock.fields.lockKeyId.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Key',
    });

    expect(genericSchema.models.Key.fields.Lock.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'Lock',
      associatedFields: ['keyLockId'],
    });

    expect(genericSchema.models.Owner.fields.Dog.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Dog',
      relatedModelFields: ['ownerID'],
      canUnlinkAssociatedModel: true,
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(genericSchema.models.Dog.fields.ownerID.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Owner',
      isHasManyIndex: true,
    });
  });

  it('should map v2 relationships', () => {
    const genericSchema = getGenericFromDataStore(schemaWithRelationshipsV2);

    expect(genericSchema.models.PrimaryCareGiver.fields.Child.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Child',
      associatedFields: ['primaryCareGiverChildId'],
    });

    expect(genericSchema.models.PrimaryCareGiver.fields.primaryCareGiverChildId.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Child',
    });

    expect(genericSchema.models.Student.fields.Teachers.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Teacher',
      relatedModelFields: ['student'],
      belongsToFieldOnRelatedModel: 'student',
      canUnlinkAssociatedModel: false,
      relatedJoinFieldName: 'teacher',
      relatedJoinTableName: 'StudentTeacher',
    });

    expect(genericSchema.models.Teacher.fields.students.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Student',
      belongsToFieldOnRelatedModel: 'teacher',
      relatedModelFields: ['teacher'],
      canUnlinkAssociatedModel: false,
      relatedJoinFieldName: 'student',
      relatedJoinTableName: 'StudentTeacher',
    });

    expect(genericSchema.models.Lock.fields.Key.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Key',
      associatedFields: ['lockKeyId'],
    });

    expect(genericSchema.models.Lock.fields.lockKeyId.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Key',
    });

    expect(genericSchema.models.Key.fields.Lock.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'Lock',
      associatedFields: ['keyLockId'],
    });

    expect(genericSchema.models.Owner.fields.Dog.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Dog',
      relatedModelFields: ['ownerID'],
      canUnlinkAssociatedModel: true,
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(genericSchema.models.Dog.fields.ownerID.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Owner',
      isHasManyIndex: true,
    });
  });

  it('should map enums', () => {
    const genericSchema = getGenericFromDataStore(schemaWithEnums);

    expect(genericSchema.enums).toStrictEqual(schemaWithEnums.enums);
  });

  it('should map nonModels', () => {
    const genericSchema = getGenericFromDataStore(schemaWithNonModels);
    expect(genericSchema.nonModels).toStrictEqual({
      Reactions: {
        fields: {
          ball: { dataType: 'String', required: false, readOnly: false, isArray: false },
          fireworks: { dataType: 'String', required: false, readOnly: false, isArray: false },
        },
      },
      Misc: { fields: { quotes: { dataType: 'String', required: false, readOnly: false, isArray: true } } },
    });
  });

  it('should handle schema with assumed associated fields and models', () => {
    const genericSchema = getGenericFromDataStore(schemaWithAssumptions);
    const userFields = genericSchema.models.User.fields;

    expect(userFields.friends.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Friend',
      relatedModelFields: ['friendId'],
      canUnlinkAssociatedModel: true,
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(userFields.posts.relationship).toStrictEqual<HasManyRelationshipType>({
      type: 'HAS_MANY',
      relatedModelName: 'Post',
      relatedModelFields: ['userPostsId'],
      canUnlinkAssociatedModel: true,
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });
  });

  it('should correctly identify join tables', () => {
    const genericSchemaWithJoinTable = getGenericFromDataStore(schemaWithRelationships);
    const joinTables1 = Object.entries(genericSchemaWithJoinTable.models)
      .filter(([, model]) => model.isJoinTable)
      .map(([name]) => name);
    expect(joinTables1).toStrictEqual(['StudentTeacher']);

    const genericSchemaWithoutJoinTable = getGenericFromDataStore(schemaWithoutJoinTables);
    const joinTables2 = Object.entries(genericSchemaWithoutJoinTable.models)
      .filter(([, model]) => model.isJoinTable)
      .map(([name]) => name);
    expect(joinTables2).toHaveLength(0);
  });

  it('should correctly identify primary keys', () => {
    const genericSchema = getGenericFromDataStore(schemaWithCPK);
    const { models } = genericSchema;
    expect(models.CPKStudent.primaryKeys).toStrictEqual(['specialStudentId']);
    expect(models.CPKTeacher.primaryKeys).toStrictEqual(['specialTeacherId']);
  });

  it('should correctly map model with composite keys', () => {
    const genericSchema = getGenericFromDataStore(schemaWithCompositeKeys);
    const { CompositeDog } = genericSchema.models;
    expect(CompositeDog.primaryKeys).toStrictEqual(['name', 'description']);
    expect(CompositeDog.fields.CompositeBowl.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'CompositeBowl',
      associatedFields: ['compositeDogCompositeBowlShape', 'compositeDogCompositeBowlSize'],
    });
    expect(CompositeDog.fields.CompositeOwner.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'CompositeOwner',
      associatedFields: ['compositeDogCompositeOwnerLastName', 'compositeDogCompositeOwnerFirstName'],
    });
  });

  it('should correctly map schema with hasMany-belongsTo', () => {
    const genericSchema = getGenericFromDataStore(schemaWithHasManyBelongsTo);
    const { User, Org, Post, Comment } = genericSchema.models;

    expect(User.fields.comments.relationship).toStrictEqual({
      type: 'HAS_MANY',
      canUnlinkAssociatedModel: true,
      relatedModelName: 'Comment',
      relatedModelFields: ['userCommentsId'],
      belongsToFieldOnRelatedModel: 'User',
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(Post.fields.comments.relationship).toStrictEqual({
      type: 'HAS_MANY',
      canUnlinkAssociatedModel: true,
      relatedModelName: 'Comment',
      relatedModelFields: ['postCommentsId'],
      belongsToFieldOnRelatedModel: 'post',
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(Org.fields.comments.relationship).toStrictEqual({
      type: 'HAS_MANY',
      canUnlinkAssociatedModel: false,
      relatedModelName: 'Comment',
      relatedModelFields: ['orgCommentsId'],
      belongsToFieldOnRelatedModel: 'Org',
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });

    expect(Comment.fields.postID.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'Post',
    });

    expect(Comment.fields.userCommentsId.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'User',
      isHasManyIndex: true,
    });

    expect(Comment.fields.orgCommentsId.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'Org',
      isHasManyIndex: true,
    });

    expect(Comment.fields.postCommentsId.relationship).toStrictEqual({
      type: 'HAS_ONE',
      relatedModelName: 'Post',
      isHasManyIndex: true,
    });
  });

  it('should produce the same generic schema from MIPR and introspection schema', () => {
    expect(getGenericFromDataStore(introspectionSchemaWithCompositeKeys).models).toStrictEqual(
      getGenericFromDataStore(schemaWithCompositeKeys).models,
    );
  });

  it('should handle bidirectional hasMany with defined field', () => {
    const { Car, Dealership } = getGenericFromDataStore(schemaWithBiDirectionalHasManyWithDefinedField).models;
    expect(Car.fields.dealership.relationship).toStrictEqual({
      type: 'BELONGS_TO',
      relatedModelName: 'Dealership',
      associatedFields: ['dealershipId'],
    });

    expect(Dealership.fields.cars.relationship).toStrictEqual({
      type: 'HAS_MANY',
      canUnlinkAssociatedModel: true,
      relatedModelName: 'Car',
      relatedModelFields: [],
      belongsToFieldOnRelatedModel: 'dealership',
      relatedJoinFieldName: undefined,
      relatedJoinTableName: undefined,
    });
  });
});
