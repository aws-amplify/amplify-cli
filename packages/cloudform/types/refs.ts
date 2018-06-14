import {Ref} from "./functions"
import {IntrinsicFunction} from "./dataTypes"

export const AccountId: IntrinsicFunction = Ref('AWS::AccountId')
export const NotificationARNs: IntrinsicFunction = Ref("AWS::NotificationARNs")
export const NoValue: IntrinsicFunction = Ref('AWS::NoValue')
export const Partition: IntrinsicFunction = Ref('AWS::Partition')
export const Region: IntrinsicFunction = Ref('AWS::Region')
export const StackId: IntrinsicFunction = Ref('AWS::StackId')
export const StackName: IntrinsicFunction = Ref('AWS::StackName')
export const URLSuffix: IntrinsicFunction = Ref('AWS::URLSuffix')