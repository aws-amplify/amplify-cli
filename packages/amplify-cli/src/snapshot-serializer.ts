const originalPlatform = process.platform;
// converts inputs to toMatchInlineSnapshot() function into supported format
export function snapshotSerializer(){
    expect.addSnapshotSerializer({
        test(val) {
            return typeof val === 'string' && originalPlatform === 'win32';
        },
        print(val) {
            return `"${(val as string).replace(/\\/g, '\\')}"`;
        },
    });
}