"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var os_1 = require("os");
var sourceMapSupport = require("source-map-support");
var chalk_1 = require("chalk");
var mkdirp = require("mkdirp");
var crypto = require("crypto");
var yn = require("yn");
var arrify = require("arrify");
var make_error_1 = require("make-error");
var pkg = require('../package.json');
var shouldDebug = yn(process.env.TS_NODE_DEBUG);
var debug = shouldDebug ? console.log.bind(console, 'ts-node') : function () { return undefined; };
var debugFn = shouldDebug ?
    function (key, fn) {
        return function (x) {
            debug(key, x);
            return fn(x);
        };
    } :
    function (_, fn) { return fn; };
exports.VERSION = pkg.version;
exports.DEFAULTS = {
    cache: yn(process.env['TS_NODE_CACHE'], { default: true }),
    cacheDirectory: process.env['TS_NODE_CACHE_DIRECTORY'],
    compiler: process.env['TS_NODE_COMPILER'],
    compilerOptions: parse(process.env['TS_NODE_COMPILER_OPTIONS']),
    ignore: split(process.env['TS_NODE_IGNORE']),
    project: process.env['TS_NODE_PROJECT'],
    skipIgnore: yn(process.env['TS_NODE_SKIP_IGNORE']),
    skipProject: yn(process.env['TS_NODE_SKIP_PROJECT']),
    ignoreDiagnostics: split(process.env['TS_NODE_IGNORE_DIAGNOSTICS']),
    typeCheck: yn(process.env['TS_NODE_TYPE_CHECK'])
};
var DEFAULT_COMPILER_OPTIONS = {
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    declaration: false,
    noEmit: false,
    outDir: '$$ts-node$$'
};
function split(value) {
    return typeof value === 'string' ? value.split(/ *, */g) : undefined;
}
exports.split = split;
function parse(value) {
    return typeof value === 'string' ? JSON.parse(value) : undefined;
}
exports.parse = parse;
function normalizeSlashes(value) {
    return value.replace(/\\/g, '/');
}
exports.normalizeSlashes = normalizeSlashes;
var TSError = (function (_super) {
    __extends(TSError, _super);
    function TSError(diagnostics) {
        var _this = _super.call(this, "\u2A2F Unable to compile TypeScript\n" + diagnostics.map(function (x) { return x.message; }).join('\n')) || this;
        _this.diagnostics = diagnostics;
        _this.name = 'TSError';
        return _this;
    }
    return TSError;
}(make_error_1.BaseError));
exports.TSError = TSError;
function getTmpDir() {
    var hash = crypto.createHash('sha256').update(os_1.homedir(), 'utf8').digest('hex');
    return path_1.join(os_1.tmpdir(), "ts-node-" + hash);
}
function register(opts) {
    if (opts === void 0) { opts = {}; }
    var options = Object.assign({}, exports.DEFAULTS, opts);
    var cacheDirectory = options.cacheDirectory || getTmpDir();
    var originalJsHandler = require.extensions['.js'];
    var ignoreDiagnostics = arrify(options.ignoreDiagnostics).concat([
        6059,
        18002,
        18003
    ]).map(Number);
    var memoryCache = {
        contents: Object.create(null),
        versions: Object.create(null),
        outputs: Object.create(null)
    };
    var ignore = options.skipIgnore ? [] : arrify(options.ignore || '/node_modules/').map(function (str) { return new RegExp(str); });
    sourceMapSupport.install({
        environment: 'node',
        retrieveFile: function (path) {
            return memoryCache.outputs[path];
        }
    });
    var cwd = process.cwd();
    var compiler = options.compiler || 'typescript';
    var typeCheck = options.typeCheck || false;
    var ts = require(compiler);
    var transformers = options.transformers || undefined;
    var readFile = options.readFile || ts.sys.readFile;
    var fileExists = options.fileExists || ts.sys.fileExists;
    var config = readConfig(cwd, ts, options.compilerOptions, fileExists, readFile, options.project, options.skipProject);
    var configDiagnostics = filterDiagnostics(config.errors, ignoreDiagnostics);
    var extensions = ['.ts', '.tsx'];
    var cachedir = path_1.join(path_1.resolve(cwd, cacheDirectory), getCompilerDigest({ version: ts.version, typeCheck: typeCheck, ignoreDiagnostics: ignoreDiagnostics, config: config, compiler: compiler }));
    if (configDiagnostics.length) {
        throw new TSError(formatDiagnostics(configDiagnostics, cwd, ts, 0));
    }
    if (config.options.allowJs) {
        extensions.push('.js');
        extensions.push('.jsx');
    }
    for (var _i = 0, _a = config.fileNames; _i < _a.length; _i++) {
        var fileName = _a[_i];
        memoryCache.versions[fileName] = 1;
    }
    var getExtension = config.options.jsx === ts.JsxEmit.Preserve ?
        (function (path) { return /\.[tj]sx$/.test(path) ? '.jsx' : '.js'; }) :
        (function (_) { return '.js'; });
    var getOutput = function (code, fileName, lineOffset) {
        if (lineOffset === void 0) { lineOffset = 0; }
        var result = ts.transpileModule(code, {
            fileName: fileName,
            transformers: transformers,
            compilerOptions: config.options,
            reportDiagnostics: true
        });
        var diagnosticList = result.diagnostics ?
            filterDiagnostics(result.diagnostics, ignoreDiagnostics) :
            [];
        if (diagnosticList.length) {
            throw new TSError(formatDiagnostics(diagnosticList, cwd, ts, lineOffset));
        }
        return [result.outputText, result.sourceMapText];
    };
    var getTypeInfo = function (_code, _fileName, _position) {
        throw new TypeError("Type information is unavailable without \"--type-check\"");
    };
    if (typeCheck) {
        var updateMemoryCache_1 = function (code, fileName) {
            if (memoryCache.contents[fileName] !== code) {
                memoryCache.contents[fileName] = code;
                memoryCache.versions[fileName] = (memoryCache.versions[fileName] || 0) + 1;
            }
        };
        var serviceHost = {
            getScriptFileNames: function () { return Object.keys(memoryCache.versions); },
            getScriptVersion: function (fileName) {
                var version = memoryCache.versions[fileName];
                return version === undefined ? undefined : String(version);
            },
            getScriptSnapshot: function (fileName) {
                if (!memoryCache.contents[fileName]) {
                    var contents = readFile(fileName);
                    if (!contents)
                        return;
                    memoryCache.contents[fileName] = contents;
                }
                return ts.ScriptSnapshot.fromString(memoryCache.contents[fileName]);
            },
            fileExists: debugFn('fileExists', fileExists),
            readFile: debugFn('getFile', readFile),
            readDirectory: debugFn('readDirectory', ts.sys.readDirectory),
            getDirectories: debugFn('getDirectories', ts.sys.getDirectories),
            directoryExists: debugFn('directoryExists', ts.sys.directoryExists),
            getNewLine: function () { return os_1.EOL; },
            getCurrentDirectory: function () { return cwd; },
            getCompilationSettings: function () { return config.options; },
            getDefaultLibFileName: function () { return ts.getDefaultLibFilePath(config.options); },
            getCustomTransformers: function () { return transformers; }
        };
        var service_1 = ts.createLanguageService(serviceHost);
        getOutput = function (code, fileName, lineOffset) {
            if (lineOffset === void 0) { lineOffset = 0; }
            updateMemoryCache_1(code, fileName);
            var output = service_1.getEmitOutput(fileName);
            var diagnostics = service_1.getCompilerOptionsDiagnostics()
                .concat(service_1.getSyntacticDiagnostics(fileName))
                .concat(service_1.getSemanticDiagnostics(fileName));
            var diagnosticList = filterDiagnostics(diagnostics, ignoreDiagnostics);
            if (diagnosticList.length) {
                throw new TSError(formatDiagnostics(diagnosticList, cwd, ts, lineOffset));
            }
            if (output.emitSkipped) {
                throw new TypeError(path_1.relative(cwd, fileName) + ": Emit skipped");
            }
            if (output.outputFiles.length === 0) {
                throw new TypeError('Unable to require `.d.ts` file.\n' +
                    'This is usually the result of a faulty configuration or import. ' +
                    'Make sure there is a `.js`, `.json` or another executable extension and ' +
                    'loader (attached before `ts-node`) available alongside ' +
                    ("`" + path_1.basename(fileName) + "`."));
            }
            return [output.outputFiles[1].text, output.outputFiles[0].text];
        };
        getTypeInfo = function (code, fileName, position) {
            updateMemoryCache_1(code, fileName);
            var info = service_1.getQuickInfoAtPosition(fileName, position);
            var name = ts.displayPartsToString(info ? info.displayParts : []);
            var comment = ts.displayPartsToString(info ? info.documentation : []);
            return { name: name, comment: comment };
        };
    }
    var compile = readThrough(cachedir, options.cache === true, memoryCache, getOutput, getExtension);
    var register = { cwd: cwd, compile: compile, getTypeInfo: getTypeInfo, extensions: extensions, cachedir: cachedir, ts: ts };
    extensions.forEach(function (extension) {
        registerExtension(extension, ignore, register, originalJsHandler);
    });
    return register;
}
exports.register = register;
function shouldIgnore(filename, ignore) {
    var relname = normalizeSlashes(filename);
    return ignore.some(function (x) { return x.test(relname); });
}
function registerExtension(ext, ignore, register, originalHandler) {
    var old = require.extensions[ext] || originalHandler;
    require.extensions[ext] = function (m, filename) {
        if (shouldIgnore(filename, ignore)) {
            return old(m, filename);
        }
        var _compile = m._compile;
        m._compile = function (code, fileName) {
            debug('module._compile', fileName);
            return _compile.call(this, register.compile(code, fileName), fileName);
        };
        return old(m, filename);
    };
}
function fixConfig(ts, config) {
    delete config.options.out;
    delete config.options.outFile;
    delete config.options.declarationDir;
    if (config.options.target === undefined) {
        config.options.target = ts.ScriptTarget.ES5;
    }
    if (config.options.module === undefined) {
        config.options.module = ts.ModuleKind.CommonJS;
    }
    return config;
}
function readConfig(cwd, ts, compilerOptions, fileExists, readFile, project, noProject) {
    var config = { compilerOptions: {} };
    var basePath = cwd;
    var configFileName = undefined;
    if (!noProject) {
        configFileName = project ? path_1.resolve(cwd, project) : ts.findConfigFile(cwd, fileExists);
        if (configFileName) {
            var result = ts.readConfigFile(configFileName, readFile);
            if (result.error) {
                throw new TSError([formatDiagnostic(result.error, cwd, ts, 0)]);
            }
            config = result.config;
            basePath = normalizeSlashes(path_1.dirname(configFileName));
        }
    }
    config.compilerOptions = Object.assign({}, config.compilerOptions, compilerOptions, DEFAULT_COMPILER_OPTIONS);
    return fixConfig(ts, ts.parseJsonConfigFileContent(config, ts.sys, basePath, undefined, configFileName));
}
function readThrough(cachedir, shouldCache, memoryCache, compile, getExtension) {
    if (shouldCache === false) {
        return function (code, fileName, lineOffset) {
            debug('readThrough', fileName);
            var _a = compile(code, fileName, lineOffset), value = _a[0], sourceMap = _a[1];
            var output = updateOutput(value, fileName, sourceMap, getExtension);
            memoryCache.outputs[fileName] = output;
            return output;
        };
    }
    mkdirp.sync(cachedir);
    return function (code, fileName, lineOffset) {
        debug('readThrough', fileName);
        var cachePath = path_1.join(cachedir, getCacheName(code, fileName));
        var extension = getExtension(fileName);
        var outputPath = "" + cachePath + extension;
        try {
            var output_1 = fs_1.readFileSync(outputPath, 'utf8');
            if (isValidCacheContent(output_1)) {
                memoryCache.outputs[fileName] = output_1;
                return output_1;
            }
        }
        catch (err) { }
        var _a = compile(code, fileName, lineOffset), value = _a[0], sourceMap = _a[1];
        var output = updateOutput(value, fileName, sourceMap, getExtension);
        memoryCache.outputs[fileName] = output;
        fs_1.writeFileSync(outputPath, output);
        return output;
    };
}
function updateOutput(outputText, fileName, sourceMap, getExtension) {
    var base64Map = new Buffer(updateSourceMap(sourceMap, fileName), 'utf8').toString('base64');
    var sourceMapContent = "data:application/json;charset=utf-8;base64," + base64Map;
    var sourceMapLength = (path_1.basename(fileName) + ".map").length + (getExtension(fileName).length - path_1.extname(fileName).length);
    return outputText.slice(0, -sourceMapLength) + sourceMapContent;
}
function updateSourceMap(sourceMapText, fileName) {
    var sourceMap = JSON.parse(sourceMapText);
    sourceMap.file = fileName;
    sourceMap.sources = [fileName];
    delete sourceMap.sourceRoot;
    return JSON.stringify(sourceMap);
}
function getCacheName(sourceCode, fileName) {
    return crypto.createHash('sha256')
        .update(path_1.extname(fileName), 'utf8')
        .update('\x001\x00', 'utf8')
        .update(sourceCode, 'utf8')
        .digest('hex');
}
function isValidCacheContent(contents) {
    return /(?:9|0=|Q==)$/.test(contents.slice(-3));
}
function getCompilerDigest(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj), 'utf8').digest('hex');
}
function filterDiagnostics(diagnostics, ignore) {
    return diagnostics.filter(function (x) { return ignore.indexOf(x.code) === -1; });
}
function formatDiagnostics(diagnostics, cwd, ts, lineOffset) {
    return diagnostics.map(function (x) { return formatDiagnostic(x, cwd, ts, lineOffset); });
}
exports.formatDiagnostics = formatDiagnostics;
function formatDiagnostic(diagnostic, cwd, ts, lineOffset) {
    var messageText = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    var code = diagnostic.code;
    if (diagnostic.file) {
        var path = path_1.relative(cwd, diagnostic.file.fileName);
        if (diagnostic.start) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            var message = path + " (" + (line + 1 + lineOffset) + "," + (character + 1) + "): " + messageText + " (" + code + ")";
            return { message: message, code: code };
        }
        return { message: path + ": " + messageText + " (" + code + ")", code: code };
    }
    return { message: messageText + " (" + code + ")", code: code };
}
exports.formatDiagnostic = formatDiagnostic;
function printError(error) {
    var title = chalk_1.default.red('⨯') + " Unable to compile TypeScript";
    return chalk_1.default.bold(title) + "\n" + error.diagnostics.map(function (x) { return x.message; }).join('\n');
}
exports.printError = printError;
//# sourceMappingURL=index.js.map