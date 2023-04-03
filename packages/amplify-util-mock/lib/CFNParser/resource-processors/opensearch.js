"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSearchDomainHandler = void 0;
const openSearchDomainHandler = (resourceName) => {
    return {
        cfnExposedAttributes: { Arn: 'arn', DomainArn: 'arn', DomainEndpoint: 'endpoint' },
        arn: `arn:aws:es:{aws-region}:{aws-account-number}:domain/${resourceName}`,
        ref: resourceName,
        endpoint: 'localhost:9200',
    };
};
exports.openSearchDomainHandler = openSearchDomainHandler;
//# sourceMappingURL=opensearch.js.map