"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tsc = require("typescript");
var utils_1 = require("./utils");
function transpileIfTypescript(path, contents, config, rootDir) {
    if (rootDir === void 0) { rootDir = ''; }
    if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {
        var transpiled = tsc.transpileModule(contents, {
            compilerOptions: utils_1.getTSConfig(config || utils_1.mockGlobalTSConfigSchema(global), rootDir),
            fileName: path,
        });
        return transpiled.outputText;
    }
    return contents;
}
exports.transpileIfTypescript = transpileIfTypescript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNwaWxlLWlmLXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zcGlsZS1pZi10cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdDQUFrQztBQUNsQyxpQ0FBZ0U7QUFFaEUsK0JBQ0UsSUFBSSxFQUNKLFFBQVEsRUFDUixNQUFPLEVBQ1AsT0FBb0I7SUFBcEIsd0JBQUEsRUFBQSxZQUFvQjtJQUVwQixJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQzNELElBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFO1lBQy9DLGVBQWUsRUFBRSxtQkFBVyxDQUMxQixNQUFNLElBQUksZ0NBQXdCLENBQUMsTUFBTSxDQUFDLEVBQzFDLE9BQU8sQ0FDUjtZQUNELFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDO0tBQzlCO0lBQ0QsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQWxCRCxzREFrQkMifQ==