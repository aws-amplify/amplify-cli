"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreRollbackOperationHandler = exports.getHttpUrl = exports.getBucketKey = exports.getRollbackOperationHandler = exports.getDeploymentOperationHandler = exports.getRollbackActivityPollerHandler = exports.getDeploymentActivityPollerHandler = exports.isDeploymentComplete = exports.isRollbackComplete = exports.collectError = void 0;
const collectError = (context, err, meta) => {
    return {
        ...context,
        errors: [
            ...(context.errors ? context.errors : []),
            { error: err.data, stateValue: JSON.stringify(meta.state.value), currentIndex: context.currentIndex },
        ],
    };
};
exports.collectError = collectError;
const isRollbackComplete = (context) => {
    return context.currentIndex < 0;
};
exports.isRollbackComplete = isRollbackComplete;
const isDeploymentComplete = (context) => {
    return context.currentIndex >= context.stacks.length;
};
exports.isDeploymentComplete = isDeploymentComplete;
const getOperationPollerActivityHandler = (stackEventPollFn, operation) => {
    return (context) => {
        if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
            const stack = context.stacks[context.currentIndex];
            const step = operation == 'deploying' ? stack.deployment : stack.rollback;
            return stackEventPollFn(step);
        }
        return () => {
        };
    };
};
const getDeploymentActivityPollerHandler = (fn) => getOperationPollerActivityHandler(fn, 'deploying');
exports.getDeploymentActivityPollerHandler = getDeploymentActivityPollerHandler;
const getRollbackActivityPollerHandler = (fn) => getOperationPollerActivityHandler(fn, 'rollingback');
exports.getRollbackActivityPollerHandler = getRollbackActivityPollerHandler;
const getOperationHandler = (fn, operation) => {
    return (context) => {
        if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
            const stack = context.stacks[context.currentIndex];
            const step = operation == 'deploying' ? stack.deployment : stack.rollback;
            return fn(step);
        }
        return Promise.resolve();
    };
};
const getDeploymentOperationHandler = (fn) => getOperationHandler(fn, 'deploying');
exports.getDeploymentOperationHandler = getDeploymentOperationHandler;
const getRollbackOperationHandler = (fn) => getOperationHandler(fn, 'rollingback');
exports.getRollbackOperationHandler = getRollbackOperationHandler;
const getBucketKey = (keyOrUrl, bucketName) => {
    if (keyOrUrl.startsWith('https://') && keyOrUrl.includes(bucketName)) {
        return keyOrUrl.substring(keyOrUrl.indexOf(bucketName) + bucketName.length + 1);
    }
    return keyOrUrl;
};
exports.getBucketKey = getBucketKey;
const getHttpUrl = (keyOrUrl, bucketName) => {
    return keyOrUrl.startsWith('https://') ? keyOrUrl : `https://s3.amazonaws.com/${bucketName}/${keyOrUrl}`;
};
exports.getHttpUrl = getHttpUrl;
const getPreRollbackOperationHandler = (fn) => {
    return (context) => {
        if (context.previousDeploymentIndex >= 0 && context.previousDeploymentIndex < context.stacks.length) {
            const stack = context.stacks[context.previousDeploymentIndex];
            const step = stack.rollback;
            return fn(step);
        }
        return Promise.resolve();
    };
};
exports.getPreRollbackOperationHandler = getPreRollbackOperationHandler;
//# sourceMappingURL=helpers.js.map