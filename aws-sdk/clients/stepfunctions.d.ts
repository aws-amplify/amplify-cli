import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class StepFunctions extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: StepFunctions.Types.ClientConfiguration)
  config: Config & StepFunctions.Types.ClientConfiguration;
  /**
   * Creates an activity. An activity is a task which you write in any programming language and host on any machine which has access to AWS Step Functions. Activities must poll Step Functions using the GetActivityTask API action and respond using SendTask* API actions. This function lets Step Functions know the existence of your activity and returns an identifier for use in a state machine and when polling from the activity.
   */
  createActivity(params: StepFunctions.Types.CreateActivityInput, callback?: (err: AWSError, data: StepFunctions.Types.CreateActivityOutput) => void): Request<StepFunctions.Types.CreateActivityOutput, AWSError>;
  /**
   * Creates an activity. An activity is a task which you write in any programming language and host on any machine which has access to AWS Step Functions. Activities must poll Step Functions using the GetActivityTask API action and respond using SendTask* API actions. This function lets Step Functions know the existence of your activity and returns an identifier for use in a state machine and when polling from the activity.
   */
  createActivity(callback?: (err: AWSError, data: StepFunctions.Types.CreateActivityOutput) => void): Request<StepFunctions.Types.CreateActivityOutput, AWSError>;
  /**
   * Creates a state machine. A state machine consists of a collection of states that can do work (Task states), determine to which states to transition next (Choice states), stop an execution with an error (Fail states), and so on. State machines are specified using a JSON-based, structured language.
   */
  createStateMachine(params: StepFunctions.Types.CreateStateMachineInput, callback?: (err: AWSError, data: StepFunctions.Types.CreateStateMachineOutput) => void): Request<StepFunctions.Types.CreateStateMachineOutput, AWSError>;
  /**
   * Creates a state machine. A state machine consists of a collection of states that can do work (Task states), determine to which states to transition next (Choice states), stop an execution with an error (Fail states), and so on. State machines are specified using a JSON-based, structured language.
   */
  createStateMachine(callback?: (err: AWSError, data: StepFunctions.Types.CreateStateMachineOutput) => void): Request<StepFunctions.Types.CreateStateMachineOutput, AWSError>;
  /**
   * Deletes an activity.
   */
  deleteActivity(params: StepFunctions.Types.DeleteActivityInput, callback?: (err: AWSError, data: StepFunctions.Types.DeleteActivityOutput) => void): Request<StepFunctions.Types.DeleteActivityOutput, AWSError>;
  /**
   * Deletes an activity.
   */
  deleteActivity(callback?: (err: AWSError, data: StepFunctions.Types.DeleteActivityOutput) => void): Request<StepFunctions.Types.DeleteActivityOutput, AWSError>;
  /**
   * Deletes a state machine. This is an asynchronous operation: It sets the state machine's status to DELETING and begins the deletion process. Each state machine execution is deleted the next time it makes a state transition.  The state machine itself is deleted after all executions are completed or deleted. 
   */
  deleteStateMachine(params: StepFunctions.Types.DeleteStateMachineInput, callback?: (err: AWSError, data: StepFunctions.Types.DeleteStateMachineOutput) => void): Request<StepFunctions.Types.DeleteStateMachineOutput, AWSError>;
  /**
   * Deletes a state machine. This is an asynchronous operation: It sets the state machine's status to DELETING and begins the deletion process. Each state machine execution is deleted the next time it makes a state transition.  The state machine itself is deleted after all executions are completed or deleted. 
   */
  deleteStateMachine(callback?: (err: AWSError, data: StepFunctions.Types.DeleteStateMachineOutput) => void): Request<StepFunctions.Types.DeleteStateMachineOutput, AWSError>;
  /**
   * Describes an activity.
   */
  describeActivity(params: StepFunctions.Types.DescribeActivityInput, callback?: (err: AWSError, data: StepFunctions.Types.DescribeActivityOutput) => void): Request<StepFunctions.Types.DescribeActivityOutput, AWSError>;
  /**
   * Describes an activity.
   */
  describeActivity(callback?: (err: AWSError, data: StepFunctions.Types.DescribeActivityOutput) => void): Request<StepFunctions.Types.DescribeActivityOutput, AWSError>;
  /**
   * Describes an execution.
   */
  describeExecution(params: StepFunctions.Types.DescribeExecutionInput, callback?: (err: AWSError, data: StepFunctions.Types.DescribeExecutionOutput) => void): Request<StepFunctions.Types.DescribeExecutionOutput, AWSError>;
  /**
   * Describes an execution.
   */
  describeExecution(callback?: (err: AWSError, data: StepFunctions.Types.DescribeExecutionOutput) => void): Request<StepFunctions.Types.DescribeExecutionOutput, AWSError>;
  /**
   * Describes a state machine.
   */
  describeStateMachine(params: StepFunctions.Types.DescribeStateMachineInput, callback?: (err: AWSError, data: StepFunctions.Types.DescribeStateMachineOutput) => void): Request<StepFunctions.Types.DescribeStateMachineOutput, AWSError>;
  /**
   * Describes a state machine.
   */
  describeStateMachine(callback?: (err: AWSError, data: StepFunctions.Types.DescribeStateMachineOutput) => void): Request<StepFunctions.Types.DescribeStateMachineOutput, AWSError>;
  /**
   * Describes the state machine associated with a specific execution.
   */
  describeStateMachineForExecution(params: StepFunctions.Types.DescribeStateMachineForExecutionInput, callback?: (err: AWSError, data: StepFunctions.Types.DescribeStateMachineForExecutionOutput) => void): Request<StepFunctions.Types.DescribeStateMachineForExecutionOutput, AWSError>;
  /**
   * Describes the state machine associated with a specific execution.
   */
  describeStateMachineForExecution(callback?: (err: AWSError, data: StepFunctions.Types.DescribeStateMachineForExecutionOutput) => void): Request<StepFunctions.Types.DescribeStateMachineForExecutionOutput, AWSError>;
  /**
   * Used by workers to retrieve a task (with the specified activity ARN) which has been scheduled for execution by a running state machine. This initiates a long poll, where the service holds the HTTP connection open and responds as soon as a task becomes available (i.e. an execution of a task of this type is needed.) The maximum time the service holds on to the request before responding is 60 seconds. If no task is available within 60 seconds, the poll returns a taskToken with a null string.  Workers should set their client side socket timeout to at least 65 seconds (5 seconds higher than the maximum time the service may hold the poll request). 
   */
  getActivityTask(params: StepFunctions.Types.GetActivityTaskInput, callback?: (err: AWSError, data: StepFunctions.Types.GetActivityTaskOutput) => void): Request<StepFunctions.Types.GetActivityTaskOutput, AWSError>;
  /**
   * Used by workers to retrieve a task (with the specified activity ARN) which has been scheduled for execution by a running state machine. This initiates a long poll, where the service holds the HTTP connection open and responds as soon as a task becomes available (i.e. an execution of a task of this type is needed.) The maximum time the service holds on to the request before responding is 60 seconds. If no task is available within 60 seconds, the poll returns a taskToken with a null string.  Workers should set their client side socket timeout to at least 65 seconds (5 seconds higher than the maximum time the service may hold the poll request). 
   */
  getActivityTask(callback?: (err: AWSError, data: StepFunctions.Types.GetActivityTaskOutput) => void): Request<StepFunctions.Types.GetActivityTaskOutput, AWSError>;
  /**
   * Returns the history of the specified execution as a list of events. By default, the results are returned in ascending order of the timeStamp of the events. Use the reverseOrder parameter to get the latest events first. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  getExecutionHistory(params: StepFunctions.Types.GetExecutionHistoryInput, callback?: (err: AWSError, data: StepFunctions.Types.GetExecutionHistoryOutput) => void): Request<StepFunctions.Types.GetExecutionHistoryOutput, AWSError>;
  /**
   * Returns the history of the specified execution as a list of events. By default, the results are returned in ascending order of the timeStamp of the events. Use the reverseOrder parameter to get the latest events first. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  getExecutionHistory(callback?: (err: AWSError, data: StepFunctions.Types.GetExecutionHistoryOutput) => void): Request<StepFunctions.Types.GetExecutionHistoryOutput, AWSError>;
  /**
   * Lists the existing activities. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listActivities(params: StepFunctions.Types.ListActivitiesInput, callback?: (err: AWSError, data: StepFunctions.Types.ListActivitiesOutput) => void): Request<StepFunctions.Types.ListActivitiesOutput, AWSError>;
  /**
   * Lists the existing activities. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listActivities(callback?: (err: AWSError, data: StepFunctions.Types.ListActivitiesOutput) => void): Request<StepFunctions.Types.ListActivitiesOutput, AWSError>;
  /**
   * Lists the executions of a state machine that meet the filtering criteria. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listExecutions(params: StepFunctions.Types.ListExecutionsInput, callback?: (err: AWSError, data: StepFunctions.Types.ListExecutionsOutput) => void): Request<StepFunctions.Types.ListExecutionsOutput, AWSError>;
  /**
   * Lists the executions of a state machine that meet the filtering criteria. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listExecutions(callback?: (err: AWSError, data: StepFunctions.Types.ListExecutionsOutput) => void): Request<StepFunctions.Types.ListExecutionsOutput, AWSError>;
  /**
   * Lists the existing state machines. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listStateMachines(params: StepFunctions.Types.ListStateMachinesInput, callback?: (err: AWSError, data: StepFunctions.Types.ListStateMachinesOutput) => void): Request<StepFunctions.Types.ListStateMachinesOutput, AWSError>;
  /**
   * Lists the existing state machines. If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged.
   */
  listStateMachines(callback?: (err: AWSError, data: StepFunctions.Types.ListStateMachinesOutput) => void): Request<StepFunctions.Types.ListStateMachinesOutput, AWSError>;
  /**
   * Used by workers to report that the task identified by the taskToken failed.
   */
  sendTaskFailure(params: StepFunctions.Types.SendTaskFailureInput, callback?: (err: AWSError, data: StepFunctions.Types.SendTaskFailureOutput) => void): Request<StepFunctions.Types.SendTaskFailureOutput, AWSError>;
  /**
   * Used by workers to report that the task identified by the taskToken failed.
   */
  sendTaskFailure(callback?: (err: AWSError, data: StepFunctions.Types.SendTaskFailureOutput) => void): Request<StepFunctions.Types.SendTaskFailureOutput, AWSError>;
  /**
   * Used by workers to report to the service that the task represented by the specified taskToken is still making progress. This action resets the Heartbeat clock. The Heartbeat threshold is specified in the state machine's Amazon States Language definition. This action does not in itself create an event in the execution history. However, if the task times out, the execution history contains an ActivityTimedOut event.  The Timeout of a task, defined in the state machine's Amazon States Language definition, is its maximum allowed duration, regardless of the number of SendTaskHeartbeat requests received.   This operation is only useful for long-lived tasks to report the liveliness of the task. 
   */
  sendTaskHeartbeat(params: StepFunctions.Types.SendTaskHeartbeatInput, callback?: (err: AWSError, data: StepFunctions.Types.SendTaskHeartbeatOutput) => void): Request<StepFunctions.Types.SendTaskHeartbeatOutput, AWSError>;
  /**
   * Used by workers to report to the service that the task represented by the specified taskToken is still making progress. This action resets the Heartbeat clock. The Heartbeat threshold is specified in the state machine's Amazon States Language definition. This action does not in itself create an event in the execution history. However, if the task times out, the execution history contains an ActivityTimedOut event.  The Timeout of a task, defined in the state machine's Amazon States Language definition, is its maximum allowed duration, regardless of the number of SendTaskHeartbeat requests received.   This operation is only useful for long-lived tasks to report the liveliness of the task. 
   */
  sendTaskHeartbeat(callback?: (err: AWSError, data: StepFunctions.Types.SendTaskHeartbeatOutput) => void): Request<StepFunctions.Types.SendTaskHeartbeatOutput, AWSError>;
  /**
   * Used by workers to report that the task identified by the taskToken completed successfully.
   */
  sendTaskSuccess(params: StepFunctions.Types.SendTaskSuccessInput, callback?: (err: AWSError, data: StepFunctions.Types.SendTaskSuccessOutput) => void): Request<StepFunctions.Types.SendTaskSuccessOutput, AWSError>;
  /**
   * Used by workers to report that the task identified by the taskToken completed successfully.
   */
  sendTaskSuccess(callback?: (err: AWSError, data: StepFunctions.Types.SendTaskSuccessOutput) => void): Request<StepFunctions.Types.SendTaskSuccessOutput, AWSError>;
  /**
   * Starts a state machine execution.
   */
  startExecution(params: StepFunctions.Types.StartExecutionInput, callback?: (err: AWSError, data: StepFunctions.Types.StartExecutionOutput) => void): Request<StepFunctions.Types.StartExecutionOutput, AWSError>;
  /**
   * Starts a state machine execution.
   */
  startExecution(callback?: (err: AWSError, data: StepFunctions.Types.StartExecutionOutput) => void): Request<StepFunctions.Types.StartExecutionOutput, AWSError>;
  /**
   * Stops an execution.
   */
  stopExecution(params: StepFunctions.Types.StopExecutionInput, callback?: (err: AWSError, data: StepFunctions.Types.StopExecutionOutput) => void): Request<StepFunctions.Types.StopExecutionOutput, AWSError>;
  /**
   * Stops an execution.
   */
  stopExecution(callback?: (err: AWSError, data: StepFunctions.Types.StopExecutionOutput) => void): Request<StepFunctions.Types.StopExecutionOutput, AWSError>;
  /**
   * Updates an existing state machine by modifying its definition and/or roleArn. Running executions will continue to use the previous definition and roleArn.  All StartExecution calls within a few seconds will use the updated definition and roleArn. Executions started immediately after calling UpdateStateMachine may use the previous state machine definition and roleArn. You must include at least one of definition or roleArn or you will receive a MissingRequiredParameter error. 
   */
  updateStateMachine(params: StepFunctions.Types.UpdateStateMachineInput, callback?: (err: AWSError, data: StepFunctions.Types.UpdateStateMachineOutput) => void): Request<StepFunctions.Types.UpdateStateMachineOutput, AWSError>;
  /**
   * Updates an existing state machine by modifying its definition and/or roleArn. Running executions will continue to use the previous definition and roleArn.  All StartExecution calls within a few seconds will use the updated definition and roleArn. Executions started immediately after calling UpdateStateMachine may use the previous state machine definition and roleArn. You must include at least one of definition or roleArn or you will receive a MissingRequiredParameter error. 
   */
  updateStateMachine(callback?: (err: AWSError, data: StepFunctions.Types.UpdateStateMachineOutput) => void): Request<StepFunctions.Types.UpdateStateMachineOutput, AWSError>;
}
declare namespace StepFunctions {
  export interface ActivityFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export type ActivityList = ActivityListItem[];
  export interface ActivityListItem {
    /**
     * The Amazon Resource Name (ARN) that identifies the activity.
     */
    activityArn: Arn;
    /**
     * The name of the activity. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The date the activity is created.
     */
    creationDate: Timestamp;
  }
  export interface ActivityScheduleFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface ActivityScheduledEventDetails {
    /**
     * The Amazon Resource Name (ARN) of the scheduled activity.
     */
    resource: Arn;
    /**
     * The JSON data input to the activity task.
     */
    input?: Data;
    /**
     * The maximum allowed duration of the activity task.
     */
    timeoutInSeconds?: TimeoutInSeconds;
    /**
     * The maximum allowed duration between two heartbeats for the activity task.
     */
    heartbeatInSeconds?: TimeoutInSeconds;
  }
  export interface ActivityStartedEventDetails {
    /**
     * The name of the worker that the task is assigned to. These names are provided by the workers when calling GetActivityTask.
     */
    workerName?: Identity;
  }
  export interface ActivitySucceededEventDetails {
    /**
     * The JSON data output by the activity task.
     */
    output?: Data;
  }
  export interface ActivityTimedOutEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the timeout.
     */
    cause?: Cause;
  }
  export type Arn = string;
  export type Cause = string;
  export interface CreateActivityInput {
    /**
     * The name of the activity to create. This name must be unique for your AWS account and region for 90 days. For more information, see  Limits Related to State Machine Executions in the AWS Step Functions Developer Guide. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
  }
  export interface CreateActivityOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the created activity.
     */
    activityArn: Arn;
    /**
     * The date the activity is created.
     */
    creationDate: Timestamp;
  }
  export interface CreateStateMachineInput {
    /**
     * The name of the state machine. This name must be unique for your AWS account and region for 90 days. For more information, see  Limits Related to State Machine Executions in the AWS Step Functions Developer Guide. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The Amazon States Language definition of the state machine.
     */
    definition: Definition;
    /**
     * The Amazon Resource Name (ARN) of the IAM role to use for this state machine.
     */
    roleArn: Arn;
  }
  export interface CreateStateMachineOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the created state machine.
     */
    stateMachineArn: Arn;
    /**
     * The date the state machine is created.
     */
    creationDate: Timestamp;
  }
  export type Data = string;
  export type Definition = string;
  export interface DeleteActivityInput {
    /**
     * The Amazon Resource Name (ARN) of the activity to delete.
     */
    activityArn: Arn;
  }
  export interface DeleteActivityOutput {
  }
  export interface DeleteStateMachineInput {
    /**
     * The Amazon Resource Name (ARN) of the state machine to delete.
     */
    stateMachineArn: Arn;
  }
  export interface DeleteStateMachineOutput {
  }
  export interface DescribeActivityInput {
    /**
     * The Amazon Resource Name (ARN) of the activity to describe.
     */
    activityArn: Arn;
  }
  export interface DescribeActivityOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the activity.
     */
    activityArn: Arn;
    /**
     * The name of the activity. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The date the activity is created.
     */
    creationDate: Timestamp;
  }
  export interface DescribeExecutionInput {
    /**
     * The Amazon Resource Name (ARN) of the execution to describe.
     */
    executionArn: Arn;
  }
  export interface DescribeExecutionOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the execution.
     */
    executionArn: Arn;
    /**
     * The Amazon Resource Name (ARN) of the executed stated machine.
     */
    stateMachineArn: Arn;
    /**
     * The name of the execution. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name?: Name;
    /**
     * The current status of the execution.
     */
    status: ExecutionStatus;
    /**
     * The date the execution is started.
     */
    startDate: Timestamp;
    /**
     * If the execution has already ended, the date the execution stopped.
     */
    stopDate?: Timestamp;
    /**
     * The string that contains the JSON input data of the execution.
     */
    input: Data;
    /**
     * The JSON output data of the execution.  This field is set only if the execution succeeds. If the execution fails, this field is null. 
     */
    output?: Data;
  }
  export interface DescribeStateMachineForExecutionInput {
    /**
     * The Amazon Resource Name (ARN) of the execution you want state machine information for.
     */
    executionArn: Arn;
  }
  export interface DescribeStateMachineForExecutionOutput {
    /**
     * The Amazon Resource Name (ARN) of the state machine associated with the execution.
     */
    stateMachineArn: Arn;
    /**
     * The name of the state machine associated with the execution.
     */
    name: Name;
    /**
     * The Amazon States Language definition of the state machine.
     */
    definition: Definition;
    /**
     * The Amazon Resource Name (ARN) of the IAM role of the State Machine for the execution. 
     */
    roleArn: Arn;
    /**
     * The date and time the state machine associated with an execution was updated. For a newly created state machine, this is the creation date.
     */
    updateDate: Timestamp;
  }
  export interface DescribeStateMachineInput {
    /**
     * The Amazon Resource Name (ARN) of the state machine to describe.
     */
    stateMachineArn: Arn;
  }
  export interface DescribeStateMachineOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the state machine.
     */
    stateMachineArn: Arn;
    /**
     * The name of the state machine. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The current status of the state machine.
     */
    status?: StateMachineStatus;
    /**
     * The Amazon States Language definition of the state machine.
     */
    definition: Definition;
    /**
     * The Amazon Resource Name (ARN) of the IAM role used when creating this state machine. (The IAM role maintains security by granting Step Functions access to AWS resources.)
     */
    roleArn: Arn;
    /**
     * The date the state machine is created.
     */
    creationDate: Timestamp;
  }
  export type Error = string;
  export type EventId = number;
  export interface ExecutionAbortedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface ExecutionFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export type ExecutionList = ExecutionListItem[];
  export interface ExecutionListItem {
    /**
     * The Amazon Resource Name (ARN) that identifies the execution.
     */
    executionArn: Arn;
    /**
     * The Amazon Resource Name (ARN) of the executed state machine.
     */
    stateMachineArn: Arn;
    /**
     * The name of the execution. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The current status of the execution.
     */
    status: ExecutionStatus;
    /**
     * The date the execution started.
     */
    startDate: Timestamp;
    /**
     * If the execution already ended, the date the execution stopped.
     */
    stopDate?: Timestamp;
  }
  export interface ExecutionStartedEventDetails {
    /**
     * The JSON data input to the execution.
     */
    input?: Data;
    /**
     * The Amazon Resource Name (ARN) of the IAM role used for executing AWS Lambda tasks.
     */
    roleArn?: Arn;
  }
  export type ExecutionStatus = "RUNNING"|"SUCCEEDED"|"FAILED"|"TIMED_OUT"|"ABORTED"|string;
  export interface ExecutionSucceededEventDetails {
    /**
     * The JSON data output by the execution.
     */
    output?: Data;
  }
  export interface ExecutionTimedOutEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the timeout.
     */
    cause?: Cause;
  }
  export interface GetActivityTaskInput {
    /**
     * The Amazon Resource Name (ARN) of the activity to retrieve tasks from (assigned when you create the task using CreateActivity.)
     */
    activityArn: Arn;
    /**
     * You can provide an arbitrary name in order to identify the worker that the task is assigned to. This name is used when it is logged in the execution history.
     */
    workerName?: Name;
  }
  export interface GetActivityTaskOutput {
    /**
     * A token that identifies the scheduled task. This token must be copied and included in subsequent calls to SendTaskHeartbeat, SendTaskSuccess or SendTaskFailure in order to report the progress or completion of the task.
     */
    taskToken?: TaskToken;
    /**
     * The string that contains the JSON input data for the task.
     */
    input?: Data;
  }
  export interface GetExecutionHistoryInput {
    /**
     * The Amazon Resource Name (ARN) of the execution.
     */
    executionArn: Arn;
    /**
     * The maximum number of results that are returned per call. You can use nextToken to obtain further pages of results. The default is 100 and the maximum allowed page size is 100. A value of 0 uses the default. This is only an upper limit. The actual number of results returned per call might be fewer than the specified maximum.
     */
    maxResults?: PageSize;
    /**
     * Lists events in descending order of their timeStamp.
     */
    reverseOrder?: ReverseOrder;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface GetExecutionHistoryOutput {
    /**
     * The list of events that occurred in the execution.
     */
    events: HistoryEventList;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface HistoryEvent {
    /**
     * The date the event occurred.
     */
    timestamp: Timestamp;
    /**
     * The type of the event.
     */
    type: HistoryEventType;
    /**
     * The id of the event. Events are numbered sequentially, starting at one.
     */
    id: EventId;
    /**
     * The id of the previous event.
     */
    previousEventId?: EventId;
    activityFailedEventDetails?: ActivityFailedEventDetails;
    /**
     * Contains details about an activity schedule event which failed during an execution.
     */
    activityScheduleFailedEventDetails?: ActivityScheduleFailedEventDetails;
    activityScheduledEventDetails?: ActivityScheduledEventDetails;
    activityStartedEventDetails?: ActivityStartedEventDetails;
    activitySucceededEventDetails?: ActivitySucceededEventDetails;
    activityTimedOutEventDetails?: ActivityTimedOutEventDetails;
    executionFailedEventDetails?: ExecutionFailedEventDetails;
    executionStartedEventDetails?: ExecutionStartedEventDetails;
    executionSucceededEventDetails?: ExecutionSucceededEventDetails;
    executionAbortedEventDetails?: ExecutionAbortedEventDetails;
    executionTimedOutEventDetails?: ExecutionTimedOutEventDetails;
    lambdaFunctionFailedEventDetails?: LambdaFunctionFailedEventDetails;
    lambdaFunctionScheduleFailedEventDetails?: LambdaFunctionScheduleFailedEventDetails;
    lambdaFunctionScheduledEventDetails?: LambdaFunctionScheduledEventDetails;
    /**
     * Contains details about a lambda function which failed to start during an execution.
     */
    lambdaFunctionStartFailedEventDetails?: LambdaFunctionStartFailedEventDetails;
    /**
     * Contains details about a lambda function which terminated successfully during an execution.
     */
    lambdaFunctionSucceededEventDetails?: LambdaFunctionSucceededEventDetails;
    lambdaFunctionTimedOutEventDetails?: LambdaFunctionTimedOutEventDetails;
    stateEnteredEventDetails?: StateEnteredEventDetails;
    stateExitedEventDetails?: StateExitedEventDetails;
  }
  export type HistoryEventList = HistoryEvent[];
  export type HistoryEventType = "ActivityFailed"|"ActivityScheduleFailed"|"ActivityScheduled"|"ActivityStarted"|"ActivitySucceeded"|"ActivityTimedOut"|"ChoiceStateEntered"|"ChoiceStateExited"|"ExecutionFailed"|"ExecutionStarted"|"ExecutionSucceeded"|"ExecutionAborted"|"ExecutionTimedOut"|"FailStateEntered"|"LambdaFunctionFailed"|"LambdaFunctionScheduleFailed"|"LambdaFunctionScheduled"|"LambdaFunctionStartFailed"|"LambdaFunctionStarted"|"LambdaFunctionSucceeded"|"LambdaFunctionTimedOut"|"SucceedStateEntered"|"SucceedStateExited"|"TaskStateAborted"|"TaskStateEntered"|"TaskStateExited"|"PassStateEntered"|"PassStateExited"|"ParallelStateAborted"|"ParallelStateEntered"|"ParallelStateExited"|"ParallelStateFailed"|"ParallelStateStarted"|"ParallelStateSucceeded"|"WaitStateAborted"|"WaitStateEntered"|"WaitStateExited"|string;
  export type Identity = string;
  export interface LambdaFunctionFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface LambdaFunctionScheduleFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface LambdaFunctionScheduledEventDetails {
    /**
     * The Amazon Resource Name (ARN) of the scheduled lambda function.
     */
    resource: Arn;
    /**
     * The JSON data input to the lambda function.
     */
    input?: Data;
    /**
     * The maximum allowed duration of the lambda function.
     */
    timeoutInSeconds?: TimeoutInSeconds;
  }
  export interface LambdaFunctionStartFailedEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface LambdaFunctionSucceededEventDetails {
    /**
     * The JSON data output by the lambda function.
     */
    output?: Data;
  }
  export interface LambdaFunctionTimedOutEventDetails {
    /**
     * The error code of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the timeout.
     */
    cause?: Cause;
  }
  export interface ListActivitiesInput {
    /**
     * The maximum number of results that are returned per call. You can use nextToken to obtain further pages of results. The default is 100 and the maximum allowed page size is 100. A value of 0 uses the default. This is only an upper limit. The actual number of results returned per call might be fewer than the specified maximum.
     */
    maxResults?: PageSize;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface ListActivitiesOutput {
    /**
     * The list of activities.
     */
    activities: ActivityList;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface ListExecutionsInput {
    /**
     * The Amazon Resource Name (ARN) of the state machine whose executions is listed.
     */
    stateMachineArn: Arn;
    /**
     * If specified, only list the executions whose current execution status matches the given filter.
     */
    statusFilter?: ExecutionStatus;
    /**
     * The maximum number of results that are returned per call. You can use nextToken to obtain further pages of results. The default is 100 and the maximum allowed page size is 100. A value of 0 uses the default. This is only an upper limit. The actual number of results returned per call might be fewer than the specified maximum.
     */
    maxResults?: PageSize;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface ListExecutionsOutput {
    /**
     * The list of matching executions.
     */
    executions: ExecutionList;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface ListStateMachinesInput {
    /**
     * The maximum number of results that are returned per call. You can use nextToken to obtain further pages of results. The default is 100 and the maximum allowed page size is 100. A value of 0 uses the default. This is only an upper limit. The actual number of results returned per call might be fewer than the specified maximum.
     */
    maxResults?: PageSize;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export interface ListStateMachinesOutput {
    stateMachines: StateMachineList;
    /**
     * If a nextToken is returned by a previous call, there are more results available. To retrieve the next page of results, make the call again using the returned token in nextToken. Keep all other arguments unchanged. The configured maxResults determines how many results can be returned in a single call.
     */
    nextToken?: PageToken;
  }
  export type Name = string;
  export type PageSize = number;
  export type PageToken = string;
  export type ReverseOrder = boolean;
  export interface SendTaskFailureInput {
    /**
     * The token that represents this task. Task tokens are generated by the service when the tasks are assigned to a worker (see GetActivityTask::taskToken).
     */
    taskToken: TaskToken;
    /**
     * An arbitrary error code that identifies the cause of the failure.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the failure.
     */
    cause?: Cause;
  }
  export interface SendTaskFailureOutput {
  }
  export interface SendTaskHeartbeatInput {
    /**
     * The token that represents this task. Task tokens are generated by the service when the tasks are assigned to a worker (see GetActivityTaskOutput$taskToken).
     */
    taskToken: TaskToken;
  }
  export interface SendTaskHeartbeatOutput {
  }
  export interface SendTaskSuccessInput {
    /**
     * The token that represents this task. Task tokens are generated by the service when the tasks are assigned to a worker (see GetActivityTaskOutput$taskToken).
     */
    taskToken: TaskToken;
    /**
     * The JSON output of the task.
     */
    output: Data;
  }
  export interface SendTaskSuccessOutput {
  }
  export interface StartExecutionInput {
    /**
     * The Amazon Resource Name (ARN) of the state machine to execute.
     */
    stateMachineArn: Arn;
    /**
     * The name of the execution. This name must be unique for your AWS account and region for 90 days. For more information, see  Limits Related to State Machine Executions in the AWS Step Functions Developer Guide.  An execution can't use the name of another execution for 90 days. When you make multiple StartExecution calls with the same name, the new execution doesn't run and the following rules apply:   When the original execution is open and the execution input from the new call is different, the ExecutionAlreadyExists message is returned.   When the original execution is open and the execution input from the new call is identical, the Success message is returned.   When the original execution is closed, the ExecutionAlreadyExists message is returned regardless of input.    A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name?: Name;
    /**
     * The string that contains the JSON input data for the execution, for example:  "input": "{\"first_name\" : \"test\"}"   If you don't include any JSON input data, you still must include the two braces, for example: "input": "{}"  
     */
    input?: Data;
  }
  export interface StartExecutionOutput {
    /**
     * The Amazon Resource Name (ARN) that identifies the execution.
     */
    executionArn: Arn;
    /**
     * The date the execution is started.
     */
    startDate: Timestamp;
  }
  export interface StateEnteredEventDetails {
    /**
     * The name of the state.
     */
    name: Name;
    /**
     * The string that contains the JSON input data for the state.
     */
    input?: Data;
  }
  export interface StateExitedEventDetails {
    /**
     * The name of the state. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The JSON output data of the state.
     */
    output?: Data;
  }
  export type StateMachineList = StateMachineListItem[];
  export interface StateMachineListItem {
    /**
     * The Amazon Resource Name (ARN) that identifies the state machine.
     */
    stateMachineArn: Arn;
    /**
     * The name of the state machine. A name must not contain:   whitespace   brackets &lt; &gt; { } [ ]    wildcard characters ? *    special characters " # % \ ^ | ~ ` $ &amp; , ; : /    control characters (U+0000-001F, U+007F-009F)  
     */
    name: Name;
    /**
     * The date the state machine is created.
     */
    creationDate: Timestamp;
  }
  export type StateMachineStatus = "ACTIVE"|"DELETING"|string;
  export interface StopExecutionInput {
    /**
     * The Amazon Resource Name (ARN) of the execution to stop.
     */
    executionArn: Arn;
    /**
     * An arbitrary error code that identifies the cause of the termination.
     */
    error?: Error;
    /**
     * A more detailed explanation of the cause of the termination.
     */
    cause?: Cause;
  }
  export interface StopExecutionOutput {
    /**
     * The date the execution is stopped.
     */
    stopDate: Timestamp;
  }
  export type TaskToken = string;
  export type TimeoutInSeconds = number;
  export type Timestamp = Date;
  export interface UpdateStateMachineInput {
    /**
     * The Amazon Resource Name (ARN) of the state machine.
     */
    stateMachineArn: Arn;
    /**
     * The Amazon States Language definition of the state machine.
     */
    definition?: Definition;
    /**
     * The Amazon Resource Name (ARN) of the IAM role of the state machine.
     */
    roleArn?: Arn;
  }
  export interface UpdateStateMachineOutput {
    /**
     * The date and time the state machine was updated.
     */
    updateDate: Timestamp;
  }
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2016-11-23"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the StepFunctions client.
   */
  export import Types = StepFunctions;
}
export = StepFunctions;
