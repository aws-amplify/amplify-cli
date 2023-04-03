"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CLIVersionController_getCLIPathSpy;
Object.defineProperty(exports, "__esModule", { value: true });
exports.cliVersionController = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const execa_1 = __importDefault(require("execa"));
const e2eCore = __importStar(require("."));
/**
 * Mocks `getCLIpath` with the path to a specific version of Amplify.
 *
 * Ideally we could use this in migration tests directly without spying on getCLIPath but that's going to require a larger test refactoring
 *
 * Be careful if using this class with test.concurrent as one test may step on the version of another test.
 */
class CLIVersionController {
    constructor() {
        _CLIVersionController_getCLIPathSpy.set(this, void 0);
        /**
         * All CLI calls (that use getCLIVersion) will use the specified CLI version
         */
        this.useCliVersion = (version) => __awaiter(this, void 0, void 0, function* () {
            const overridePath = yield this.getCLIVersionPath(version);
            __classPrivateFieldSet(this, _CLIVersionController_getCLIPathSpy, jest.spyOn(e2eCore, 'getCLIPath'), "f");
            __classPrivateFieldGet(this, _CLIVersionController_getCLIPathSpy, "f").mockReturnValue(overridePath);
        });
        /**
         * Resets getCLIVersion to its original implementation
         */
        this.resetCliVersion = () => {
            if (__classPrivateFieldGet(this, _CLIVersionController_getCLIPathSpy, "f")) {
                __classPrivateFieldGet(this, _CLIVersionController_getCLIPathSpy, "f").mockRestore();
            }
        };
        this.getCLIVersionPath = (version) => __awaiter(this, void 0, void 0, function* () {
            const versioningRoot = path.join(os.homedir(), '.amplify', 'versions');
            yield fs.ensureDir(versioningRoot);
            const relativePathToAmplfiy = path.join('node_modules', '@aws-amplify', 'cli', 'bin', 'amplify');
            const versionRoot = path.join(versioningRoot, version);
            const versionPath = path.join(versionRoot, relativePathToAmplfiy);
            if (fs.existsSync(versionPath)) {
                return versionPath;
            }
            // need to install the specified version
            yield (0, execa_1.default)('npm', ['install', '--prefix', versionRoot, `@aws-amplify/cli@${version}`]);
            return versionPath;
        });
    }
}
_CLIVersionController_getCLIPathSpy = new WeakMap();
exports.cliVersionController = new CLIVersionController();
//# sourceMappingURL=cli-version-controller.js.map