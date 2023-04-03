declare class ElasticsearchHelper {
    private static readonly ES_UTILS;
    private static readonly ERROR_FORMAT;
    getQueryDSL(filterInput: any): any;
    getScalarQueryDSL(fieldName: string, conditions: any): any[];
    private getQueryDSLRecursive;
    private getOrAndSubexpressions;
    private format;
}
export default ElasticsearchHelper;
//# sourceMappingURL=elasticsearch-helper.d.ts.map