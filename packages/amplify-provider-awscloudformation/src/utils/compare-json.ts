import * as fs from 'fs-extra';

/**
 * Interface for detailed change information
 */
interface StackChange {
  path: string;
  type: 'added' | 'removed' | 'value_change' | 'type_change' | 'null_change' | 'array_length_change';
  oldValue?: any;
  newValue?: any;
  oldType?: string;
  newType?: string;
  oldLength?: number;
  newLength?: number;
}

/**
 * Interface for detailed comparison result
 */
interface DetailedComparisonResult {
  hasChanges: boolean;
  changes: StackChange[];
}

/**
 * Check if a value is an object (but not null or array)
 * @param obj the value to check
 * @returns true if the value is an object
 */
const isObject = (obj: any): obj is Record<string, any> => {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

/**
 * Get all unique keys from two objects in sorted order
 * @param obj1 first object
 * @param obj2 second object
 * @returns array of all unique keys sorted alphabetically
 */
const getAllKeys = (obj1: Record<string, any> | undefined, obj2: Record<string, any> | undefined): string[] => {
  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});
  return [...new Set([...keys1, ...keys2])].sort();
};

/**
 * Normalize a value for comparison (handles object key ordering)
 * @param value the value to normalize
 * @returns normalized value
 */
const normalizeValue = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (isObject(value)) {
    const normalized: Record<string, any> = {};
    const sortedKeys = Object.keys(value).sort();
    for (const key of sortedKeys) {
      normalized[key] = normalizeValue(value[key]);
    }
    return normalized;
  }

  return value;
};

/**
 * Create a deterministic string representation of a value for comparison
 * @param value the value to stringify
 * @returns deterministic string representation
 */
const deterministicStringify = (value: any): string => {
  return JSON.stringify(normalizeValue(value));
};

/**
 * Deep comparison helper function
 * @param val1 first value to compare
 * @param val2 second value to compare
 * @param path current path in the object hierarchy
 * @returns true if changes are detected, false otherwise
 */
const deepCompare = (val1: any, val2: any, path = ''): boolean => {
  // Normalize values for comparison
  const norm1 = normalizeValue(val1);
  const norm2 = normalizeValue(val2);

  // If both values are identical after normalization
  if (deterministicStringify(norm1) === deterministicStringify(norm2)) {
    return false; // No changes
  }

  // If types are different
  if (typeof val1 !== typeof val2) {
    console.log(`Change detected at ${path}: type mismatch (${typeof val1} vs ${typeof val2})`);
    return true; // Changes detected
  }

  // If one is null/undefined and the other isn't
  if ((val1 == null) !== (val2 == null)) {
    console.log(`Change detected at ${path}: null/undefined mismatch`);
    return true; // Changes detected
  }

  // If both are arrays
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      console.log(`Change detected at ${path}: array length mismatch (${val1.length} vs ${val2.length})`);
      return true; // Changes detected
    }

    // Compare each element
    for (let i = 0; i < val1.length; i++) {
      if (deepCompare(val1[i], val2[i], `${path}[${i}]`)) {
        return true; // Changes detected
      }
    }
    return false; // No changes
  }

  // If both are objects (but not arrays)
  if (isObject(val1) && isObject(val2)) {
    const allKeys = getAllKeys(val1, val2);

    // Check each key
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      // If key exists in one but not the other
      if (!(key in val1) || !(key in val2)) {
        console.log(`Change detected at ${newPath}: key exists in one stack but not the other`);
        return true; // Changes detected
      }

      // Recursively compare the values
      if (deepCompare(val1[key], val2[key], newPath)) {
        return true; // Changes detected
      }
    }
    return false; // No changes
  }

  // For primitive values that aren't equal
  console.log(`Change detected at ${path}: value mismatch (${val1} vs ${val2})`);
  return true; // Changes detected
};

/**
 * Compare two CloudFormation stack objects and return true if there are changes
 * @param stack1 first CloudFormation stack object
 * @param stack2 second CloudFormation stack object
 * @returns true if there are changes, false if identical
 */
export const compareCloudFormationStacks = (stack1: any, stack2: any): boolean => {
  // Quick check using normalized comparison
  if (deterministicStringify(stack1) === deterministicStringify(stack2)) {
    return false; // No changes
  }

  // If quick check shows differences, do detailed comparison for logging
  return deepCompare(stack1, stack2);
};

/**
 * Deep comparison helper function for detailed comparison
 * @param val1 first value to compare
 * @param val2 second value to compare
 * @param path current path in the object hierarchy
 * @param changes array to collect changes
 */
