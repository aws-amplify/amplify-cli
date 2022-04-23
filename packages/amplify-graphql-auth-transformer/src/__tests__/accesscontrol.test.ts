import { AccessControlMatrix } from '../accesscontrol';
import { MODEL_OPERATIONS } from '../utils';

test('access control on object and field', () => {
  /*
  given the following schema
  type Student
  @model
  @auth(rules: [
  { allow: groups, groups: ["admin"] }
  { allow: groups, groups: ["student"], operations: [read] }
  ]) {
  studentID: ID
  name: String
  #acm protect email only studentID can update their own email
  email: AWSEmail @auth(rules: [
    { allow: owner, ownerField: "studentID", operations: [update] }
    { allow: groups, groups: ["admin"] }
  ])
  # only allowed to student and admin
  ssn: String @auth(rules: [
    { allow: owner, ownerField: "studentID", operations: [read] }
    { allow: groups, groups: ["admin"] }
  ])
  }
  */
  // create an acm for the student type
  const adminRole = 'userPools:staticGroup:admin';
  const studentGroupRole = 'userPools:staticGroup:student';
  const studentOwnerRole = 'userPools:owner:studentID';
  const studentTypeFields = ['studentID', 'name', 'email', 'ssn'];
  const acm = new AccessControlMatrix({
    name: 'Student',
    resources: studentTypeFields,
    operations: MODEL_OPERATIONS,
  });
  // add OBJECT rules first
  // add admin role which has full access on all CRUD operations for all fields
  acm.setRole({
    role: adminRole,
    operations: MODEL_OPERATIONS,
  });
  // add the student static group rule which only has read access
  acm.setRole({
    role: studentGroupRole,
    operations: ['read'],
  });

  studentTypeFields.forEach(field => {
    // check that admin has CRUD access on all fields
    expect(acm.isAllowed(adminRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'read')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'delete')).toBe(true);
    // check that studentGroupRole has access to read only
    expect(acm.isAllowed(studentGroupRole, field, 'read')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'create')).toBe(false);
    expect(acm.isAllowed(studentGroupRole, field, 'update')).toBe(false);
    expect(acm.isAllowed(studentGroupRole, field, 'delete')).toBe(false);
  });
  // when adding a field rule on email we need to overwrite it
  acm.resetAccessForResource('email');

  expect(acm.isAllowed(studentGroupRole, 'email', 'read')).toBe(false);
  acm.setRole({
    role: studentOwnerRole,
    operations: ['update'],
    resource: 'email',
  });
  expect(acm.isAllowed(adminRole, 'email', 'update')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'update')).toBe(true);
});

test('access control only on field', () => {
  /*
  given the following schema
  type Student
  @model {
  studentID: ID
  name: String
  # only allows read access on email and ssn for studentID ownerField can also only update email
  email: AWSEmail @auth(rules: [
    { allow: owner, ownerField: "studentID", operations: [read, update] }
  ])
  ssn: String @auth(rules: [
    { allow: owner, ownerField: "studentID", operations: [read] }
  ])
  }
  */
  // create an acm for the student type
  const studentOwnerRole = 'userPools:owner:studentID';
  const studentTypeFields = ['studentID', 'name', 'email', 'ssn'];
  const acm = new AccessControlMatrix({
    name: 'Student',
    resources: studentTypeFields,
    operations: MODEL_OPERATIONS,
  });
  // set role for email field
  acm.setRole({ role: studentOwnerRole, operations: ['read', 'update'], resource: 'email' });
  // set role for ssn field
  acm.setRole({ role: studentOwnerRole, operations: ['read'], resource: 'ssn' });

  // expect the correct permissions are assigned for email field
  expect(acm.isAllowed(studentOwnerRole, 'email', 'update')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'read')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'delete')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'create')).toBe(false);

  // expect the correct permissions are assigned for ssn field
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'create')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'read')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'update')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'delete')).toBe(false);
});

test('that adding a role again without a resource is not allowed', () => {
  const blogOwnerRole = 'userPools:owner';
  const blogFields = ['id', 'owner', 'name', 'content'];
  const acm = new AccessControlMatrix({
    name: 'Blog',
    resources: blogFields,
    operations: MODEL_OPERATIONS,
  });
  acm.setRole({ role: blogOwnerRole, operations: MODEL_OPERATIONS });
  for (const field of blogFields) {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'read')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(true);
  }
  expect(() => acm.setRole({ role: blogOwnerRole, operations: ['read'] })).toThrow(`@auth ${blogOwnerRole} already exists for Blog`);
  // field overwrites should still be allowed
  acm.setRole({ role: blogOwnerRole, operations: ['read'], resource: 'name' });
  acm.setRole({ role: blogOwnerRole, operations: ['read'], resource: 'id' });
  expect(acm.isAllowed(blogOwnerRole, 'id', 'read')).toBe(true);
});

test('that adding a role again without a resource is allowed with overwrite flag enabled', () => {
  const blogOwnerRole = 'userPools:owner';
  const blogFields = ['id', 'owner', 'name', 'content'];
  const acm = new AccessControlMatrix({
    name: 'Blog',
    resources: blogFields,
    operations: MODEL_OPERATIONS,
  });
  acm.setRole({ role: blogOwnerRole, operations: MODEL_OPERATIONS });
  for (const field of blogFields) {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'read')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(true);
  }
  acm.setRole({ role: blogOwnerRole, operations: ['read'], allowRoleOverwrite: true });
  for (const field of blogFields) {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'read')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(false);
  }
});
