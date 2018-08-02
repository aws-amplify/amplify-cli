export class SearchableResourceIDs {
    static SearchableEventSourceMappingID(typeName: string): string {
        return `${typeName}LambdaMapping`
    }
}