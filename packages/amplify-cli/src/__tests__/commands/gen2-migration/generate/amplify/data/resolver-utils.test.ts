import {
  parseVtlFilename,
  classifyVtlFiles,
  groupExtendedResolvers,
  computeSpliceIndexes,
  PIPELINE_3_SLOT_MAP,
  PIPELINE_4_SLOT_MAP,
  ParsedExtended,
  ExtendedResolverGroup,
} from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';

describe('parseVtlFilename', () => {
  it('returns ParsedOverride with correct fields for a 4-segment filename', () => {
    const result = parseVtlFilename('Mutation.createTodo.req.vtl');
    expect(result).toEqual({
      kind: 'override',
      typeName: 'Mutation',
      fieldName: 'createTodo',
      templateType: 'req',
      filename: 'Mutation.createTodo.req.vtl',
    });
  });

  it('returns ParsedExtended with correct fields for a 6-segment filename', () => {
    const result = parseVtlFilename('Mutation.createBoard.init.2.req.vtl');
    expect(result).toEqual({
      kind: 'extended',
      typeName: 'Mutation',
      fieldName: 'createBoard',
      slot: 'init',
      order: 2,
      templateType: 'req',
      filename: 'Mutation.createBoard.init.2.req.vtl',
    });
  });

  it('returns undefined for a 3-segment filename', () => {
    expect(parseVtlFilename('Mutation.req.vtl')).toBeUndefined();
  });

  it('returns undefined for a 5-segment filename', () => {
    expect(parseVtlFilename('Mutation.createTodo.init.req.vtl')).toBeUndefined();
  });

  it('returns undefined for a 7-segment filename', () => {
    expect(parseVtlFilename('Mutation.createTodo.init.2.req.vtl.extra')).toBeUndefined();
  });

  it('correctly parses the order field as a number', () => {
    const result = parseVtlFilename('Query.listItems.postAuth.5.res.vtl');
    expect(result).toBeDefined();
    expect(result!.kind).toBe('extended');
    expect((result as ParsedExtended).order).toBe(5);
    expect(typeof (result as ParsedExtended).order).toBe('number');
  });
});

describe('classifyVtlFiles', () => {
  it('classifies 4-segment files as overrides', () => {
    const result = classifyVtlFiles(['Mutation.createTodo.req.vtl', 'Query.getTodo.res.vtl']);
    expect(result.overrides).toHaveLength(2);
    expect(result.extended).toHaveLength(0);
    expect(result.overrides[0].kind).toBe('override');
    expect(result.overrides[1].kind).toBe('override');
  });

  it('classifies 6-segment files as extended', () => {
    const result = classifyVtlFiles(['Mutation.createTodo.init.1.req.vtl', 'Query.listItems.postAuth.2.res.vtl']);
    expect(result.overrides).toHaveLength(0);
    expect(result.extended).toHaveLength(2);
    expect(result.extended[0].kind).toBe('extended');
    expect(result.extended[1].kind).toBe('extended');
  });

  it('ignores files with other segment counts', () => {
    const result = classifyVtlFiles(['too.few.vtl', 'five.seg.ment.file.vtl', 'Mutation.createTodo.req.vtl']);
    expect(result.overrides).toHaveLength(1);
    expect(result.extended).toHaveLength(0);
  });

  it('throws for non-numeric order in extended resolver filename', () => {
    expect(() => classifyVtlFiles(['Mutation.createTodo.init.abc.req.vtl'])).toThrow(/Non-numeric order/);
  });

  it('throws for duplicate extended resolver (same typeName+fieldName+slot+order+templateType)', () => {
    expect(() => classifyVtlFiles(['Mutation.createTodo.init.1.req.vtl', 'Mutation.createTodo.init.1.req.vtl'])).toThrow(
      /Duplicate extended resolver/,
    );
  });

  it('handles mixed override and extended files correctly', () => {
    const result = classifyVtlFiles([
      'Mutation.createTodo.req.vtl',
      'Mutation.createTodo.init.1.req.vtl',
      'Query.getTodo.res.vtl',
      'Query.listItems.postAuth.2.res.vtl',
    ]);
    expect(result.overrides).toHaveLength(2);
    expect(result.extended).toHaveLength(2);
  });
});

