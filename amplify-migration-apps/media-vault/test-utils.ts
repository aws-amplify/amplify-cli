// test-utils.ts
export interface TestFailure {
  name: string;
  error: string;
}

export function createTestRunner() {
  const failures: TestFailure[] = [];

  async function runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: any) {
      // Handle different error formats (GraphQL errors, standard errors, objects)
      let errorMessage: string;
      if (error.errors?.[0]?.message) {
        // GraphQL error format
        errorMessage = error.errors[0].message;
      } else if (error.message) {
        // Standard Error
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        // Generic object - stringify it
        errorMessage = JSON.stringify(error, null, 2);
      } else {
        errorMessage = String(error);
      }

      failures.push({ name, error: errorMessage });
      return null;
    }
  }

  function printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    if (failures.length === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${failures.length} test(s) failed:\n`);
      failures.forEach((f) => {
        console.log(`  • ${f.name}`);
        console.log(`    Error: ${f.error}\n`);
      });
      process.exit(1);
    }
  }

  return { failures, runTest, printSummary };
}
