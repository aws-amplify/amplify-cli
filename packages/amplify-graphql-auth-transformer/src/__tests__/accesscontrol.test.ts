import { AccessControlMatrix } from '../accesscontrol';
import { MODEL_OPERATIONS } from '../utils';

test('access control on object and field', () => {
  /*
  given the following schema
  type Student
  @model
  @auth(rules: [
  { allow: groups, groups: ["admin"] }
  { allow: groups, groups: ["student"], operations: [get list search sync listen] }
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
    { allow: owner, ownerField: "studentID", operations: [get list search sync listen] }
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
  // add the student static group rule which only has [get list search sync listen] access
  acm.setRole({
    role: studentGroupRole,
    operations: ['get', 'list', 'search', 'sync', 'listen'],
  });

  studentTypeFields.forEach(field => {
    // check that admin has CRUD access on all fields
    expect(acm.isAllowed(adminRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'search')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'sync')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'listen')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'get')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(adminRole, field, 'delete')).toBe(true);
    // check that studentGroupRole has access to read only
    expect(acm.isAllowed(studentGroupRole, field, 'search')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'sync')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'listen')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'get')).toBe(true);
    expect(acm.isAllowed(studentGroupRole, field, 'create')).toBe(false);
    expect(acm.isAllowed(studentGroupRole, field, 'update')).toBe(false);
    expect(acm.isAllowed(studentGroupRole, field, 'delete')).toBe(false);
  });
  // when adding a field rule on email we need to overwrite it
  acm.resetAccessForResource('email');

  expect(acm.isAllowed(studentGroupRole, 'email', 'list')).toBe(false);
  expect(acm.isAllowed(studentGroupRole, 'email', 'get')).toBe(false);
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
  # only allows read access on email and ssn for studentID ownerfield can also only update email
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
  acm.setRole({ role: studentOwnerRole, operations: ['get', 'list', 'search', 'listen', 'sync', 'update'], resource: 'email' });
  // set role for ssn field
  acm.setRole({ role: studentOwnerRole, operations: ['get', 'list'], resource: 'ssn' });

  // expect the correct permissions are assigned for email field
  expect(acm.isAllowed(studentOwnerRole, 'email', 'update')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'search')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'sync')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'listen')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'list')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'get')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'delete')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'email', 'create')).toBe(false);

  // expect the correct permissions are assigned for ssn field
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'create')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'search')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'sync')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'listen')).toBe(false);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'list')).toBe(true);
  expect(acm.isAllowed(studentOwnerRole, 'ssn', 'get')).toBe(true);
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
  blogFields.forEach(field => {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'search')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'sync')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'listen')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'get')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(true);
  });
  expect(() => acm.setRole({ role: blogOwnerRole, operations: ['get', 'list'] })).toThrow(`@auth ${blogOwnerRole} already exists for Blog`);
  // field overwrites should still be allowed
  acm.setRole({ role: blogOwnerRole, operations: ['list', 'get'], resource: 'name' });
  acm.setRole({ role: blogOwnerRole, operations: ['list', 'get'], resource: 'id' });
  expect(acm.isAllowed(blogOwnerRole, 'id', 'get')).toBe(true);
  expect(acm.isAllowed(blogOwnerRole, 'id', 'list')).toBe(true);
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
  blogFields.forEach(field => {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'search')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'sync')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'listen')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'get')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(true);
  });
  acm.setRole({ role: blogOwnerRole, operations: ['list', 'get'], allowRoleOverwrite: true });
  blogFields.forEach(field => {
    expect(acm.isAllowed(blogOwnerRole, field, 'create')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'search')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'sync')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'listen')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'list')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'get')).toBe(true);
    expect(acm.isAllowed(blogOwnerRole, field, 'update')).toBe(false);
    expect(acm.isAllowed(blogOwnerRole, field, 'delete')).toBe(false);
  });
});
