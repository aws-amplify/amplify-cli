# General Coding Guidelines — Expanded

These guidelines target problematic coding patterns observed in this project. Each point is explained with rationale and alternatives. Points are ordered by severity — architectural issues first, code hygiene last.

---

## Architecture & Structure

### 1. Avoid god classes and god modules

A god class is one that accumulates responsibilities because it already has all the context — it's convenient to add "one more method" rather than extract a new component. The symptom: you can't describe what the class does in one sentence without using "and." A long constructor with many dependencies is another signal — each dependency represents a responsibility the class has absorbed.

The distinction that matters: a top-level orchestrator that coordinates multiple concerns is fine — that's its job. The problem is when the orchestrator also _implements_ those concerns inline. A class that calls `resolveTemplate()`, `updateStack()`, and `refactorResources()` is an orchestrator. A class that contains the implementation of template resolution, stack updating, and resource refactoring in its own methods is a god class.

**Instead:** Each concern should be its own component with a clear interface. The orchestrator calls into those components but doesn't contain their logic. If you need to understand how template resolution works, you should be able to read one file — not hunt through a 700-line class that also handles API calls, error recovery, and rollback.

---

### 2. Every layer boundary must justify its existence

Don't introduce separate layers (with their own interfaces) unless each layer is expected to change independently. Every boundary between layers that reshapes data from one interface into another is a place where a property can be misnamed, dropped, or subtly transformed. The more layers the data passes through, the harder it is to trace a value back to its source of truth.

The default should be the simplest path: read from the source, produce the output. A single module per concern that reads the source of truth and writes the result is easier to understand and maintain than a multi-layer pipeline where each layer has its own interface that's mostly the same data in a slightly different shape.

Only introduce a boundary when you have a concrete reason to decouple. For example, a rendering layer makes sense if you need to swap file output for a different target — the rendering logic would change independently from the data-reading logic. But if the renderer will only ever write to files, the boundary is speculative and the separate interface is pure overhead.

The test: if you removed a layer and passed the previous layer's data directly to the next consumer, would anything break other than property names? If not, the layer is adding fidelity risk without value.

```typescript
// Bad — data reshaped across multiple layers with manual mapping at each boundary

// Layer 1: Fetcher gets raw SDK response
interface UserPoolResponse {
  readonly UserPool: {
    readonly Id: string;
    readonly Name: string;
    readonly MfaConfiguration: string;
  };
}

// Layer 2: Adapter reshapes into "definition"
interface AuthDefinition {
  readonly userPoolId: string;
  readonly userPoolName: string;
  readonly mfa: string;
}
function toAuthDefinition(response: UserPoolResponse): AuthDefinition {
  return {
    userPoolId: response.UserPool.Id,
    userPoolName: response.UserPool.Name,
    mfa: response.UserPool.MfaConfiguration,
  };
}

// Layer 3: Generator reshapes into "render parameters"
interface AuthRenderParams {
  readonly poolId: string;
  readonly poolName: string;
  readonly mfaConfig: string;
}
function toRenderParams(def: AuthDefinition): AuthRenderParams {
  return { poolId: def.userPoolId, poolName: def.userPoolName, mfaConfig: def.mfa };
}

// Layer 4: Renderer consumes it
function renderAuth(params: AuthRenderParams): string {
  /* ... */
}

// Each boundary is a manual mapping where a property can be misnamed or dropped.
// Is poolId the same as userPoolId? Is mfaConfig the same as mfa? You have to
// trace through every layer to verify.

// Better — fetch the data and produce the output in one place
function generateAuthResource(userPool: UserPoolResponse['UserPool']): string {
  // Directly use userPool.Id, userPool.Name, userPool.MfaConfiguration
  // No intermediate interfaces, no mapping code, no fidelity risk
}
```

---

### 3. Keep files small and focused

When a single file grows to hundreds of lines and mixes multiple responsibilities (e.g., data transformation, API calls, orchestration, and error recovery), it becomes hard to understand, test, and modify.

**Instead:** Extract cohesive units into their own files. A file's name should accurately describe its single responsibility — if it does more than the name suggests, it's doing too much.

---

### 4. Name things accurately

