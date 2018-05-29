"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var logger_1 = require("./logger");
var postprocess_1 = require("./postprocess");
var utils_1 = require("./utils");
var transpiler_1 = require("./transpiler");
function process(src, filePath, jestConfig, transformOptions) {
    if (transformOptions === void 0) { transformOptions = { instrument: false }; }
    var compilerOptions = utils_1.getTSConfig(jestConfig.globals, jestConfig.rootDir);
    logger_1.logOnce('final compilerOptions:', compilerOptions);
    var isTsFile = /\.tsx?$/.test(filePath);
    var isJsFile = /\.jsx?$/.test(filePath);
    var isHtmlFile = /\.html$/.test(filePath);
    if (isHtmlFile && jestConfig.globals.__TRANSFORM_HTML__) {
        src = 'module.exports=`' + src + '`;';
    }
    var processFile = compilerOptions.allowJs === true ? isTsFile || isJsFile : isTsFile;
    if (!processFile) {
        return src;
    }
    var tsJestConfig = utils_1.getTSJestConfig(jestConfig.globals);
    logger_1.logOnce('tsJestConfig: ', tsJestConfig);
    if (tsJestConfig.enableTsDiagnostics) {
        utils_1.runTsDiagnostics(filePath, compilerOptions);
    }
    var tsTranspiledText = transpiler_1.transpileTypescript(filePath, src, compilerOptions, tsJestConfig);
    if (tsJestConfig.ignoreCoverageForAllDecorators === true) {
        tsTranspiledText = tsTranspiledText.replace(/__decorate/g, '/* istanbul ignore next */__decorate');
    }
    if (tsJestConfig.ignoreCoverageForDecorators === true) {
        tsTranspiledText = tsTranspiledText.replace(/(__decorate\(\[\r?\n[^\n\r]*)\/\*\s*istanbul\s*ignore\s*decorator(.*)\*\//g, '/* istanbul ignore next$2*/$1');
    }
    var outputText = postprocess_1.postProcessCode(compilerOptions, jestConfig, tsJestConfig, transformOptions, tsTranspiledText, filePath);
    var modified = tsJestConfig.disableSourceMapSupport === true
        ? outputText
        : utils_1.injectSourcemapHook(filePath, tsTranspiledText, outputText);
    logger_1.flushLogs();
    return modified;
}
exports.process = process;
function getCacheKey(fileData, filePath, jestConfigStr, transformOptions) {
    if (transformOptions === void 0) { transformOptions = { instrument: false }; }
    var jestConfig = JSON.parse(jestConfigStr);
    var tsConfig = utils_1.getTSConfig(jestConfig.globals, jestConfig.rootDir);
    return crypto
        .createHash('md5')
        .update(JSON.stringify(tsConfig), 'utf8')
        .update(JSON.stringify(transformOptions), 'utf8')
        .update(fileData + filePath + jestConfigStr, 'utf8')
        .digest('hex');
}
exports.getCacheKey = getCacheKey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlcHJvY2Vzc29yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3ByZXByb2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUFpQztBQUVqQyxtQ0FBOEM7QUFDOUMsNkNBQW9FO0FBQ3BFLGlDQUtpQjtBQUNqQiwyQ0FBbUQ7QUFFbkQsaUJBQ0UsR0FBVyxFQUNYLFFBQWMsRUFDZCxVQUFzQixFQUN0QixnQkFBMEQ7SUFBMUQsaUNBQUEsRUFBQSxxQkFBdUMsVUFBVSxFQUFFLEtBQUssRUFBRTtJQUkxRCxJQUFNLGVBQWUsR0FBRyxtQkFBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTVFLGdCQUFPLENBQUMsd0JBQXdCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFbkQsSUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxJQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLElBQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFHNUMsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRTtRQUN2RCxHQUFHLEdBQUcsa0JBQWtCLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztLQUN2QztJQUVELElBQU0sV0FBVyxHQUNmLGVBQWUsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7SUFFckUsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoQixPQUFPLEdBQUcsQ0FBQztLQUNaO0lBRUQsSUFBTSxZQUFZLEdBQUcsdUJBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDekQsZ0JBQU8sQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUl4QyxJQUFJLFlBQVksQ0FBQyxtQkFBbUIsRUFBRTtRQUNwQyx3QkFBZ0IsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDN0M7SUFFRCxJQUFJLGdCQUFnQixHQUFHLGdDQUFtQixDQUN4QyxRQUFRLEVBQ1IsR0FBRyxFQUNILGVBQWUsRUFDZixZQUFZLENBQ2IsQ0FBQztJQUVGLElBQUksWUFBWSxDQUFDLDhCQUE4QixLQUFLLElBQUksRUFBRTtRQUN4RCxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQ3pDLGFBQWEsRUFDYixzQ0FBc0MsQ0FDdkMsQ0FBQztLQUNIO0lBQ0QsSUFBSSxZQUFZLENBQUMsMkJBQTJCLEtBQUssSUFBSSxFQUFFO1FBQ3JELGdCQUFnQixHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FDekMsNEVBQTRFLEVBQzVFLCtCQUErQixDQUNoQyxDQUFDO0tBQ0g7SUFFRCxJQUFNLFVBQVUsR0FBRyw2QkFBZSxDQUNoQyxlQUFlLEVBQ2YsVUFBVSxFQUNWLFlBQVksRUFDWixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLFFBQVEsQ0FDVCxDQUFDO0lBRUYsSUFBTSxRQUFRLEdBQ1osWUFBWSxDQUFDLHVCQUF1QixLQUFLLElBQUk7UUFDM0MsQ0FBQyxDQUFDLFVBQVU7UUFDWixDQUFDLENBQUMsMkJBQW1CLENBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRWxFLGtCQUFTLEVBQUUsQ0FBQztJQUVaLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUExRUQsMEJBMEVDO0FBS0QscUJBQ0UsUUFBZ0IsRUFDaEIsUUFBYyxFQUNkLGFBQXFCLEVBQ3JCLGdCQUEwRDtJQUExRCxpQ0FBQSxFQUFBLHFCQUF1QyxVQUFVLEVBQUUsS0FBSyxFQUFFO0lBRTFELElBQU0sVUFBVSxHQUFlLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFekQsSUFBTSxRQUFRLEdBQUcsbUJBQVcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVyRSxPQUFPLE1BQU07U0FDVixVQUFVLENBQUMsS0FBSyxDQUFDO1NBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sQ0FBQztTQUN4QyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sQ0FBQztTQUNoRCxNQUFNLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxhQUFhLEVBQUUsTUFBTSxDQUFDO1NBQ25ELE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQixDQUFDO0FBaEJELGtDQWdCQyJ9