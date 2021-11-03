'use strict';
/* Add Amplify Helper dependencies     */
Object.defineProperty(exports, '__esModule', { value: true });
exports.overrideProps = void 0;
/* TODO: Need to change props to Root-Stack specific props when props are ready */
function overrideProps(props) {
  /* TODO: Add snippet of how to override in comments */
  props.function.lambdaDataSource['Echofunction'].serviceRoleArn = 'mockArn';
  props.function.lambdaDataSource['Otherfunction'].serviceRoleArn = 'mockArn';
  // override resolver
  props.function.resolvers['queryEchoResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.overrideProps = overrideProps;
