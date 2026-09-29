package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"net/rpc"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda/messages"
	lc "github.com/aws/aws-lambda-go/lambdacontext"
)

// Code is based on https://github.com/yogeshlonkar/aws-lambda-go-test

const rpcFunctionName = "Function.Invoke"
const connectionDelay = time.Duration(100) * time.Millisecond
const maxConnectionRetries = 20

// This is the expected type from the CLI
type Envelope struct {
	TimeoutMilliseconds int
	Port                int
	Payload             string
}

type Result struct {
	Response string
	Error    string
}

type LambdaInput struct {
	Timeout       time.Duration
	Port          int
	Payload       interface{}
	ClientContext *lc.ClientContext
	Deadline      *messages.InvokeRequest_Timestamp
}

func invokeLambda(input LambdaInput) ([]byte, error) {
	// 1. Wait until Lambda's port can be connected, retry opening RPC channel
	connectionRetries := 1
	connected := false

	var connection *rpc.Client
	var err error

	for {
		connection, err = rpc.Dial("tcp", fmt.Sprintf(":%d", input.Port))

		if connection != nil {
			connected = true
			break
		}

		connectionRetries++

		if connectionRetries > maxConnectionRetries {
			break
		}

		time.Sleep(connectionDelay)
	}

	if !connected {
		return nil, err
	}

	// 2. Create invoke request
	request, err := createInvokeRequest(input)
	if err != nil {
		return nil, err
	}

	// 3. Call the Function.Invoke method via RPC
	var response messages.InvokeResponse

	if err = connection.Call(rpcFunctionName, request, &response); err != nil {
		return nil, err
	}

	if response.Error != nil {
		return nil, errors.New(response.Error.Message)
	}

	return response.Payload, nil
}

func createInvokeRequest(input LambdaInput) (*messages.InvokeRequest, error) {
	payloadEncoded, err := json.Marshal(input.Payload)

	if err != nil {
		return nil, err
	}

	var clientContextEncoded []byte

	if input.ClientContext != nil {
		jsonEncoded, err := json.Marshal(input.ClientContext)

		if err != nil {
			return nil, err
		}

		clientContextEncoded = jsonEncoded
	}

	Deadline := input.Deadline

	if Deadline == nil {
		now := time.Now()
		deadline := now.Add(input.Timeout)
		Deadline = &messages.InvokeRequest_Timestamp{
			Seconds: int64(deadline.Unix()),
			Nanos:   int64(deadline.Nanosecond()),
		}
	}

	return &messages.InvokeRequest{
		Payload:               payloadEncoded,
		RequestId:             "0",
		XAmznTraceId:          "",
		Deadline:              *Deadline,
		InvokedFunctionArn:    "",
		CognitoIdentityId:     "",
		CognitoIdentityPoolId: "",
		ClientContext:         clientContextEncoded,
	}, nil
}

// Local invoker expects the payload for the Lambda function as a single line of JSON string
// The following steps are executed:
// - Read string until newline from stdio (blocking)
// - Unmarshal into Envelope type
// - Prepare Lambda execution context with parameters and payload
// - Invoke the Lambda function via RPC
// - Marshal the result into JSON
// - Print result to stdio
func main() {
	// Read line from stdio
	reader := bufio.NewReader(os.Stdin)
	text, _ := reader.ReadString('\n')

	var errorString string
	var responseString string
	var isSucceeded = false

	// Validate that input is valid JSON
	if json.Valid([]byte(text)) {
		var envelope Envelope
		json.Unmarshal([]byte(text), &envelope)

		var payload interface{}
		json.Unmarshal([]byte(envelope.Payload), &payload)

		// Invoke lambda
		response, err := invokeLambda(LambdaInput{
			Timeout: time.Duration(envelope.TimeoutMilliseconds * 1000000),
			Port:    envelope.Port,
			Payload: payload,
		})

		responseString = string(response)

		if err != nil {
			errorString = fmt.Sprintf(":%s", err)
		} else {
			isSucceeded = true
		}
	} else {
		errorString = fmt.Sprintf("Received data is not valid json: :%s", text)
	}

	// Produde response JSON object
	var result = Result{
		Response: responseString,
		Error:    errorString,
	}

	var exitCode = 1

	if isSucceeded {
		exitCode = 0
	}

	jsonBytes, _ := json.Marshal(result)

	fmt.Println(string(jsonBytes))

	os.Exit(exitCode)
}