describe('groupExtendedResolvers', () => {
  const makeExtended = (typeName: string, fieldName: string, slot: string, order: number, templateType: 'req' | 'res'): ParsedExtended => ({
    kind: 'extended',
    typeName,
    fieldName,
    slot,
    order,
    templateType,
    filename: `${typeName}.${fieldName}.${slot}.${order}.${templateType}.vtl`,
  });

  it('groups entries by typeName.fieldName', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Query', 'listItems', 'postAuth', 1, 'req'),
    ];
    const result = groupExtendedResolvers(entries);
    expect(result.size).toBe(2);
    expect(result.has('Mutation.createTodo')).toBe(true);
    expect(result.has('Query.listItems')).toBe(true);
  });

  it('sorts within group by slot pipeline execution order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'finish', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'auth', 1, 'req'),
    ];
    const result = groupExtendedResolvers(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups.map((g) => g.slot)).toEqual(['init', 'auth', 'finish']);
  });

  it('sorts within same slot by numeric order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 3, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 2, 'req'),
    ];
    const result = groupExtendedResolvers(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups.map((g) => g.order)).toEqual([1, 2, 3]);
  });

  it('pairs req and res templates for same slot+order', () => {
    const entries: ParsedExtended[] = [
      makeExtended('Mutation', 'createTodo', 'init', 1, 'req'),
      makeExtended('Mutation', 'createTodo', 'init', 1, 'res'),
    ];
    const result = groupExtendedResolvers(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBe('Mutation.createTodo.init.1.req.vtl');
    expect(groups[0].resFile).toBe('Mutation.createTodo.init.1.res.vtl');
  });

  it('handles entry with only req file (no res)', () => {
    const entries: ParsedExtended[] = [makeExtended('Mutation', 'createTodo', 'init', 1, 'req')];
    const result = groupExtendedResolvers(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBe('Mutation.createTodo.init.1.req.vtl');
    expect(groups[0].resFile).toBeUndefined();
  });

  it('handles entry with only res file (no req)', () => {
    const entries: ParsedExtended[] = [makeExtended('Mutation', 'createTodo', 'init', 1, 'res')];
    const result = groupExtendedResolvers(entries);
    const groups = result.get('Mutation.createTodo')!;
    expect(groups).toHaveLength(1);
    expect(groups[0].reqFile).toBeUndefined();
    expect(groups[0].resFile).toBe('Mutation.createTodo.init.1.res.vtl');
  });
});

describe('computeSpliceIndexes', () => {
  const makeGroup = (slot: string, order: number): ExtendedResolverGroup => ({
    typeName: 'Mutation',
    fieldName: 'createTodo',
    slot,
    order,
  });

  it('uses 3-function pipeline for Query', () => {
    const groups: ExtendedResolverGroup[] = [{ typeName: 'Query', fieldName: 'getTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Query', 'getTodo', groups);
    // init in 3-function pipeline has base index 0
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 3-function pipeline for Subscription', () => {
    const groups: ExtendedResolverGroup[] = [{ typeName: 'Subscription', fieldName: 'onCreateTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Subscription', 'onCreateTodo', groups);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 3-function pipeline for delete Mutation (fieldName starts with "delete")', () => {
    const groups: ExtendedResolverGroup[] = [{ typeName: 'Mutation', fieldName: 'deleteTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'deleteTodo', groups);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_3_SLOT_MAP['init']);
  });

  it('uses 4-function pipeline for create Mutation', () => {
    const groups: ExtendedResolverGroup[] = [{ typeName: 'Mutation', fieldName: 'createTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'createTodo', groups);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init']);
  });

  it('uses 4-function pipeline for update Mutation', () => {
    const groups: ExtendedResolverGroup[] = [{ typeName: 'Mutation', fieldName: 'updateTodo', slot: 'init', order: 1 }];
    const result = computeSpliceIndexes('Mutation', 'updateTodo', groups);
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init']);
  });

  it('computes correct splice index with running offset for multiple entries', () => {
    const groups: ExtendedResolverGroup[] = [makeGroup('init', 1), makeGroup('auth', 1), makeGroup('finish', 1)];
    const result = computeSpliceIndexes('Mutation', 'createTodo', groups);
    // 4-function pipeline: init=1, auth=2, finish=4
    expect(result.entries[0].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['init'] + 0); // 1
    expect(result.entries[1].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['auth'] + 1); // 3
    expect(result.entries[2].spliceIndex).toBe(PIPELINE_4_SLOT_MAP['finish'] + 2); // 6
  });

  it('computes init.2 and finish.1 on create mutation correctly', () => {
    // init.2 → base 1 + offset 0 = 1
    // finish.1 → base 4 + offset 1 = 5
    const groups: ExtendedResolverGroup[] = [makeGroup('init', 2), makeGroup('finish', 1)];
    const result = computeSpliceIndexes('Mutation', 'createTodo', groups);
    expect(result.entries[0].spliceIndex).toBe(1);
    expect(result.entries[1].spliceIndex).toBe(5);
  });
});
