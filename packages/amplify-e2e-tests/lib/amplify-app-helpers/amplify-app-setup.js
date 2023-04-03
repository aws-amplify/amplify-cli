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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addIntegAccountInConfig = exports.amplifyPush = exports.amplifyModelgen = exports.amplifyAppReact = exports.amplifyAppAngular = exports.amplifyAppIos = exports.amplifyAppAndroid = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
var amplifyAppBinPath = path.join(__dirname, '..', '..', '..', 'amplify-app', 'bin', 'amplify-app');
var spawnCommand = (0, amplify_e2e_core_1.isCI)() ? 'amplify-app' : amplifyAppBinPath;
function amplifyAppAndroid(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(spawnCommand, ['--platform', 'android'], { cwd: projRoot, stripColors: true })
            .wait('Successfully created base Amplify Project')
            .wait('Amplify setup completed successfully')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyAppAndroid = amplifyAppAndroid;
function amplifyAppIos(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(spawnCommand, ['--platform', 'ios'], { cwd: projRoot, stripColors: true })
            .wait('Successfully created base Amplify Project')
            .wait('Amplify setup completed successfully')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyAppIos = amplifyAppIos;
function amplifyAppAngular(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(spawnCommand, [], { cwd: projRoot, stripColors: true })
            .wait('What type of app are you building')
            .sendCarriageReturn()
            .wait('What javascript framework are you using')
            .sendCarriageReturn()
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyAppAngular = amplifyAppAngular;
function amplifyAppReact(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(spawnCommand, [], { cwd: projRoot, stripColors: true })
            .wait('What type of app are you building')
            .sendCarriageReturn()
            .wait('What javascript framework are you using')
            .sendLine("".concat(amplify_e2e_core_1.KEY_DOWN_ARROW).concat(amplify_e2e_core_1.KEY_DOWN_ARROW).concat(amplify_e2e_core_1.KEY_DOWN_ARROW))
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyAppReact = amplifyAppReact;
function amplifyModelgen(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(npm, ['run', 'amplify-modelgen'], { cwd: projRoot, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyModelgen = amplifyModelgen;
function amplifyPush(projRoot) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(npm, ['run', 'amplify-push'], { cwd: projRoot, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyPush = amplifyPush;
function addIntegAccountInConfig(projRoot) {
    // add test account to config since no default account in circle ci
    if ((0, amplify_e2e_core_1.isCI)()) {
        var buildConfigPath = path.join(projRoot, 'amplify-build-config.json');
        var buildConfigFile = fs.readFileSync(buildConfigPath);
        var buildConfig = JSON.parse(buildConfigFile.toString());
        buildConfig.profile = 'amplify-integ-test-user';
        fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig));
    }
}
exports.addIntegAccountInConfig = addIntegAccountInConfig;
//# sourceMappingURL=amplify-app-setup.js.map