export const originUrl = 'https://dracarys.app';
// export const originUrl = 'http://localhost:3000';

export const amplifyAdminUrl = (appId: string, envName: string) => `${originUrl}/admin/${appId}/${envName}/verify/`;
