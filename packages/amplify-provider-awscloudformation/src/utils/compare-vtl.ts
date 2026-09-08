import * as fs from 'fs-extra';

/**
 * Interface for detailed change information for VTL files
 */
interface VtlChange {
  line: number;
  type: 'added' | 'removed' | 'changed';
  oldValue?: string;
  newValue?: string;
}

/**
 * Interface for detailed comparison result for VTL files
 */
interface VtlDetailedComparisonResult {
  hasChanges: boolean;
  changes: VtlChange[];
}

/**
 * Compare two arrays of lines and return detailed changes
 * @param lines1 lines from the first file
 * @param lines2 lines from the second file
 * @returns array of changes
 */
const compareLinesDetailed = (lines1: string[], lines2: string[]): VtlChange[] => {
  const changes: VtlChange[] = [];
  const maxLength = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLength; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 === undefined && line2 !== undefined) {
      changes.push({
        line: i + 1,
        type: 'added',
        newValue: line2,
      });
    } else if (line1 !== undefined && line2 === undefined) {
      changes.push({
        line: i + 1,
        type: 'removed',
        oldValue: line1,
      });
    } else if (line1 !== line2) {
      changes.push({
        line: i + 1,
        type: 'changed',
        oldValue: line1,
        newValue: line2,
      });
    }
  }

  return changes;
};

/**
 * Compare two VTL files (AppSync resolver templates) and return true if there are changes
 * @param vtlFile1Path path to the first VTL file
 * @param vtlFile2Path path to the second VTL file
 * @returns true if there are changes, false if identical
 */
export const compareVtlFiles = (vtlFile1Path: string, vtlFile2Path: string): boolean => {
  if (!vtlFile1Path.endsWith('.vtl') || !vtlFile2Path.endsWith('.vtl')) {
    throw new Error('Both files must be VTL files');
  }

  const vtl1 = fs.readFileSync(vtlFile1Path, 'utf-8').split(/\r?\n/);
  const vtl2 = fs.readFileSync(vtlFile2Path, 'utf-8').split(/\r?\n/);

  if (vtl1.length !== vtl2.length) {
    return true;
  }

  for (let i = 0; i < vtl1.length; i++) {
    if (vtl1[i] !== vtl2[i]) {
      return true;
    }
  }

  return false;
};

/**
 * Compare two VTL files (AppSync resolver templates) and return detailed changes
 * @param vtlFile1Path path to the first VTL file
 * @param vtlFile2Path path to the second VTL file
 * @returns object with hasChanges boolean and changes array
 */
export const compareVtlFilesDetailed = (vtlFile1Path: string, vtlFile2Path: string): VtlDetailedComparisonResult => {
  if (!vtlFile1Path.endsWith('.vtl') || !vtlFile2Path.endsWith('.vtl')) {
    throw new Error('Both files must be VTL files');
  }

  const vtl1 = fs.readFileSync(vtlFile1Path, 'utf-8').split(/\r?\n/);
  const vtl2 = fs.readFileSync(vtlFile2Path, 'utf-8').split(/\r?\n/);

  const changes = compareLinesDetailed(vtl1, vtl2);

  return {
    hasChanges: changes.length > 0,
    changes,
  };
};
