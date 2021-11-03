'use strict';
/* Add Amplify Helper dependencies     */
Object.defineProperty(exports, '__esModule', { value: true });
exports.overrideProps = void 0;
/* TODO: Need to change props to Root-Stack specific props when props are ready */
function overrideProps(props) {
  /* TODO: Add snippet of how to override in comments */
  props.http.httpsDataSource['httpwwwapicom'].serviceRoleArn = 'mockArn';
  props.http.httpsDataSource['httpwwwapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  props.http.httpsDataSource['httpapicom'].serviceRoleArn = 'mockArn';
  props.http.httpsDataSource['httpapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  props.http.httpsDataSource['httpwwwgooglecom'].serviceRoleArn = 'mockArn';
  props.http.httpsDataSource['httpwwwgooglecom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  props.http.httpsDataSource['httpswwwapicom'].serviceRoleArn = 'mockArn';
  props.http.httpsDataSource['httpswwwapicom'].httpConfig = {
    endpoint: 'mockEndpoint',
  };
  // override resolver
  props.http.resolvers['commentContentResolver'].requestMappingTemplate = 'mockTemplate';
}
exports.overrideProps = overrideProps;
