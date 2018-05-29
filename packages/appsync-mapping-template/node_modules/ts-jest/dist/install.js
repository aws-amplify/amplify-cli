"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sourceMapSupport = require("source-map-support");
function install(filePath, fileContent) {
    var options = {};
    options.retrieveFile = function (path) { return (path === filePath ? fileContent : undefined); };
    options['environment'] = 'node';
    return sourceMapSupport.install(options);
}
exports.install = install;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscURBQXVEO0FBRXZELGlCQUF3QixRQUFnQixFQUFFLFdBQW1CO0lBQzNELElBQU0sT0FBTyxHQUE2QixFQUFFLENBQUM7SUFFN0MsT0FBTyxDQUFDLFlBQVksR0FBRyxVQUFBLElBQUksSUFBSSxPQUFBLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBN0MsQ0FBNkMsQ0FBQztJQUs3RSxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsTUFBTSxDQUFDO0lBR2hDLE9BQU8sZ0JBQWdCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFaRCwwQkFZQyJ9