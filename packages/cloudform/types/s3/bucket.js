"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class BucketEncryption {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BucketEncryption = BucketEncryption;
class NotificationFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NotificationFilter = NotificationFilter;
class RoutingRuleCondition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RoutingRuleCondition = RoutingRuleCondition;
class LifecycleConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LifecycleConfiguration = LifecycleConfiguration;
class LambdaConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LambdaConfiguration = LambdaConfiguration;
class ReplicationRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ReplicationRule = ReplicationRule;
class CorsRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CorsRule = CorsRule;
class Destination {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Destination = Destination;
class ServerSideEncryptionRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ServerSideEncryptionRule = ServerSideEncryptionRule;
class AnalyticsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AnalyticsConfiguration = AnalyticsConfiguration;
class SourceSelectionCriteria {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SourceSelectionCriteria = SourceSelectionCriteria;
class LoggingConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.LoggingConfiguration = LoggingConfiguration;
class StorageClassAnalysis {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.StorageClassAnalysis = StorageClassAnalysis;
class RoutingRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RoutingRule = RoutingRule;
class AccessControlTranslation {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AccessControlTranslation = AccessControlTranslation;
class VersioningConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VersioningConfiguration = VersioningConfiguration;
class EncryptionConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EncryptionConfiguration = EncryptionConfiguration;
class NotificationConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NotificationConfiguration = NotificationConfiguration;
class ServerSideEncryptionByDefault {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ServerSideEncryptionByDefault = ServerSideEncryptionByDefault;
class RedirectRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RedirectRule = RedirectRule;
class RedirectAllRequestsTo {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.RedirectAllRequestsTo = RedirectAllRequestsTo;
class S3KeyFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.S3KeyFilter = S3KeyFilter;
class InventoryConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.InventoryConfiguration = InventoryConfiguration;
class WebsiteConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.WebsiteConfiguration = WebsiteConfiguration;
class ReplicationConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ReplicationConfiguration = ReplicationConfiguration;
class SseKmsEncryptedObjects {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SseKmsEncryptedObjects = SseKmsEncryptedObjects;
class Rule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Rule = Rule;
class QueueConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.QueueConfiguration = QueueConfiguration;
class TopicConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TopicConfiguration = TopicConfiguration;
class MetricsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.MetricsConfiguration = MetricsConfiguration;
class TagFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TagFilter = TagFilter;
class Transition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Transition = Transition;
class DataExport {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DataExport = DataExport;
class CorsConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CorsConfiguration = CorsConfiguration;
class ReplicationDestination {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.ReplicationDestination = ReplicationDestination;
class AccelerateConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AccelerateConfiguration = AccelerateConfiguration;
class NoncurrentVersionTransition {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NoncurrentVersionTransition = NoncurrentVersionTransition;
class AbortIncompleteMultipartUpload {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AbortIncompleteMultipartUpload = AbortIncompleteMultipartUpload;
class FilterRule {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.FilterRule = FilterRule;
class Bucket extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::S3::Bucket', properties);
    }
}
Bucket.BucketEncryption = BucketEncryption;
Bucket.NotificationFilter = NotificationFilter;
Bucket.RoutingRuleCondition = RoutingRuleCondition;
Bucket.LifecycleConfiguration = LifecycleConfiguration;
Bucket.LambdaConfiguration = LambdaConfiguration;
Bucket.ReplicationRule = ReplicationRule;
Bucket.CorsRule = CorsRule;
Bucket.Destination = Destination;
Bucket.ServerSideEncryptionRule = ServerSideEncryptionRule;
Bucket.AnalyticsConfiguration = AnalyticsConfiguration;
Bucket.SourceSelectionCriteria = SourceSelectionCriteria;
Bucket.LoggingConfiguration = LoggingConfiguration;
Bucket.StorageClassAnalysis = StorageClassAnalysis;
Bucket.RoutingRule = RoutingRule;
Bucket.AccessControlTranslation = AccessControlTranslation;
Bucket.VersioningConfiguration = VersioningConfiguration;
Bucket.EncryptionConfiguration = EncryptionConfiguration;
Bucket.NotificationConfiguration = NotificationConfiguration;
Bucket.ServerSideEncryptionByDefault = ServerSideEncryptionByDefault;
Bucket.RedirectRule = RedirectRule;
Bucket.RedirectAllRequestsTo = RedirectAllRequestsTo;
Bucket.S3KeyFilter = S3KeyFilter;
Bucket.InventoryConfiguration = InventoryConfiguration;
Bucket.WebsiteConfiguration = WebsiteConfiguration;
Bucket.ReplicationConfiguration = ReplicationConfiguration;
Bucket.SseKmsEncryptedObjects = SseKmsEncryptedObjects;
Bucket.Rule = Rule;
Bucket.QueueConfiguration = QueueConfiguration;
Bucket.TopicConfiguration = TopicConfiguration;
Bucket.MetricsConfiguration = MetricsConfiguration;
Bucket.TagFilter = TagFilter;
Bucket.Transition = Transition;
Bucket.DataExport = DataExport;
Bucket.CorsConfiguration = CorsConfiguration;
Bucket.ReplicationDestination = ReplicationDestination;
Bucket.AccelerateConfiguration = AccelerateConfiguration;
Bucket.NoncurrentVersionTransition = NoncurrentVersionTransition;
Bucket.AbortIncompleteMultipartUpload = AbortIncompleteMultipartUpload;
Bucket.FilterRule = FilterRule;
exports.default = Bucket;
