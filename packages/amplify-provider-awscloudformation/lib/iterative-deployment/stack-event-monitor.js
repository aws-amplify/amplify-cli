"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackEventMonitor = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_logger_1 = require("../utils/aws-logger");
class StackEventMonitor {
    constructor(cfn, stackName, printerFn, addEventActivity, options) {
        this.cfn = cfn;
        this.stackName = stackName;
        this.printerFn = printerFn;
        this.addEventActivity = addEventActivity;
        this.active = false;
        this.startTime = Date.now();
        this.activity = {};
        this.completedStacks = new Set();
        this.stacksBeingMonitored = [this.stackName];
        this.lastPolledStackIndex = 0;
        this.options = { pollDelay: 5000, ...options };
        this.logger = (0, aws_logger_1.fileLogger)('stack-event-monitor');
        this.printerFn = printerFn;
    }
    start() {
        this.active = true;
        this.scheduleNextTick();
        return this;
    }
    async stop() {
        this.active = false;
        if (this.tickTimer) {
            clearTimeout(this.tickTimer);
        }
        await this.finalPollToEnd();
    }
    scheduleNextTick() {
        if (!this.active) {
            return;
        }
        this.tickTimer = setTimeout(() => void this.tick(), this.options.pollDelay);
    }
    async tick() {
        if (!this.active) {
            return;
        }
        this.readPromise = this.readNewEvents();
        await this.readPromise;
        this.readPromise = undefined;
        if (!this.active) {
            return;
        }
        this.printerFn();
        this.scheduleNextTick();
    }
    async readNewEvents() {
        var _a;
        const events = [];
        this.lastPolledStackIndex = (this.lastPolledStackIndex + 1) % this.stacksBeingMonitored.length;
        const stackName = this.stacksBeingMonitored[this.lastPolledStackIndex];
        if (!stackName) {
            return;
        }
        try {
            let nextToken;
            let finished = false;
            while (!finished) {
                const response = await this.cfn
                    .describeStackEvents({
                    StackName: stackName,
                    NextToken: nextToken,
                })
                    .promise();
                const eventPage = (_a = response === null || response === void 0 ? void 0 : response.StackEvents) !== null && _a !== void 0 ? _a : [];
                for (const event of eventPage) {
                    if (event.Timestamp.valueOf() < this.startTime) {
                        finished = true;
                        break;
                    }
                    if (event.EventId in this.activity) {
                        finished = true;
                        break;
                    }
                    if (event.ResourceType === 'AWS::CloudFormation::Stack') {
                        this.processNestedStack(event);
                        continue;
                    }
                    events.push((this.activity[event.EventId] = event));
                }
                nextToken = response === null || response === void 0 ? void 0 : response.NextToken;
                if (nextToken === undefined) {
                    finished = true;
                }
            }
        }
        catch (e) {
            this.logger('readNewEvents', [])(e);
            if (e.code === 'ValidationError' && e.message === `Stack [${this.stackName}] does not exist`) {
                return;
            }
            if (e.code !== 'Throttling') {
                throw new amplify_cli_core_1.AmplifyFault('NotImplementedFault', {
                    message: e.message,
                }, e);
            }
        }
        events.reverse();
        for (const event of events) {
            this.addEventActivity(event);
        }
    }
    processNestedStack(event) {
        if (event.ResourceType === 'AWS::CloudFormation::Stack') {
            const physicalResourceId = event.PhysicalResourceId;
            const idx = this.stacksBeingMonitored.indexOf(physicalResourceId);
            if (idx >= 0 && event.ResourceStatus.endsWith('_COMPLETE') && physicalResourceId !== this.stackName) {
                this.stacksBeingMonitored.splice(idx, 1);
                this.completedStacks.add(physicalResourceId);
            }
            else if (!this.completedStacks.has(physicalResourceId)) {
                this.stacksBeingMonitored.push(physicalResourceId);
            }
        }
    }
    async finalPollToEnd() {
        if (this.readPromise) {
            await this.readPromise;
        }
        await this.readNewEvents();
        this.printerFn();
    }
}
exports.StackEventMonitor = StackEventMonitor;
//# sourceMappingURL=stack-event-monitor.js.map