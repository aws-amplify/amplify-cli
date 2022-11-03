import { descopePackageName } from '../../utils/post-install-initialization';

describe('Resolve Package Root', () => {
  it('descope package name for scoped packages', () => {
    const scopedPackageName = '@aws-amplify/amplify-opensearch-siumulator';
    const descopedName = descopePackageName(scopedPackageName);
    expect(descopedName).toEqual('amplify-opensearch-siumulator');
  });

  it('descope package name for non-scoped packages', () => {
    const nonScopedPackageName = 'amplify-opensearch-siumulator';
    const descopedName = descopePackageName(nonScopedPackageName);
    expect(descopedName).toEqual(nonScopedPackageName);
  });
});
