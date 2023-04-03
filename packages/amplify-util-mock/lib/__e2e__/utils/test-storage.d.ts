export default class TestStorage {
    private data;
    constructor();
    setItem(key: string, value: string): string;
    getItem(key: string): string;
    removeItem(key: string): void;
    clear(): void;
    sync(): Promise<void>;
}
//# sourceMappingURL=test-storage.d.ts.map