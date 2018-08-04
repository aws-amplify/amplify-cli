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
var InvalidTransformerError = /** @class */ (function (_super) {
    __extends(InvalidTransformerError, _super);
    function InvalidTransformerError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "InvalidTransformerError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, InvalidTransformerError);
        }
        return _this;
    }
    return InvalidTransformerError;
}(Error));
exports.InvalidTransformerError = InvalidTransformerError;
var InvalidDirectiveDefinitionError = /** @class */ (function (_super) {
    __extends(InvalidDirectiveDefinitionError, _super);
    function InvalidDirectiveDefinitionError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "InvalidDirectiveDefinitionError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, InvalidDirectiveDefinitionError);
        }
        return _this;
    }
    return InvalidDirectiveDefinitionError;
}(Error));
exports.InvalidDirectiveDefinitionError = InvalidDirectiveDefinitionError;
var InvalidDirectiveError = /** @class */ (function (_super) {
    __extends(InvalidDirectiveError, _super);
    function InvalidDirectiveError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "InvalidDirectiveError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, InvalidDirectiveError);
        }
        return _this;
    }
    return InvalidDirectiveError;
}(Error));
exports.InvalidDirectiveError = InvalidDirectiveError;
var UnknownDirectiveError = /** @class */ (function (_super) {
    __extends(UnknownDirectiveError, _super);
    function UnknownDirectiveError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "UnknownDirectiveError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, UnknownDirectiveError);
        }
        return _this;
    }
    return UnknownDirectiveError;
}(Error));
exports.UnknownDirectiveError = UnknownDirectiveError;
//# sourceMappingURL=errors.js.map