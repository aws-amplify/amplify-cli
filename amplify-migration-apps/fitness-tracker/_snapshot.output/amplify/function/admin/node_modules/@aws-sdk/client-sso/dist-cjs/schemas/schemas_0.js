"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logout$ = exports.ListAccounts$ = exports.ListAccountRoles$ = exports.GetRoleCredentials$ = exports.RoleInfo$ = exports.RoleCredentials$ = exports.LogoutRequest$ = exports.ListAccountsResponse$ = exports.ListAccountsRequest$ = exports.ListAccountRolesResponse$ = exports.ListAccountRolesRequest$ = exports.GetRoleCredentialsResponse$ = exports.GetRoleCredentialsRequest$ = exports.AccountInfo$ = exports.errorTypeRegistries = exports.UnauthorizedException$ = exports.TooManyRequestsException$ = exports.ResourceNotFoundException$ = exports.InvalidRequestException$ = exports.SSOServiceException$ = void 0;
const _AI = "AccountInfo";
const _ALT = "AccountListType";
const _ATT = "AccessTokenType";
const _GRC = "GetRoleCredentials";
const _GRCR = "GetRoleCredentialsRequest";
const _GRCRe = "GetRoleCredentialsResponse";
const _IRE = "InvalidRequestException";
const _L = "Logout";
const _LA = "ListAccounts";
const _LAR = "ListAccountsRequest";
const _LARR = "ListAccountRolesRequest";
const _LARRi = "ListAccountRolesResponse";
const _LARi = "ListAccountsResponse";
const _LARis = "ListAccountRoles";
const _LR = "LogoutRequest";
const _RC = "RoleCredentials";
const _RI = "RoleInfo";
const _RLT = "RoleListType";
const _RNFE = "ResourceNotFoundException";
const _SAKT = "SecretAccessKeyType";
const _STT = "SessionTokenType";
const _TMRE = "TooManyRequestsException";
const _UE = "UnauthorizedException";
const _aI = "accountId";
const _aKI = "accessKeyId";
const _aL = "accountList";
const _aN = "accountName";
const _aT = "accessToken";
const _ai = "account_id";
const _c = "client";
const _e = "error";
const _eA = "emailAddress";
const _ex = "expiration";
const _h = "http";
const _hE = "httpError";
const _hH = "httpHeader";
const _hQ = "httpQuery";
const _m = "message";
const _mR = "maxResults";
const _mr = "max_result";
const _nT = "nextToken";
const _nt = "next_token";
const _rC = "roleCredentials";
const _rL = "roleList";
const _rN = "roleName";
const _rn = "role_name";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sso";
const _sAK = "secretAccessKey";
const _sT = "sessionToken";
const _xasbt = "x-amz-sso_bearer_token";
const n0 = "com.amazonaws.sso";
const schema_1 = require("@smithy/core/schema");
const errors_1 = require("../models/errors");
const SSOServiceException_1 = require("../models/SSOServiceException");
const _s_registry = schema_1.TypeRegistry.for(_s);
exports.SSOServiceException$ = [-3, _s, "SSOServiceException", 0, [], []];
_s_registry.registerError(exports.SSOServiceException$, SSOServiceException_1.SSOServiceException);
const n0_registry = schema_1.TypeRegistry.for(n0);
exports.InvalidRequestException$ = [-3, n0, _IRE,
    { [_e]: _c, [_hE]: 400 },
    [_m],
    [0]
];
n0_registry.registerError(exports.InvalidRequestException$, errors_1.InvalidRequestException);
exports.ResourceNotFoundException$ = [-3, n0, _RNFE,
    { [_e]: _c, [_hE]: 404 },
    [_m],
    [0]
];
n0_registry.registerError(exports.ResourceNotFoundException$, errors_1.ResourceNotFoundException);
exports.TooManyRequestsException$ = [-3, n0, _TMRE,
    { [_e]: _c, [_hE]: 429 },
    [_m],
    [0]
];
n0_registry.registerError(exports.TooManyRequestsException$, errors_1.TooManyRequestsException);
exports.UnauthorizedException$ = [-3, n0, _UE,
    { [_e]: _c, [_hE]: 401 },
    [_m],
    [0]
];
n0_registry.registerError(exports.UnauthorizedException$, errors_1.UnauthorizedException);
exports.errorTypeRegistries = [
    _s_registry,
    n0_registry,
];
var AccessTokenType = [0, n0, _ATT, 8, 0];
var SecretAccessKeyType = [0, n0, _SAKT, 8, 0];
var SessionTokenType = [0, n0, _STT, 8, 0];
exports.AccountInfo$ = [3, n0, _AI,
    0,
    [_aI, _aN, _eA],
    [0, 0, 0]
];
exports.GetRoleCredentialsRequest$ = [3, n0, _GRCR,
    0,
    [_rN, _aI, _aT],
    [[0, { [_hQ]: _rn }], [0, { [_hQ]: _ai }], [() => AccessTokenType, { [_hH]: _xasbt }]], 3
];
exports.GetRoleCredentialsResponse$ = [3, n0, _GRCRe,
    0,
    [_rC],
    [[() => exports.RoleCredentials$, 0]]
];
exports.ListAccountRolesRequest$ = [3, n0, _LARR,
    0,
    [_aT, _aI, _nT, _mR],
    [[() => AccessTokenType, { [_hH]: _xasbt }], [0, { [_hQ]: _ai }], [0, { [_hQ]: _nt }], [1, { [_hQ]: _mr }]], 2
];
exports.ListAccountRolesResponse$ = [3, n0, _LARRi,
    0,
    [_nT, _rL],
    [0, () => RoleListType]
];
exports.ListAccountsRequest$ = [3, n0, _LAR,
    0,
    [_aT, _nT, _mR],
    [[() => AccessTokenType, { [_hH]: _xasbt }], [0, { [_hQ]: _nt }], [1, { [_hQ]: _mr }]], 1
];
exports.ListAccountsResponse$ = [3, n0, _LARi,
    0,
    [_nT, _aL],
    [0, () => AccountListType]
];
exports.LogoutRequest$ = [3, n0, _LR,
    0,
    [_aT],
    [[() => AccessTokenType, { [_hH]: _xasbt }]], 1
];
exports.RoleCredentials$ = [3, n0, _RC,
    0,
    [_aKI, _sAK, _sT, _ex],
    [0, [() => SecretAccessKeyType, 0], [() => SessionTokenType, 0], 1]
];
exports.RoleInfo$ = [3, n0, _RI,
    0,
    [_rN, _aI],
    [0, 0]
];
var __Unit = "unit";
var AccountListType = [1, n0, _ALT,
    0, () => exports.AccountInfo$
];
var RoleListType = [1, n0, _RLT,
    0, () => exports.RoleInfo$
];
exports.GetRoleCredentials$ = [9, n0, _GRC,
    { [_h]: ["GET", "/federation/credentials", 200] }, () => exports.GetRoleCredentialsRequest$, () => exports.GetRoleCredentialsResponse$
];
exports.ListAccountRoles$ = [9, n0, _LARis,
    { [_h]: ["GET", "/assignment/roles", 200] }, () => exports.ListAccountRolesRequest$, () => exports.ListAccountRolesResponse$
];
exports.ListAccounts$ = [9, n0, _LA,
    { [_h]: ["GET", "/assignment/accounts", 200] }, () => exports.ListAccountsRequest$, () => exports.ListAccountsResponse$
];
exports.Logout$ = [9, n0, _L,
    { [_h]: ["POST", "/logout", 200] }, () => exports.LogoutRequest$, () => __Unit
];