If a folder is called `generators/` but the files inside it orchestrate API calls, manage lifecycle operations, execute side effects, and handle rollbacks, the name is misleading. "Generators" implies pure data transformation.

**Instead:** Name files and folders after what they actually do. If a class named `TemplateGenerator` orchestrates an entire workflow, rename it to reflect that responsibility.

---

### 5. Centralize external API calls per service

When calls to the same external service are scattered across multiple files and classes, it's hard to audit what the module does, add cross-cutting concerns (logging, retries, dry-run mode), or understand the full surface area of external interactions.

Scattered client usage also risks inconsistent instantiation. For example, if API clients are created in multiple places with different configuration (different credential providers, different regions, different retry settings), one part of the code may behave differently from another in ways that are hard to diagnose. With SDK clients, it's important that all call sites use the same credentials provider chain — otherwise one call may require authentication that others don't, leading to subtle failures.

**Instead:** Create a single module that wraps all interactions with a given service. Instantiate the client once with the correct configuration and share it. This centralizes the API surface and makes it easy to add observability or change behavior in one place.

---

## Mutability & State Management

### 6. Minimize mutability

Mutable state makes code hard to reason through. When a property can be reassigned anywhere in the call hierarchy, you can't know what value it holds at any given point without tracing every code path that touches it. Worse, a function may operate on assumptions about the data it received, but if that data is mutated after the function starts executing — by a callback, an async operation, or a downstream call — those assumptions silently become invalid.

This applies at every level:

- Interface properties and class fields should be `readonly`. Omitting `readonly` requires a clear, documented justification for why mutation is necessary. "Convenience" is not a justification.
- Local variables should be `const` — see point 7 for details.

---

### 7. Prefer `const` over `let`

Avoid `let` when the code can be restructured to use `const` instead. Even when `let` is technically correct (the variable is reassigned), the reassignment pattern itself is often the problem — it usually means branching logic is being used to populate variables that are consumed later, making it hard to reason about what values they hold at any given point.

The most damaging pattern is declaring several `let` variables as `undefined` at the top of a function, then assigning them inside different branches of a conditional, and finally using them after the branching is done. The reader has to mentally simulate every branch to know what state the variables are in — and some may be `undefined` in certain branches, creating implicit scenarios the code after the branching must handle without making them explicit.

```typescript
// Bad — multiple let variables assigned across branches
let source;
let destination;
let mapping;

if (modeA) {
  source = computeSourceA();
  destination = computeDestA();
  mapping = buildMappingA();
} else if (modeB) {
  source = computeSourceB();
  destination = computeDestB();
  mapping = buildMappingB();
} else {
  source = computeSourceC();
  destination = computeDestC();
  mapping = buildMappingC();
}

// What are source, destination, mapping here? Depends on which branch ran.
process(source, destination, mapping);
```

**Instead:** Have each branch produce a single typed result, or extract each branch into a function that returns the same shape. The `let` declarations disappear and the compiler enforces completeness:

```typescript
// Better — each branch is a self-contained function returning the same shape
const { source, destination, mapping } = modeA ? prepareA() : modeB ? prepareB() : prepareC();

process(source, destination, mapping);
```

For simpler cases, ternary expressions or extracting a small function with early returns are usually enough to eliminate `let`.

---

## Interface Design

### 8. Every property in an interface should belong to the concept it's named after

Name the interface after what it represents, then make sure every property actually belongs to that concept. If you find yourself adding a property that doesn't fit the name, either the property is in the wrong place or the name is wrong.

A common symptom: you need to thread some data to a downstream function, and the most convenient place to attach it is an existing interface that's already being passed around — even though the data has nothing to do with that interface's concept. This pollutes the interface and confuses future readers about what it actually represents.

**Instead:** Pass the unrelated data as a separate argument, or compute the derived value the consumer actually needs upstream and pass that in as something that does belong to the interface's concept.

---

### 9. Minimize optional properties

Excessive optionality pushes validation burden onto every consumer. Each `?` is a branch the caller must handle.

### 9a. Optional at the boundary, required downstream

