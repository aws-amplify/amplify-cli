"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var profile_helper_1 = require("./profile-helper");
process.nextTick(function () {
    try {
        (0, profile_helper_1.setupAWSProfile)();
    }
    catch (e) {
        console.log(e.stack);
        process.exit(1);
    }
});
//# sourceMappingURL=setup-profile.js.map