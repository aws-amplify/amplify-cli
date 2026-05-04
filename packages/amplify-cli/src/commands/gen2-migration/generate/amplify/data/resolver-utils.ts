/**
 * Pure utility module for parsing, classifying, grouping, and computing
 * splice indexes for Gen1 custom AppSync VTL resolver files.
 *
 * No dependencies on the generator/renderer infrastructure.
 */

// ── Types ──────────────────────────────────────────────────────────────

/** Parsed 4-segment override VTL filename. */
export interface ParsedOverride {
  readonly kind: 'override';
  readonly typeName: string;
  readonly fieldName: string;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Parsed 6-segment extended VTL filename. */
export interface ParsedExtended {
  readonly kind: 'extended';
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Union of parsed VTL filename types. */
export type ParsedVtl = ParsedOverride | ParsedExtended;

/** Classification result from `classifyVtlFiles`. */
export interface ClassifiedVtlFiles {
  readonly overrides: readonly ParsedOverride[];
  readonly extended: readonly ParsedExtended[];
}

/** A grouped extended resolver pair (req + res for same slot/order). */
export interface ExtendedResolverGroup {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly reqFile?: string;
  readonly resFile?: string;
}

/** A splice operation to insert a function at a pipeline index. */
export interface SpliceEntry {
  readonly group: ExtendedResolverGroup;
  readonly spliceIndex: number;
}

/** Pipeline splice result for a single typeName.fieldName. */
export interface PipelineSpliceResult {
  readonly typeName: string;
  readonly fieldName: string;
  readonly entries: readonly SpliceEntry[];
}

// ── Slot Constants ─────────────────────────────────────────────────────

/** Valid slots for Query resolvers. */
export const QUERY_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preDataLoad', 'postDataLoad', 'finish'];

/** Valid slots for Mutation resolvers. */
export const MUTATION_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preUpdate', 'postUpdate', 'finish'];

/** Valid slots for Subscription resolvers. */
export const SUBSCRIPTION_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preSubscribe'];

/** Union of all valid slots across all operation types. */
export const ALL_SLOTS: readonly string[] = [
  'init',
  'preAuth',
  'auth',
  'postAuth',
  'preDataLoad',
  'postDataLoad',
  'preUpdate',
  'postUpdate',
  'preSubscribe',
  'finish',
];

/**
 * Maps each slot to its base pipeline index for the 3-function pipeline
 * shape (Query, Subscription, delete-Mutation): [auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_3_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 0,
  preAuth: 0,
  auth: 1,
  postAuth: 2,
  preDataLoad: 2,
  postDataLoad: 3,
  preUpdate: 2,
  postUpdate: 3,
  preSubscribe: 2,
  finish: 3,
};

/**
 * Maps each slot to its base pipeline index for the 4-function pipeline
 * shape (create/update Mutation): [init0, auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_4_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 1,
  preAuth: 1,
  auth: 2,
  postAuth: 3,
  preUpdate: 3,
  postUpdate: 4,
  finish: 4,
};

// ── Parsing ────────────────────────────────────────────────────────────

/**
 * Parses a single VTL filename into a structured representation.
 *
 * 4 segments → ParsedOverride, 6 segments → ParsedExtended, otherwise undefined.
 */
export function parseVtlFilename(filename: string): ParsedVtl | undefined {
  const segments = filename.split('.');
  if (segments.length === 4) {
    const [typeName, fieldName, templateType] = segments;
    return {
      kind: 'override',
      typeName,
      fieldName,
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  if (segments.length === 6) {
    const [typeName, fieldName, slot, orderStr, templateType] = segments;
    return {
      kind: 'extended',
      typeName,
      fieldName,
      slot,
      order: Number(orderStr),
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  return undefined;
}

// ── Validation ─────────────────────────────────────────────────────────

/** Returns the valid slot set for a given typeName. */
function validSlotsForType(typeName: string): readonly string[] {
  switch (typeName) {
    case 'Query':
      return QUERY_SLOTS;
    case 'Mutation':
      return MUTATION_SLOTS;
    case 'Subscription':
      return SUBSCRIPTION_SLOTS;
    default:
      return ALL_SLOTS;
  }
}

/** Validates that a slot is valid for the given typeName. Throws on invalid slot. */
export function validateSlot(typeName: string, slot: string, filename: string): void {
  const validSlots = validSlotsForType(typeName);
  if (!validSlots.includes(slot)) {
    throw new Error(`Invalid slot '${slot}' in file '${filename}' for typeName '${typeName}'. Valid slots: ${validSlots.join(', ')}`);
  }
}

// ── Classification ─────────────────────────────────────────────────────

/**
 * Classifies an array of VTL filenames into overrides and extended resolvers.
 *
 * Validates slots, checks for non-numeric order segments, and detects duplicates.
 */
export function classifyVtlFiles(filenames: string[]): ClassifiedVtlFiles {
  const overrides: ParsedOverride[] = [];
  const extended: ParsedExtended[] = [];
  const seen = new Map<string, string>();

  for (const filename of filenames) {
    const parsed = parseVtlFilename(filename);
    if (!parsed) continue;

    if (parsed.kind === 'override') {
      overrides.push(parsed);
    } else {
      // Validate the order segment is a non-negative integer.
      const segments = filename.split('.');
      const orderStr = segments[3];
      if (!/^\d+$/.test(orderStr)) {
        throw new Error(`Non-numeric order '${orderStr}' in extended resolver file '${filename}'`);
      }

      validateSlot(parsed.typeName, parsed.slot, filename);

      // Detect duplicates: same typeName+fieldName+slot+order+templateType.
      const key = `${parsed.typeName}.${parsed.fieldName}.${parsed.slot}.${parsed.order}.${parsed.templateType}`;
      const existing = seen.get(key);
      if (existing) {
        throw new Error(`Duplicate extended resolver: '${existing}' and '${filename}'`);
      }
      seen.set(key, filename);

      extended.push(parsed);
    }
  }

  return { overrides, extended };
}

// ── Grouping ───────────────────────────────────────────────────────────

/** Canonical slot execution order used for sorting. */
const SLOT_ORDER: Readonly<Record<string, number>> = Object.fromEntries(ALL_SLOTS.map((slot, i) => [slot, i]));

/**
 * Groups ParsedExtended entries by typeName.fieldName, sorts by slot
 * pipeline execution order then numeric order, and pairs req/res templates.
 */
export function groupExtendedResolvers(extended: readonly ParsedExtended[]): Map<string, ExtendedResolverGroup[]> {
  // Collect entries by field key.
  const byField = new Map<string, ParsedExtended[]>();
  for (const entry of extended) {
    const key = `${entry.typeName}.${entry.fieldName}`;
    const list = byField.get(key);
    if (list) {
      list.push(entry);
    } else {
      byField.set(key, [entry]);
    }
  }

  const result = new Map<string, ExtendedResolverGroup[]>();

  for (const [key, entries] of byField) {
    // Sort by slot pipeline order, then by numeric order within the same slot.
    entries.sort((a, b) => {
      const slotDiff = (SLOT_ORDER[a.slot] ?? 0) - (SLOT_ORDER[b.slot] ?? 0);
      if (slotDiff !== 0) return slotDiff;
      return a.order - b.order;
    });

    // Pair req/res templates for the same slot+order.
    const pairMap = new Map<string, { reqFile?: string; resFile?: string }>();
    const pairOrder: string[] = [];

    for (const entry of entries) {
      const pairKey = `${entry.slot}.${entry.order}`;
      let pair = pairMap.get(pairKey);
      if (!pair) {
        pair = {};
        pairMap.set(pairKey, pair);
        pairOrder.push(pairKey);
      }
      if (entry.templateType === 'req') {
        pair.reqFile = entry.filename;
      } else {
        pair.resFile = entry.filename;
      }
    }

    // Build groups in sorted order.
    const groups: ExtendedResolverGroup[] = [];
    for (const pairKey of pairOrder) {
      const pair = pairMap.get(pairKey)!;
      const [slot, orderStr] = pairKey.split('.');
      // Use the first entry's typeName/fieldName (all entries in this key share them).
      const sample = entries[0];
      groups.push({
        typeName: sample.typeName,
        fieldName: sample.fieldName,
        slot,
        order: Number(orderStr),
        reqFile: pair.reqFile,
        resFile: pair.resFile,
      });
    }

    result.set(key, groups);
  }

  return result;
}

// ── Splice Index Computation ───────────────────────────────────────────

/**
 * Selects the pipeline slot map based on typeName and fieldName.
 *
 * Query, Subscription, and delete-Mutation use the 3-function pipeline.
 * Other Mutations and custom types use the 4-function pipeline.
 */
function selectSlotMap(typeName: string, fieldName: string): Readonly<Record<string, number>> {
  if (typeName === 'Query' || typeName === 'Subscription') {
    return PIPELINE_3_SLOT_MAP;
  }
  if (typeName === 'Mutation' && fieldName.startsWith('delete')) {
    return PIPELINE_3_SLOT_MAP;
  }
  return PIPELINE_4_SLOT_MAP;
}

/**
 * Computes splice indexes for a set of grouped extended resolvers for a single field.
 *
 * Each entry's spliceIndex = baseSlotMap[slot] + runningOffset, where
 * runningOffset increments by 1 for each preceding entry.
 */
export function computeSpliceIndexes(typeName: string, fieldName: string, groups: readonly ExtendedResolverGroup[]): PipelineSpliceResult {
  const slotMap = selectSlotMap(typeName, fieldName);
  const entries: SpliceEntry[] = [];
  let runningOffset = 0;

  for (const group of groups) {
    const baseIndex = slotMap[group.slot];
    if (baseIndex === undefined) {
      throw new Error(`Unknown slot '${group.slot}' for ${typeName}.${fieldName}`);
    }
    entries.push({
      group,
      spliceIndex: baseIndex + runningOffset,
    });
    runningOffset++;
  }

  return { typeName, fieldName, entries };
}