A property that can genuinely be absent should only be optional in the interface closest to the input boundary — the entry point that first receives the data. That entry point does the validation or branching, and every subsequent consumer receives an interface where the property is required.

```typescript
// Boundary interface — the entry point accepts optional input
interface UserInput {
  readonly name: string;
  readonly email?: string;
}

// Downstream interface — after validation, email is guaranteed
interface ValidatedUser {
  readonly name: string;
  readonly email: string;
}

// The boundary function handles the optionality once
function validateUser(input: UserInput): ValidatedUser {
  if (!input.email) {
    throw new Error('Email is required');
  }
  return { name: input.name, email: input.email };
}

// Every downstream function receives certainty — no null checks needed
function sendWelcomeEmail(user: ValidatedUser) {
  // user.email is guaranteed to exist, no check required
}
```

This is the structural solution to the problem described in point 29 (don't null-check the same value repeatedly). If you keep a property optional all the way through the call chain, every consumer is forced to re-validate it. Narrowing the type at the boundary eliminates that repeated checking by design.

### 9b. Use separate interfaces or discriminated unions for grouped optionality

When a group of properties are always present together or always absent together, that's a sign you're modeling two different things with one type. Split them.

```typescript
// Bad — caller has to guess which combination of fields is valid
interface Notification {
  readonly message: string;
  readonly emailAddress?: string; // only for email
  readonly phoneNumber?: string; // only for SMS
  readonly subject?: string; // only for email
}

// Better — each variant is explicit
interface EmailNotification {
  readonly type: 'email';
  readonly message: string;
  readonly emailAddress: string;
  readonly subject: string;
}

interface SmsNotification {
  readonly type: 'sms';
  readonly message: string;
  readonly phoneNumber: string;
}

type Notification = EmailNotification | SmsNotification;
```

With the union, the compiler enforces that `emailAddress` is only accessed when `type === 'email'`, and `phoneNumber` only when `type === 'sms'`. No runtime guessing required.

---

### 10. Don't represent the same information twice

If the same piece of data exists in two places — as two properties on an interface, as a property and a separate function argument, or as a stored field and a derivable value — you've created a consistency hazard. When one changes and the other doesn't, you get a silent bug.

A common form: a function accepts an `app` object that has a `.name` property, and also accepts `appName` as a separate argument. Now there are two sources of truth for the app name, and the caller has to keep them in sync.

**Instead:** Store the canonical form once. Access it from the source (`app.name`), or derive it on demand via a utility function. Only add a derived property if the computation is expensive and needs caching — and in that case, document why.

---

### 11. Don't add interface properties or function arguments that nobody reads

Dead inputs — whether interface properties or function arguments — mislead the reader into thinking they affect behavior. They add noise to call sites, make refactoring harder (you have to trace them to confirm they're unused), and invite cargo-cult copying where future code passes the value "just in case."

**Instead:** Only include what the consumer actually uses. If a property or argument is "for future use," leave it out until that future arrives. Version control remembers.

---

### 12. Don't reinvent interfaces that already exist

Before defining a new interface, check the codebase, `node_modules`, and SDK documentation. Duplicating a shape that already exists in `@aws-sdk/*` or `@aws-amplify/*` creates drift — your copy goes stale while the real one evolves.

**Instead:** Import the existing type. If you only need a subset, use `Pick<ExistingType, 'field1' | 'field2'>`.

---

### 13. Don't use catch-all `types.ts` files

Catch-all type files tend to accumulate unrelated interfaces over time, becoming a dumping ground that's hard to navigate and reason about. They also create artificial coupling — every file that imports from `types.ts` now depends on a module that contains types for completely unrelated concerns.

If two files need the same type, ask why they're separate. Either they're operating on the same domain concept and should be co-located, they coincidentally share a shape but represent different things and should have separate types, or one produces the data and the other consumes it and the type belongs with the producer.

**Instead:** Define each interface in the file that owns the concept it represents. If a type is only used by one file, it belongs in that file. If it genuinely represents a shared domain concept, it belongs in the module that owns that domain. Avoid creating files whose only purpose is to hold types for other files.

---

### 14. Avoid `type X = SomeEnum | string`

A union with `string` defeats the purpose of the enum. If a type is defined as `EnumValue.A | EnumValue.B | string`, any string is valid — the enum members add no type safety.

**Instead:** If the set is open-ended, use `string` and validate at runtime. If it's closed, use the enum without the `| string` escape hatch. If you need both known and unknown values, use a branded type or a discriminated union.

---

### 15. Minimize nested interfaces

Deeply nested interfaces (`config.auth.providers[0].settings.oauth.scopes`) are hard to construct, hard to test, and hard to read.

**Instead:** Flatten where possible. Pass the inner structure directly to the function that needs it rather than threading a deep object through multiple layers.

---

## Error Handling

### 16. Only return fallbacks or branch for valid states

The question to ask before returning `null`, adding an `if` guard, or swallowing an error is: does this condition represent a valid state the caller is expected to handle, or does it mean something is broken?

If a function checks whether an optional resource exists (e.g., a cache entry that may or may not have been created by a previous step), returning `null` is correct — the caller has a real decision to make based on that absence.

But if the resource _must_ exist because a previous step created it and the program can't continue without it, returning `null` hides a bug behind a fallback. The same applies to `if` guards that silently skip work when a value is absent — if the code path can only be reached when the value exists, the guard hides a bug instead of surfacing it.

**Instead:** Throw immediately with a clear error at the point where you detect the problem. Only return a fallback or add a guard when the absence is a valid input state that the caller is designed to handle.

```typescript
// Bad — silently skips if apiId is missing, but we only reach
// this code because we found an AppSync API entry
if (apiId) {
  const response = await client.send(new GetGraphqlApiCommand({ apiId }));
}

// Good — fail fast if the invariant is violated
if (!apiId) {
  throw new Error(`AppSync API '${apiName}' has no GraphQLAPIIdOutput`);
}
const response = await client.send(new GetGraphqlApiCommand({ apiId }));
```

---

### 17. Don't use `assert()` in production code

`assert` from `node:assert` throws a generic `AssertionError` with no user-facing context. It's a debugging tool, not an error-handling strategy.

**Instead:** If the assertion guards against a genuine invariant violation, throw an `AmplifyError` with a message that helps the user. If the assertion is redundant (the value can't actually be null given the preceding logic), remove it.

---

## Control Flow & Logic

### 18. Don't branch on the same condition multiple times

Multiple `if (type === 'X')` blocks scattered across a function indicate the logic should be consolidated or polymorphic.

Scattered branching means: adding a new case requires hunting every branch point (miss one and you have a runtime bug), understanding a single case requires reading the entire function and mentally collecting its fragments, and testing one case in isolation is impossible because it's interleaved with every other case. The branches also tend to drift apart over time — one checks for a sub-feature, another doesn't — because there's no single place that defines the complete behavior for a case.

**Instead:** Handle each case once. Use a strategy map or category-specific classes so the branching happens in one place. Adding a case becomes one change, understanding a case means reading one unit, and testing a case means testing one unit.

---

### 19. Don't compute the same derived value more than once

If multiple call sites independently read the same file, call the same API, or derive the same value from raw data, you're paying the cost multiple times and creating multiple places that can diverge if the logic changes.

**Instead:** Compute once, pass everywhere. Do the work at the top of the pipeline, extract what you need into a typed object, and inject it into every consumer.

---

### 20. Don't accept optional predicates as input

Accepting an optional predicate callback to customize filtering or branching behavior creates multiple problems:

First, optionality means there are at least three possible behaviors: caller A's predicate, caller B's predicate, and the default when none is passed. The class has a hidden default mode that the reader has to discover by reading the implementation of every method that uses the predicate. If the predicate were at least required, the caller would always explicitly define the filtering strategy.

Second, the existence of a predicate often indicates a missing abstraction. The caller has the strategy (the predicate) but not the data, and the class has the data but not the strategy. This separation suggests there should be a component that owns both — one that has access to the data and defines its own filtering logic, with branching happening at a higher level to select the right component.

**Instead:** If you find yourself passing an optional predicate, ask whether the optionality is hiding multiple modes that should be explicit (separate classes, discriminated union, or a required strategy parameter), and whether the predicate is papering over a missing component that should own both the data and the decision logic.

---

## Function Design

### 21. Use object parameters for functions with multiple arguments

A function with many positional arguments is hard to call correctly — the caller has to remember the exact order, and swapping two arguments of the same type is a silent bug.

**Instead:** Accept a single object parameter with named fields. The interface for this object should be private (not exported) and defined alongside the function that consumes it — not in a shared types file. This keeps the contract co-located with its only consumer (see also point 13).

---

### 22. Minimize argument count

Related to the above. High argument counts are a code smell indicating the function is doing too much or its dependencies aren't properly grouped.

**Instead:** Group related arguments into cohesive objects. For example, `region`, `accountId`, and service clients that always travel together could be a single context object.

---

### 23. Don't use classes when static methods suffice

If a class has no mutable state and its methods don't reference `this` beyond constructor-injected dependencies, it may be a function in disguise.

The key question is: does the class carry context that its call sites don't have? If the class captures configuration established earlier in the pipeline and call sites only provide per-invocation input, the class is doing useful work — it's a configured capability you pass around, and converting it to a pure function would force every call site to thread that configuration through. That's a legitimate use of a class even without state mutation.

But if the call site already has all the information needed for both construction and operation, the class adds indirection without benefit.

**Instead:** For stateless operations where the caller has all the context, use a utility class with static public methods. This groups related functions under a clear name and is easy to mock in tests. Reserve instantiated classes for cases where they carry configuration that call sites shouldn't need to know about.

---

## Code Hygiene

### 24. Minimize code duplication

When non-trivial logic is repeated in multiple places, a bug fix or behavior change requires updating every copy — miss one and you have an inconsistency. Extract the shared logic into a clearly named function or utility class.

**Caveat:** Not all duplication is bad. If extracting shared code would introduce dependencies between files or components that are otherwise independent, the coupling may cost more than the duplication. Prefer duplication over tight coupling between unrelated modules. Extract only when the duplicated code genuinely represents the same concept and would always change together.

---

### 25. Don't define the same constant twice

If two constants in different parts of the code contain the same list of values (e.g., one for forward processing and one for rollback), and one changes without the other, you get a silent bug.

**Instead:** Define once, reference everywhere. If different contexts need different subsets, make that explicit with named constants that clearly state their purpose and derive from a shared source.

---

### 26. Don't use string replacement on JSON

Converting an object to a JSON string, running regex replacements on it, and parsing it back is fragile. A value that happens to match the regex pattern as a literal string would be incorrectly replaced.

**Instead:** Walk the parsed object tree directly and transform in place. For example, to replace all `{"Ref": "paramName"}` objects with their resolved values:

```typescript
function resolveRefs(obj: unknown, paramMap: Map<string, string>): unknown {
  if (Array.isArray(obj)) return obj.map((item) => resolveRefs(item, paramMap));
  if (obj === null || typeof obj !== 'object') return obj;

  const record = obj as Record<string, unknown>;
  if ('Ref' in record && typeof record.Ref === 'string' && paramMap.has(record.Ref)) {
    return paramMap.get(record.Ref);
  }

  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, resolveRefs(value, paramMap)]));
}
```

This is type-safe, doesn't involve serialization, and the transformation logic is explicit and debuggable.

```typescript
const template = {
  Resources: {
    MyBucket: {
      Type: 'AWS::S3::Bucket',
      Properties: { BucketName: { Ref: 'BucketNameParam' } },
    },
  },
};

const paramMap = new Map([['BucketNameParam', 'my-actual-bucket']]);
const resolved = resolveRefs(template, paramMap);
// resolved.Resources.MyBucket.Properties.BucketName === 'my-actual-bucket'
```

---

### 27. Remove dead code

Unused functions, unreachable branches, and commented-out code are noise. If a function has a comment saying "this never gets used," that's a clear signal.

**Instead:** Delete it. Version control remembers.

---

### 28. Minimize indirection

A function that only calls another function with the same (or trivially derived) arguments adds a layer of indirection without adding value.

**Instead:** If the wrapper adds no logic, remove it and call the inner function directly. If it exists for API clarity, consider whether the naming alone justifies the extra hop.

---

### 29. Don't null-check the same value repeatedly

If you validate that `x` is defined at the top of a function, every subsequent `if (x)` on the same binding is noise. It signals the reader that `x` might still be null when it can't be.

**Instead:** Validate once, early. Use a type guard or assertion that narrows the type for the rest of the scope. If the value genuinely could become null later, that's a design problem — fix the data flow. See also point 9a for the structural solution to this problem.

---

## Style

### 30. Call chains should read like English

When you chain property access and method calls, the result should read as a short, natural phrase — not stutter or repeat context the reader already has. Each segment of the chain should add new information.

```typescript
// Bad — "fetcher" repeats what the reader already knows from the class name
gen1App.fetcher.fetchUserPool(resources);
gen1App.authDefinitionFetcher.getDefinition();

// Good — reads like a sentence: "from the gen1 app's AWS [layer], fetch the user pool"
gen1App.aws.fetchUserPool(resources);
gen1App.meta.auth;

// Bad — stutters on "storage"
storageService.getStorageBucket();

// Good
storageService.getBucket();
```

The test: read the full chain aloud. If it sounds like something a developer would say to a colleague ("get the user pool from the gen1 app's AWS client"), the naming is right. If it sounds robotic or redundant ("use the gen1 app's fetcher to fetch the user pool"), rename until the stutter disappears.

---

### 31. Use explicit visibility modifiers on class members

Every class method and property should have an explicit `public`, `private`, or `protected` modifier. Omitting the modifier forces the reader to remember that TypeScript defaults to `public` — and more importantly, it makes intent ambiguous: did the author mean for this to be public, or did they just forget?

**Instead:** Always write the modifier. `public` signals "this is part of the contract," `private` signals "this is an implementation detail." The explicitness costs nothing and removes guesswork.

---

### 32. Use multi-line JSDoc comments for public members

Document public methods, properties, and exported declarations with multi-line JSDoc comments. Always use the multi-line format — even for single sentences:

```typescript
// Bad — single-line JSDoc
/** Resolves the backend environment. */
public async fetchBackendEnvironment(): Promise<BackendEnvironment> { ... }

// Good — multi-line JSDoc
/**
 * Resolves and caches the backend environment.
 */
public async fetchBackendEnvironment(): Promise<BackendEnvironment> { ... }
```

The multi-line format is visually distinct from code, scales naturally when you add `@param` or `@returns` tags later, and reads consistently regardless of comment length. Reserve `//` for inline implementation notes, eslint/tsc directives, and TODOs.

---

### 33. Add a blank line after documented class members

When a class property has a JSDoc comment, add a blank line after the property declaration to visually separate it from the next member. Undocumented properties can remain consecutive.

```typescript
// Bad — documented property jammed against the next one
export class MyService {
  /**
   * The AWS region for this service.
   */
  public readonly region: string;
  private cachedResult: string | undefined;
}

// Good — blank line after the documented property
export class MyService {
  /**
   * The AWS region for this service.
   */
  public readonly region: string;

  private cachedResult: string | undefined;
}
```

---

### 34. Known values belong in the constructor

If a value is known at construction time and doesn't change, pass it to the constructor — not to every method that needs it. This avoids threading the same value through multiple call sites and makes the dependency explicit.

```typescript
// Bad — envName passed to render() even though it's known at construction
const renderer = new DataRenderer();
renderer.render({ envName, schema, tableMappings });

// Good — envName set once in the constructor
const renderer = new DataRenderer(envName);
renderer.render({ schema, tableMappings });
```

---

### 35. Don't use dynamic import expressions for types

Inline `import('some-package').SomeType` expressions in type positions make the code harder to read and create implicit dependencies that aren't visible in the import block. If the type comes from untyped JSON, use `any` explicitly. If you need the type, add a proper import at the top of the file.

```typescript
// Bad — dynamic import expression buried in a function call
const nodes = renderer.render({
  authorizationModes: authModes as import('@aws-amplify/backend-data').AuthorizationModes,
});

// Good — if the data is untyped JSON, say so
const nodes = renderer.render({
  authorizationModes: authModes, // any — from amplify-meta.json
});
```
