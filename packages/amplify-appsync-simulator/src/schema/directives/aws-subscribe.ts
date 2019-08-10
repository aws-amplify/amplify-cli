import AppSyncSimulatorDirectiveBase from './directive-base';

export class AwsSubscribe extends AppSyncSimulatorDirectiveBase {
  static typeDefinitions: string =
    'directive @aws_subscribe(mutations: [String!]) on FIELD_DEFINITION';
  name: string = 'aws_subscribe';

  visitFieldDefinition(field) {
    const mutationFiled = this.schema.getMutationType().getFields();
    this.args.mutations.forEach(mutation => {
      const m = mutationFiled[mutation];
      if (m && m.resolve) {
        const resolve = m.resolve;
        m.resolve = async (...rest) => {
          const result = await resolve(...rest);
          AwsSubscribe.simulatorContext.pubsub.publish(field.name, result);
          return result;
        };
      }
    });
  }
}
