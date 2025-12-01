import { getAuthDefinition } from './index';
import { IdentityProviderTypeType } from '@aws-sdk/client-cognito-identity-provider';

describe('Auth Generator - Provider-Specific Scopes', () => {
  it('should extract provider-specific scopes from ProviderDetails', () => {
    const mockIdentityProvidersDetails = [
      {
        ProviderType: IdentityProviderTypeType.Google,
        ProviderName: 'Google',
        ProviderDetails: {
          client_id: '911159018992-rnun5p7a6imtf206ci261m3s0jbap5ng.apps.googleusercontent.com',
          client_secret: 'GOCSPX-...',
          authorized_scopes: 'openid email profile',
        },
        AttributeMapping: {
          email: 'email',
          name: 'name',
        },
      },
      {
        ProviderType: IdentityProviderTypeType.Facebook,
        ProviderName: 'Facebook',
        ProviderDetails: {
          client_id: '1412236500618572',
          client_secret: '...',
          authorized_scopes: 'public_profile',
        },
        AttributeMapping: {
          email: 'email',
          name: 'name',
        },
      },
    ];

    const mockWebClient = {
      AllowedOAuthScopes: ['aws.cognito.signin.user.admin', 'email', 'openid', 'phone', 'profile'],
      CallbackURLs: ['http://localhost:3000/'],
      LogoutURLs: ['http://localhost:3000/'],
    };

    const mockUserPool = {
      EmailVerificationMessage: null,
      EmailVerificationSubject: null,
      SchemaAttributes: [],
    };

    const result = getAuthDefinition({
      userPool: mockUserPool,
      identityProviders: [{ ProviderType: IdentityProviderTypeType.Google }, { ProviderType: IdentityProviderTypeType.Facebook }],
      identityProvidersDetails: mockIdentityProvidersDetails,
      webClient: mockWebClient,
    });

    // Test that provider-specific scopes are extracted
    expect(result.loginOptions?.googleScopes).toEqual(['openid', 'email', 'profile']);
    expect(result.loginOptions?.facebookScopes).toEqual(['profile']); // public_profile mapped to profile

    // Test that provider login flags are set
    expect(result.loginOptions?.googleLogin).toBe(true);
    expect(result.loginOptions?.facebookLogin).toBe(true);

    // Test that global scopes are still present (for backward compatibility)
    expect(result.loginOptions?.scopes).toEqual(['aws.cognito.signin.user.admin', 'email', 'openid', 'phone', 'profile']);
  });

  it('should handle providers without scopes gracefully', () => {
    const mockIdentityProvidersDetails = [
      {
        ProviderType: IdentityProviderTypeType.Google,
        ProviderName: 'Google',
        ProviderDetails: {
          client_id: '911159018992-rnun5p7a6imtf206ci261m3s0jbap5ng.apps.googleusercontent.com',
          client_secret: 'GOCSPX-...',
          // No authorized_scopes field
        },
        AttributeMapping: {
          email: 'email',
        },
      },
    ];

    const mockUserPool = {
      EmailVerificationMessage: null,
      EmailVerificationSubject: null,
      SchemaAttributes: [],
    };

    const result = getAuthDefinition({
      userPool: mockUserPool,
      identityProviders: [{ ProviderType: IdentityProviderTypeType.Google }],
      identityProvidersDetails: mockIdentityProvidersDetails,
      webClient: {},
    });

    // Should not have provider-specific scopes if not present in ProviderDetails
    expect(result.loginOptions?.googleScopes).toBeUndefined();
    expect(result.loginOptions?.googleLogin).toBe(true);
  });

  it('should map Facebook public_profile to Cognito profile scope', () => {
    const mockIdentityProvidersDetails = [
      {
        ProviderType: IdentityProviderTypeType.Facebook,
        ProviderName: 'Facebook',
        ProviderDetails: {
          client_id: '1412236500618572',
          client_secret: '...',
          authorized_scopes: 'public_profile email',
        },
      },
    ];

    const mockUserPool = {
      EmailVerificationMessage: null,
      EmailVerificationSubject: null,
      SchemaAttributes: [],
    };

    const result = getAuthDefinition({
      userPool: mockUserPool,
      identityProviders: [{ ProviderType: IdentityProviderTypeType.Facebook }],
      identityProvidersDetails: mockIdentityProvidersDetails,
      webClient: {},
    });

    // public_profile should be mapped to profile
    expect(result.loginOptions?.facebookScopes).toEqual(['profile', 'email']);
  });

  it('should filter out invalid scopes', () => {
    const mockIdentityProvidersDetails = [
      {
        ProviderType: IdentityProviderTypeType.Google,
        ProviderName: 'Google',
        ProviderDetails: {
          client_id: '911159018992-rnun5p7a6imtf206ci261m3s0jbap5ng.apps.googleusercontent.com',
          client_secret: 'GOCSPX-...',
          authorized_scopes: 'openid email profile invalid_scope another_invalid',
        },
      },
    ];

    const mockUserPool = {
      EmailVerificationMessage: null,
      EmailVerificationSubject: null,
      SchemaAttributes: [],
    };

    const result = getAuthDefinition({
      userPool: mockUserPool,
      identityProviders: [{ ProviderType: IdentityProviderTypeType.Google }],
      identityProvidersDetails: mockIdentityProvidersDetails,
      webClient: {},
    });

    // Should only include valid Cognito scopes
    expect(result.loginOptions?.googleScopes).toEqual(['openid', 'email', 'profile']);
  });
});
