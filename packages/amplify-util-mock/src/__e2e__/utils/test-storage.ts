export default class TestStorage {
    private data: any
    constructor() {
        this.data = {}
    }
    // set item with the key
    public setItem(key: string, value: string): string {
        this.data[key] = value
        return value
    }
    // get item with the key
    public getItem(key: string): string {
        return this.data[key]
    }
    // remove item with the key
    public removeItem(key: string): void {
        this.data[key] = undefined
    }
    // clear out the storage
    public clear(): void {
        this.data = {}
    }
    // If the storage operations are async(i.e AsyncStorage)
    // Then you need to sync those items into the memory in this method
    public sync(): Promise<void> {
        return Promise.resolve(this.data)
    }
}