"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exposeGraphQLErrors = void 0;
function exposeGraphQLErrors(errors = []) {
    return errors.map((e) => {
        if (e.extensions && !(Object.keys(e.extensions).length === 0)) {
            const additionalProps = Object.entries(e.extensions).reduce((sum, [k, v]) => {
                return { ...sum, [k]: { value: v, enumerable: true } };
            }, {});
            return Object.defineProperties({}, additionalProps);
        }
        return e;
    });
}
exports.exposeGraphQLErrors = exposeGraphQLErrors;
//# sourceMappingURL=expose-graphql-errors.js.map