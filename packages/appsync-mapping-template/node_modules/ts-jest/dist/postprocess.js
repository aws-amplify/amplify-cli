"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var babel = require("babel-core");
var babel_plugin_istanbul_1 = require("babel-plugin-istanbul");
var jestPreset = require("babel-preset-jest");
var logger_1 = require("./logger");
function postProcessCode(compilerOptions, jestConfig, tsJestConfig, transformOptions, transpiledText, filePath) {
    var postHook = exports.getPostProcessHook(compilerOptions, jestConfig, tsJestConfig);
    return postHook(transpiledText, filePath, jestConfig, transformOptions);
}
exports.postProcessCode = postProcessCode;
function createBabelTransformer(options) {
    options = __assign({}, options, { plugins: options.plugins || [], presets: (options.presets || []).concat([jestPreset]), retainLines: true, sourceMaps: 'inline' });
    delete options.cacheDirectory;
    delete options.filename;
    return function (src, filename, config, transformOptions) {
        var theseOptions = Object.assign({ filename: filename }, options);
        if (transformOptions && transformOptions.instrument) {
            theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
            theseOptions.plugins = theseOptions.plugins.concat([
                [
                    babel_plugin_istanbul_1.default,
                    {
                        cwd: config.rootDir,
                        exclude: [],
                    },
                ],
            ]);
        }
        return babel.transform(src, theseOptions).code;
    };
}
exports.getPostProcessHook = function (tsCompilerOptions, jestConfig, tsJestConfig) {
    if (tsJestConfig.skipBabel) {
        logger_1.logOnce('Not using any postprocess hook.');
        return function (src) { return src; };
    }
    var plugins = Array.from((tsJestConfig.babelConfig && tsJestConfig.babelConfig.plugins) || []);
    if (tsCompilerOptions.allowSyntheticDefaultImports) {
        plugins.push('transform-es2015-modules-commonjs');
    }
    var babelOptions = __assign({}, tsJestConfig.babelConfig, { babelrc: tsJestConfig.useBabelrc || false, plugins: plugins, presets: tsJestConfig.babelConfig ? tsJestConfig.babelConfig.presets : [] });
    logger_1.logOnce('Using babel with options:', babelOptions);
    return createBabelTransformer(babelOptions);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdHByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcG9zdHByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUlBLGtDQUFvQztBQUNwQywrREFBbUQ7QUFDbkQsOENBQWdEO0FBVWhELG1DQUFtQztBQUduQyx5QkFDRSxlQUFnQyxFQUNoQyxVQUFzQixFQUN0QixZQUEwQixFQUMxQixnQkFBa0MsRUFDbEMsY0FBc0IsRUFDdEIsUUFBZ0I7SUFFaEIsSUFBTSxRQUFRLEdBQUcsMEJBQWtCLENBQ2pDLGVBQWUsRUFDZixVQUFVLEVBQ1YsWUFBWSxDQUNiLENBQUM7SUFFRixPQUFPLFFBQVEsQ0FBQyxjQUFjLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFmRCwwQ0FlQztBQUVELGdDQUFnQyxPQUE4QjtJQUM1RCxPQUFPLGdCQUNGLE9BQU8sSUFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQzlCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFHckQsV0FBVyxFQUFFLElBQUksRUFHakIsVUFBVSxFQUFFLFFBQVEsR0FDckIsQ0FBQztJQUNGLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQztJQUM5QixPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFeEIsT0FBTyxVQUNMLEdBQVcsRUFDWCxRQUFnQixFQUNoQixNQUFrQixFQUNsQixnQkFBa0M7UUFFbEMsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsVUFBQSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUQsSUFBSSxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7WUFDbkQsWUFBWSxDQUFDLHNCQUFzQixHQUFHLHdCQUF3QixDQUFDO1lBRS9ELFlBQVksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ2pEO29CQUNFLCtCQUFjO29CQUNkO3dCQUVFLEdBQUcsRUFBRSxNQUFNLENBQUMsT0FBTzt3QkFDbkIsT0FBTyxFQUFFLEVBQUU7cUJBQ1o7aUJBQ0Y7YUFDRixDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2pELENBQUMsQ0FBQztBQUNKLENBQUM7QUFFWSxRQUFBLGtCQUFrQixHQUFHLFVBQ2hDLGlCQUFrQyxFQUNsQyxVQUFzQixFQUN0QixZQUEwQjtJQUUxQixJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUU7UUFDMUIsZ0JBQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sVUFBQSxHQUFHLElBQUksT0FBQSxHQUFHLEVBQUgsQ0FBRyxDQUFDO0tBQ25CO0lBRUQsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FDeEIsQ0FBQyxZQUFZLENBQUMsV0FBVyxJQUFJLFlBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUNyRSxDQUFDO0lBRUYsSUFBSSxpQkFBaUIsQ0FBQyw0QkFBNEIsRUFBRTtRQUNsRCxPQUFPLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7S0FDbkQ7SUFFRCxJQUFNLFlBQVksZ0JBQ2IsWUFBWSxDQUFDLFdBQVcsSUFDM0IsT0FBTyxFQUFFLFlBQVksQ0FBQyxVQUFVLElBQUksS0FBSyxFQUN6QyxPQUFPLFNBQUEsRUFDUCxPQUFPLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FDMUUsQ0FBQztJQUVGLGdCQUFPLENBQUMsMkJBQTJCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFbkQsT0FBTyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUM5QyxDQUFDLENBQUMifQ==