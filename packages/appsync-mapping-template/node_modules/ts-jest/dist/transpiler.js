"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var process_1 = require("process");
var ts = require("typescript");
var logger_1 = require("./logger");
function transpileTypescript(filePath, fileSrc, compilerOptions, tsJestConfig) {
    if (tsJestConfig.useExperimentalLanguageServer) {
        logger_1.logOnce('Using experimental language server.');
        return transpileViaLanguageServer(filePath, fileSrc, compilerOptions);
    }
    logger_1.logOnce('Compiling via normal transpileModule call');
    return transpileViaTranspileModile(filePath, fileSrc, compilerOptions);
}
exports.transpileTypescript = transpileTypescript;
function transpileViaLanguageServer(filePath, fileSrc, compilerOptions) {
    var serviceHost = {
        getScriptFileNames: function () {
            return [filePath];
        },
        getScriptVersion: function (fileName) {
            return undefined;
        },
        getCurrentDirectory: function () {
            return process_1.cwd();
        },
        getScriptSnapshot: function (fileName) {
            if (fileName === filePath) {
                return ts.ScriptSnapshot.fromString(fileSrc);
            }
            var result = fs.readFileSync(fileName, 'utf8');
            return ts.ScriptSnapshot.fromString(result);
        },
        getCompilationSettings: function () {
            return compilerOptions;
        },
        getDefaultLibFileName: function () {
            return ts.getDefaultLibFilePath(compilerOptions);
        },
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        realpath: ts.sys.realpath,
        getDirectories: ts.sys.getDirectories,
        directoryExists: ts.sys.directoryExists,
    };
    var service = ts.createLanguageService(serviceHost);
    var serviceOutput = service.getEmitOutput(filePath);
    var files = serviceOutput.outputFiles.filter(function (file) {
        return file.name.endsWith('js');
    });
    logger_1.logOnce('JS files parsed', files.map(function (f) { return f.name; }));
    var diagnostics = service
        .getCompilerOptionsDiagnostics()
        .concat(service.getSyntacticDiagnostics(filePath))
        .concat(service.getSemanticDiagnostics(filePath));
    if (diagnostics.length > 0) {
        var errors = diagnostics.map(function (d) { return d.messageText; }) + "\n";
        logger_1.logOnce("Diagnostic errors from TSC: " + errors);
        throw Error("TSC language server encountered errors while transpiling. Errors: " + errors);
    }
    return files[0].text;
}
function transpileViaTranspileModile(filePath, fileSource, compilerOptions) {
    return ts.transpileModule(fileSource, {
        compilerOptions: compilerOptions,
        fileName: filePath,
    }).outputText;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNwaWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90cmFuc3BpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUJBQXlCO0FBQ3pCLG1DQUE4QjtBQUM5QiwrQkFBaUM7QUFDakMsbUNBQW1DO0FBSW5DLDZCQUNFLFFBQWdCLEVBQ2hCLE9BQWUsRUFDZixlQUFtQyxFQUNuQyxZQUEwQjtJQUUxQixJQUFJLFlBQVksQ0FBQyw2QkFBNkIsRUFBRTtRQUM5QyxnQkFBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDL0MsT0FBTywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0tBQ3ZFO0lBQ0QsZ0JBQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sMkJBQTJCLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBWkQsa0RBWUM7QUFPRCxvQ0FDRSxRQUFnQixFQUNoQixPQUFlLEVBQ2YsZUFBbUM7SUFFbkMsSUFBTSxXQUFXLEdBQTJCO1FBRTFDLGtCQUFrQixFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsZ0JBQWdCLEVBQUUsVUFBQSxRQUFRO1lBRXhCLE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7UUFFRCxtQkFBbUIsRUFBRTtZQUNuQixPQUFPLGFBQUcsRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELGlCQUFpQixFQUFFLFVBQUEsUUFBUTtZQUN6QixJQUFJLFFBQVEsS0FBSyxRQUFRLEVBQUU7Z0JBRXpCLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDOUM7WUFFRCxJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqRCxPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxzQkFBc0IsRUFBRTtZQUN0QixPQUFPLGVBQWUsQ0FBQztRQUN6QixDQUFDO1FBRUQscUJBQXFCLEVBQUU7WUFDckIsT0FBTyxFQUFFLENBQUMscUJBQXFCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUNELFVBQVUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVU7UUFDN0IsUUFBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUTtRQUN6QixhQUFhLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhO1FBQ25DLFFBQVEsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVE7UUFDekIsY0FBYyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYztRQUNyQyxlQUFlLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxlQUFlO0tBQ3hDLENBQUM7SUFDRixJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEQsSUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0RCxJQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUk7UUFFakQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDLENBQUMsQ0FBQztJQUNILGdCQUFPLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLEVBQU4sQ0FBTSxDQUFDLENBQUMsQ0FBQztJQUduRCxJQUFNLFdBQVcsR0FBRyxPQUFPO1NBQ3hCLDZCQUE2QixFQUFFO1NBQy9CLE1BQU0sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDakQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRXBELElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDMUIsSUFBTSxNQUFNLEdBQU0sV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxXQUFXLEVBQWIsQ0FBYSxDQUFDLE9BQUksQ0FBQztRQUMxRCxnQkFBTyxDQUFDLGlDQUErQixNQUFRLENBQUMsQ0FBQztRQUVqRCxNQUFNLEtBQUssQ0FDVCx1RUFBcUUsTUFBUSxDQUM5RSxDQUFDO0tBQ0g7SUFFRCxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdkIsQ0FBQztBQUtELHFDQUNFLFFBQWdCLEVBQ2hCLFVBQWtCLEVBQ2xCLGVBQW1DO0lBRW5DLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUU7UUFDcEMsZUFBZSxpQkFBQTtRQUNmLFFBQVEsRUFBRSxRQUFRO0tBQ25CLENBQUMsQ0FBQyxVQUFVLENBQUM7QUFDaEIsQ0FBQyJ9