import AppSyncSimulatorDirectiveBase from './directive-base';
import {
  GraphQLObjectType,
  GraphQLField,
  GraphQLSchema,
  parse,
  GraphQLDirective,
  DirectiveLocation,
  GraphQLEnumType,
  GraphQLInterfaceType,
} from 'graphql';

export class AwsAuth extends AppSyncSimulatorDirectiveBase {
  static typeDefinitions: string = `directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION
    directive @aws_api_key on FIELD_DEFINITION | OBJECT
    directive @aws_iam on FIELD_DEFINITION | OBJECT
    directive @aws_oidc on FIELD_DEFINITION | OBJECT
    directive @aws_cognito_user_pools(cognito_groups: [String!]) on FIELD_DEFINITION | OBJECT`;

  visitFieldDefinition(
    field: GraphQLField<any, any>,
    details: {
      objectType: GraphQLObjectType | GraphQLInterfaceType;
    },
  ) {
    console.log(field);
  }

  visitObject(object: GraphQLObjectType) {
    // (object as any).resolve = (...args) => {
    //   console.log(args);
    //   debugger;
    // }
    // return object;
  }
}
