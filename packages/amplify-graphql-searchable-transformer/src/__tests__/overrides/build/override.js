'use strict';
/* Add Amplify Helper dependencies     */
Object.defineProperty(exports, '__esModule', { value: true });
exports.overrideProps = void 0;
/* TODO: Need to change props to Root-Stack specific props when props are ready */
function overrideProps(props) {
  /* TODO: Add snippet of how to override in comments */
  props.opensearch.OpenSearchDomain.encryptionAtRestOptions = {
    enabled: true,
    kmsKeyId: '1a2a3a4-1a2a-3a4a-5a6a-1a2a3a4a5a6a',
  };
  props.opensearch.OpenSearchDataSource.serviceRoleArn = 'mockArn';
  props.opensearch.OpenSearchModelLambdaMapping['Post'].functionName = 'mockFunciton';
  // override resolver
  props.opensearch.resolvers['querySearchPostsResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.overrideProps = overrideProps;
