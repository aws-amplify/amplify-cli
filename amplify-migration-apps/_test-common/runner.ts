export interface TestFailure {
  name: string;
  message: string;
  stack?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    // Handle GraphQL-style errors: { errors: [{ message: "..." }] }
    if ('errors' in error) {
      const gqlErrors = (error as { errors: unknown }).errors;
      if (Array.isArray(gqlErrors) && gqlErrors.length > 0) {
        const first = gqlErrors[0] as { message?: string };
        if (typeof first.message === 'string') {
          return first.message;
        }
      }
    }
    return JSON.stringify(error, null, 2);
  }
  return String(error);
}

export class TestRunner {
  readonly failures: TestFailure[] = [];

  async runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.failures.push({ name, message: getErrorMessage(error), stack });
      return null;
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    if (this.failures.length === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${this.failures.length} test(s) failed:\n`);
      this.failures.forEach((f) => {
        console.log(`  • ${f.name}`);
        console.log(`    Error: ${f.message}`);
        if (f.stack) {
          console.log(`    Stack: ${f.stack}`);
        }
        console.log('');
      });
      process.exit(1);
    }
  }
}
