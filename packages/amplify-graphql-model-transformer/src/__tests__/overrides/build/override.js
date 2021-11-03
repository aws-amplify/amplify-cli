'use strict';
/* Add Amplify Helper dependencies     */
Object.defineProperty(exports, '__esModule', { value: true });
exports.overrideProps = void 0;
/* TODO: Need to change props to Root-Stack specific props when props are ready */
function overrideProps(props) {
  /* TODO: Add snippet of how to override in comments */
  props.api.GraphQLAPI.xrayEnabled = true;
  props.models['Post'].modelDDBTable.billingMode = 'PROVISIONED';
  props.models['Comment'].modelDDBTable.billingMode = 'PROVISIONED';
  // override resolver
  props.models['Post'].resolvers['subscriptionOnUpdatePostResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.overrideProps = overrideProps;
