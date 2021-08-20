'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.projectHasAuth = void 0;
const string_maps_1 = require('../assets/string-maps');
const projectHasAuth = context => {
  const existingAuth = context.amplify.getProjectDetails().amplifyMeta.auth || {};
  if (Object.keys(existingAuth).length > 0) {
    context.print.warning(string_maps_1.messages.authExists);
    return true;
  }
  return false;
};
exports.projectHasAuth = projectHasAuth;
//# sourceMappingURL=project-has-auth.js.map