const deepCompareDetailed = (val1: any, val2: any, path = '', changes: StackChange[]): void => {
  // Use normalized values for comparison
  const norm1 = normalizeValue(val1);
  const norm2 = normalizeValue(val2);

  if (deterministicStringify(norm1) === deterministicStringify(norm2)) {
    return;
  }

  if (typeof val1 !== typeof val2) {
    changes.push({
      path,
      type: 'type_change',
      oldType: typeof val1,
      newType: typeof val2,
      oldValue: val1,
      newValue: val2,
    });
    return;
  }

  if ((val1 == null) !== (val2 == null)) {
    changes.push({
      path,
      type: 'null_change',
      oldValue: val1,
      newValue: val2,
    });
    return;
  }

  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      changes.push({
        path,
        type: 'array_length_change',
        oldLength: val1.length,
        newLength: val2.length,
      });
    }

    const maxLength = Math.max(val1.length, val2.length);
    for (let i = 0; i < maxLength; i++) {
      if (i >= val1.length) {
        changes.push({
          path: `${path}[${i}]`,
          type: 'added',
          newValue: val2[i],
        });
      } else if (i >= val2.length) {
        changes.push({
          path: `${path}[${i}]`,
          type: 'removed',
          oldValue: val1[i],
        });
      } else {
        deepCompareDetailed(val1[i], val2[i], `${path}[${i}]`, changes);
      }
    }
    return;
  }

  if (isObject(val1) && isObject(val2)) {
    const allKeys = getAllKeys(val1, val2);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;

      if (!(key in val1)) {
        changes.push({
          path: newPath,
          type: 'added',
          newValue: val2[key],
        });
      } else if (!(key in val2)) {
        changes.push({
          path: newPath,
          type: 'removed',
          oldValue: val1[key],
        });
      } else {
        deepCompareDetailed(val1[key], val2[key], newPath, changes);
      }
    }
    return;
  }

  changes.push({
    path,
    type: 'value_change',
    oldValue: val1,
    newValue: val2,
  });
};

/**
 * Compare two CloudFormation stack objects and return detailed changes
 * @param stack1 first CloudFormation stack object
 * @param stack2 second CloudFormation stack object
 * @returns object with hasChanges boolean and changes array
 */
export const compareCloudFormationStacksDetailed = (stack1: any, stack2: any): DetailedComparisonResult => {
  const changes: StackChange[] = [];
  deepCompareDetailed(stack1, stack2, '', changes);

  return {
    hasChanges: changes.length > 0,
    changes: changes,
  };
};

/**
 * Parse JSON content safely, handling both minified and formatted JSON
 * @param content JSON string content
 * @param filePath file path for error messages
 * @returns parsed JSON object
 */
const parseJSONContent = (content: string, filePath: string): any => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error}`);
  }
};

/**
 * Compare two CloudFormation stack files
 * @param stackFile1Path path to the first stack file
 * @param stackFile2Path path to the second stack file
 * @returns true if there are changes, false if identical
 */
export const compareCloudFormationStackFiles = (stackFile1Path: string, stackFile2Path: string): boolean => {
  if (!stackFile1Path.includes('.json') || !stackFile2Path.includes('.json')) {
    throw new Error('Both files must be JSON files');
  }

  const content1 = fs.readFileSync(stackFile1Path, 'utf-8');
  const content2 = fs.readFileSync(stackFile2Path, 'utf-8');

  const stack1 = parseJSONContent(content1, stackFile1Path);
  const stack2 = parseJSONContent(content2, stackFile2Path);

  return compareCloudFormationStacks(stack1, stack2);
};

/**
 * Compare two CloudFormation stack files and return detailed changes
 * @param stackFile1Path path to the first stack file
 * @param stackFile2Path path to the second stack file
 * @returns object with hasChanges boolean and changes array
 */
export const compareCloudFormationStackFilesDetailed = (stackFile1Path: string, stackFile2Path: string): DetailedComparisonResult => {
  if (!stackFile1Path.includes('.json') || !stackFile2Path.includes('.json')) {
    throw new Error('Both files must be JSON files');
  }

  const content1 = fs.readFileSync(stackFile1Path, 'utf-8');
  const content2 = fs.readFileSync(stackFile2Path, 'utf-8');

  const stack1 = parseJSONContent(content1, stackFile1Path);
  const stack2 = parseJSONContent(content2, stackFile2Path);

  return compareCloudFormationStacksDetailed(stack1, stack2);
};

/**
 * Compare two CloudFormation stacks from JSON strings
 * @param jsonString1 first JSON string
 * @param jsonString2 second JSON string
 * @returns true if there are changes, false if identical
 */
export const compareCloudFormationStackStrings = (jsonString1: string, jsonString2: string): boolean => {
  const stack1 = parseJSONContent(jsonString1, 'string1');
  const stack2 = parseJSONContent(jsonString2, 'string2');

  return compareCloudFormationStacks(stack1, stack2);
};
