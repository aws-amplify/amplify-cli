# Native development with Amplify CLI and AWS AppSync

The AWS Amplify CLI supports a rich workflow for Native application development on iOS or Android. This guide will take you through the code generation capabilities of Amplify with an AWS AppSync GraphQL API. Where appropriate, it will also explain general Amplify concepts for native app development.

### Table of Contents
- [Concepts](#concepts)
- [Workflows](#workflows)
- [iOS usage](#iosuse)
  - [iOS full sample](#iossample)
- [Android usage](#androiduse)
  - [Android full sample](#androidsample)

## Concepts <a name="concepts"></a>

#### Application Configuration
The AWS SDKs for iOS and Android support configuration through a centralized file called `awsconfiguration.json` which defines all the regions and service endpoints to communicate. When you configure categories in the Amplify CLI and run `amplify push`, this file is updated allowing you to focus on your Swift or Java application code. On iOS projects the `awsconfiguration.json` will be placed into the root directory and you will need to add it to your XCode project. On Android projects it will be placed in `./src/main/res/raw` and the SDK will automatically reference that path.

#### Codgen Configuration
In order to make both your dev/test workflows efficient, Amplify codegen supports a configuration command of `amplify add codegen`. You can always run `amplify update codegen` any time to change the configuration. This step is where you define the location of your GraphQL statements that define the data fetching requirements of your application.

For AppSync APIs that have been created in the AWS console, and are outside of an `amplify add api` workflow, you can run `amplify add codegen apiId=XXXX` with the appropriate `apiId` value in order to perform code generation inside your project. However, this will not allow you to update your GraphQL schema locally and run `amplify push` to change your API as creation took place outside of the Amplify CLI project lifecycle.

#### Type Generation
Codegen functionality allows for creation of strongly typed classes from a GraphQL endpoint for you to use in your application. This requires both an introspection schema from your GraphQL server and GraphQL "statements" (e.g. queries, mutations, or subscriptions) to produce a generated class. The `amplify codegen types` command will take automatically download the schema and use the configured location from `amplify add codegen`. If you do not want a schema automatically downloaded you can pass a flag of `--nodownload`.

#### Query Generation
To ease developer setup, the codegen process can automatically generate all possible queries, mutations, and subscriptions for a schema by running `amplify codegen statements`. This allows you ensure that the GraphQL statements you have locally for type generation are valid without first writing them in the console. 

## Workflows <a name="workflows"></a>

The design of codegen functionality provides mechanisms to run at different points in your app development lifecycle, including when you create or update an API as well as independently when you want to just update the data fetching requirements of your app but leave your API alone. It additionally allows you to work in a team where the schema is updated or managed by another person. Finally, you can also include the codgen in your build process so that it runs automatically (such as from in XCode).

**Flow 1: Create API then automatically generate code**

```bash
$amplify init
$amplify add api (select GraphQL)
$amplify push
```

You’ll see questions as before, but now it will also automatically ask you if you want to generate GraphQL statements and do codegen. It will also respect the `./src/main` directory for Android projects. After the AppSync deployment finishes the Swift file will be automatically generated (Android you’ll need to kick off a [Gradle Build step](#androiduse)) and you can begin using in your app immediately.
 
**Flow 2: Modify GraphQL schema, push, then automatically generate code**

During development, you might wish to update your GraphQL schema a few times and generated code as part of an iterative dev/test cycle. Modify & save your schema in `./amplify/backend/api/<apiname>/schema.graphql` then run:

```bash
$amplify push
```

Each time you will be prompted to update the code in your API and also ask you if you want to run codegen again as well, including regeneration of the GraphQL statements from the new schema.
 
**Flow 3: No API changes, just update GraphQL statements & generate code**

One of the benefits of GraphQL is the client can define it's data fetching requirements independently of the API. Amplify codegen supports this by allowing you to modify the selection set (e.g. add/remove fields inside the curly braces) for the GraphQL statements and running type generation again. This gives you fine grained control over the network requests that your application is making. Modify your GraphQL statements (default in the `./graphql` folder unless you changed it) then save the files and run:

```bash
$amplify codegen types
```
A new updated Swift file will be created (or run Gradle Build on Android for the same). You can then use the updates in your application code.
 
**Flow 4: Shared schema, modified elsewhere (e.g. console or team workflows)**

Suppose you are working in a team and the schema is updated either from the AWS AppSync console or on another system. Your types are now out of date because your GraphQL statement was generated off an outdated schema. The easiest way to resolve this is to regenerate your GraphQL statements, update them if necessary, and then generate your types again. Modify the schema in the console or on a separate system, then run:

```bash
$amplify codegen statements
$amplify codegen types
```
You should have newly generated GraphQL statements and Swift code that matches the schema updates. If you ran the second command your types will be updated as well. Alternatively if you run `amplify codegen` alone it will perform both of these actions.


## iOS usage <a name="iosuse"></a>

This section will walk through the steps needed to take an iOS project written in Swift and add Amplify to it along with a GraphQL API using AWS AppSync. If you are a first time user, we recommend starting with a new XCode project and a single View Controller.

## Setup

After completing the [Amplify Getting Started](https://aws-amplify.github.io/media/get_started) navigate in your terminal to an XCode project directory and run the following:

```bash
$amplify init       ## Select iOS as your platform
$amplify add api    ## Select GraphQL, API key, "Single object with fields Todo application"
$amplify push       ## Sets up backend and prompts you for codegen, accept the defaults
```

The `add api` flow above will ask you some questions, like if you already have an annotated GraphQL schema. If this is your first time using the CLI select **No** and let it guide you through the default project **"Single object with fields (e.g., “Todo” with ID, name, description)"** as it will be used in the code generation examples below. Later on you can always change it.

Since you added an API the `amplify push` process will automatically prompt you to enter the codegen process and walk through the configuration options. Accept the defaults and it will create a file named `API.swift` in your root directory (unless you choose to name it differently) as well as a directory called `graphql` with your documents. You also will have an `awsconfiguration.json` file that the AppSync client will use for initialization. 

Next, modify your **Podfile** with a dependency of the AWS AppSync SDK:

```bash
target 'PostsApp' do
  use_frameworks!
  pod 'AWSAppSync', ' ~> 2.6.20'
end
```

Run `pod install` from your terminal and open up the `*.xcworkspace` XCode project. Add the `API.swift` and `awsconfiguration.json` files to your project (_File->Add Files to ..->Add_) and then build your project ensuring there are no issues.

### Initialize the AppSync client
Inside your application delegate is the best place to initialize the AppSync client. The `AWSConfiguration` represents the configuration information present in awsconfiguration.json file. By default, the information under Default section will be used. You will need to create an `AWSAppSyncClientConfiguration` and `AWSAppSyncClient` like below:

```swift
import AWSAppSync

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

   var appSyncClient: AWSAppSyncClient?

   func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
      //You can choose your database location
      let databaseURL = URL(fileURLWithPath:NSTemporaryDirectory()).appendingPathComponent("database_name")
        
      do {
        //AppSync configuration & client initialization
        let appSyncConfig = try AWSAppSyncClientConfiguration(appSyncClientInfo: AWSAppSyncClientInfo(),databaseURL: databaseURL)
        appSyncClient = try AWSAppSyncClient(appSyncConfig: appSyncConfig)
        } catch {
            print("Error initializing appsync client. \(error)")
        }
        //other methods
        return true
}
```

Next, in your application code where you wish to use the AppSync client, such in a `Todos` class which is bound to your View Controller, you need to reference this in the `viewDidLoad()` lifecycle method:

```swift
import AWSAppSync

class Todos: UIViewController{
  //Reference AppSync client
  var appSyncClient: AWSAppSyncClient?

  override func viewDidLoad() {
      super.viewDidLoad()
      //Reference AppSync client from App Delegate
      let appDelegate = UIApplication.shared.delegate as! AppDelegate
      appSyncClient = appDelegate.appSyncClient
  }
}
```

### Queries
Now that the backend is configured, you can run a GraphQL query. The syntax is `appSyncClient?.fetch(query: <NAME>Query() {(result, error)})` where `<NAME>` comes from the GraphQL statements that `amplify codegen types` created. For example, if you have a `ListTodos` query your code will look like the following:

```swift
//Run a query
appSyncClient?.fetch(query: ListTodosQuery())  { (result, error) in
  if error != nil {
    print(error?.localizedDescription ?? "")
      return
  }
    result?.data?.listTodos?.items!.forEach { print(($0?.name)! + " " + ($0?.description)!) }
}
```

Optionally, you can set a cache policy on the query like so:

```swift
appSyncClient?.fetch(query: ListTodosQuery(), cachePolicy: .returnCacheDataAndFetch)  { (result, error) in
```

`returnCacheDataAndFetch` will pull results from the local cache first before retrieving data over the network. This gives a snappy UX as well as offline support.

### Mutations
For adding data now you will need to run a GraphQL mutation. The syntax `appSyncClient?.perform(mutation: <NAME>Mutation() {(result, error)})` where `<NAME>` comes from the GraphQL statements that `amplify codegen types` created. However, most GraphQL schemas organize mutations with an `input` type for maintainability, which is what the Amplify CLI does as well. Therefore you'll pass this as a parameter called `input` as in the example below:

```swift
let mutationInput = CreateTodoInput(name: "Use AppSync", description:"Realtime and Offline")
        
appSyncClient?.perform(mutation: CreateTodoMutation(input: mutationInput)) { (result, error) in
  if let error = error as? AWSAppSyncClientError {
    print("Error occurred: \(error.localizedDescription )")
  }
  if let resultError = result?.errors {
    print("Error saving the item on server: \(resultError)")
    return
  }
}
```

### Subscriptions
Finally it's time to setup a subscription to realtime data. The syntax `appSyncClient?.subscribe(subscription: <NAME>Subscription() {(result, transaction, error)})` where `<NAME>` comes from the GraphQL statements that `amplify codegen types` created.

```swift
//Set a variable to discard at the class level
var discard: Cancellable?

//In your app code
do {
  discard = try appSyncClient?.subscribe(subscription: OnCreateTodoSubscription(), resultHandler: { (result, transaction, error) in
    if let result = result {
      print(result.data!.onCreateTodo!.name + " " + result.data!.onCreateTodo!.description!)
    } else if let error = error {
      print(error.localizedDescription)
    }
  })
} catch {
  print("Error starting subscription.")
}
```

Subscriptions can also take `input` types like mutations, in which case they will be subscribing to particular events based on the input. Learn more about Subscription arguments in AppSync [here](https://docs.aws.amazon.com/appsync/latest/devguide/real-time-data.html).

### Complete Sample <a name="iossample"></a>

**AppDelegate.swift**

```swift
import UIKit
import AWSAppSync

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var appSyncClient: AWSAppSyncClient?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        let databaseURL = URL(fileURLWithPath:NSTemporaryDirectory()).appendingPathComponent("database_name")
        do {
            //AppSync configuration & client initialization
            let appSyncConfig = try AWSAppSyncClientConfiguration(appSyncClientInfo: AWSAppSyncClientInfo(),databaseURL: databaseURL)
            appSyncClient = try AWSAppSyncClient(appSyncConfig: appSyncConfig)
        } catch {
            print("Error initializing appsync client. \(error)")
        }
        return true
    }
}
```

**ViewController.swift**

```swift
import UIKit
import AWSAppSync

class ViewController: UIViewController {
    
    var appSyncClient: AWSAppSyncClient?
    var discard: Cancellable?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        let appDelegate = UIApplication.shared.delegate as! AppDelegate
        appSyncClient = appDelegate.appSyncClient
        runMutation()
        runQuery()
        subscribe()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    func subscribe() {
        do {
            discard = try appSyncClient?.subscribe(subscription: OnCreateTodoSubscription(), resultHandler: { (result, transaction, error) in
                if let result = result {
                    print(result.data!.onCreateTodo!.name + " " + result.data!.onCreateTodo!.description!)
                } else if let error = error {
                    print(error.localizedDescription)
                }
            })
        } catch {
            print("Error starting subscription.")
        }
    }
    
    func runMutation(){
        let mutationInput = CreateTodoInput(name: "Use AppSync", description:"Realtime and Offline")
        appSyncClient?.perform(mutation: CreateTodoMutation(input: mutationInput)) { (result, error) in
            if let error = error as? AWSAppSyncClientError {
                print("Error occurred: \(error.localizedDescription )")
            }
            if let resultError = result?.errors {
                print("Error saving the item on server: \(resultError)")
                return
            }
        }
    }

    func runQuery(){
        appSyncClient?.fetch(query: ListTodosQuery()) {(result, error) in
            if error != nil {
                print(error?.localizedDescription ?? "")
                return
            }
            result?.data?.listTodos?.items!.forEach { print(($0?.name)! + " " + ($0?.description)!) }
        }
    }
}
```

## Android usage <a name="androiduse"></a>

This section will walk through the steps needed to take an Android Studio project written in Java and add Amplify to it along with a GraphQL API using AWS AppSync. If you are a first time user, we recommend starting with a new Android Studio project and a single Activity class.

## Setup
After completing the [Amplify Getting Started](https://aws-amplify.github.io/media/get_started) navigate in your terminal to an Android Studio project directory and run the following:

```bash
$amplify init       ## Select iOS as your platform
$amplify add api    ## Select GraphQL, API key, "Single object with fields Todo application"
$amplify push       ## Sets up backend and prompts you for codegen, accept the defaults
```

The `add api` flow above will ask you some questions, like if you already have an annotated GraphQL schema. If this is your first time using the CLI select **No** and let it guide you through the default project **"Single object with fields (e.g., “Todo” with ID, name, description)"** as it will be used in the code generation examples below. Later on you can always change it.

Since you added an API the `amplify push` process will automatically enter the codegen process and prompt you for configuration. Accept the defaults and it will create a file named `awsconfiguration.json` in the `./src/main/res/raw` directory that the AppSync client will use for initialization. To finish off the build process there are a few Gradle and permission updates needed.

First, in the project's `build.gradle`, add the following dependency in the build script:
```gradle
classpath 'com.amazonaws:aws-android-sdk-appsync-gradle-plugin:2.6.+'
```

Next, in the app's `build.gradle` add in a plugin of `apply plugin: 'com.amazonaws.appsync'` and a dependency of `compile 'com.amazonaws:aws-android-sdk-appsync:2.6.+'`. For example:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.amazonaws.appsync'
android {
    // Typical items
}
dependencies {
    // Typical dependencies
    compile 'com.amazonaws:aws-android-sdk-appsync:2.6.+'
    compile 'org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.0'
    compile 'org.eclipse.paho:org.eclipse.paho.android.service:1.1.1'
}
```

Finally, update your `AndroidManifest.xml` with updats to `<uses-permissions>`for network calls and offline state. Also add a `<service>` entry under `<application>` for `MqttService` for subscriptions:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>

        <!--other code-->

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <service android:name="org.eclipse.paho.android.service.MqttService" />

        <!--other code-->
    </application>
```

Build your project ensuring there are no issues.

### Initialize the AppSync client
Inside your application code, such as the `onCreate()` lifecycle method of your activity class, you can initialize the AppSync client using an instance of `AWSConfiguration()` in the `AWSAppSyncClient` builder. This reads configuration information present in the `awsconfiguration.json` file. By default, the information under Default section will be used.

```java
    
    private AWSAppSyncClient mAWSAppSyncClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mAWSAppSyncClient = AWSAppSyncClient.builder()
                .context(getApplicationContext())
                .awsConfiguration(new AWSConfiguration(getApplicationContext()))
                .build();
    }
```

### Queries
Now that the backend is configured, you can run a GraphQL query. The syntax of the callback is `GraphQLCall.Callback<{NAME>Query.Data>` where `{NAME}` comes from the GraphQL statements that `amplify codegen types` created. You will invoke this from an instance of the AppSync client with a similar syntax of `.query(<NAME>Query.builder().build())`. For example, if you have a `ListTodos` query your code will look like the following:

```java
    public void query(){
        mAWSAppSyncClient.query(ListTodosQuery.builder().build())
                .responseFetcher(AppSyncResponseFetchers.CACHE_AND_NETWORK)
                .enqueue(todosCallback);
    }

    private GraphQLCall.Callback<ListTodosQuery.Data> todosCallback = new GraphQLCall.Callback<ListTodosQuery.Data>() {
        @Override
        public void onResponse(@Nonnull Response<ListTodosQuery.Data> response) {
            Log.i("Results", response.data().listTodos().items().toString());
        }

        @Override
        public void onFailure(@Nonnull ApolloException e) {
            Log.e("ERROR", e.toString());
        }
    };
```

You can optionally change the cache policy on `AppSyncResponseFetchers` but we recommend leaving `CACHE_AND_NETWORK` as it will pull results from the local cache first before retrieving data over the network. This gives a snappy UX as well as offline support.

### Mutations
For adding data now you will need to run a GraphQL mutation. The syntax of the callback is `GraphQLCall.Callback<{NAME}Mutation.Data>` where `{NAME}` comes from the GraphQL statements that `amplify codegen types` created. However, most GraphQL schemas organize mutations with an `input` type for maintainability, which is what the Amplify CLI does as well. Therefore you'll pass this as a parameter called `input` created with a second builder. You will invoke this from an instance of the AppSync client with a similar syntax of `.mutate({NAME}Mutation.builder().input({Name}Input).build())` like so:

```java
public void mutation(){
    CreateTodoInput createTodoInput = CreateTodoInput.builder().
        name("Use AppSync").
        description("Realtime and Offline").
        build();

    mAWSAppSyncClient.mutate(CreateTodoMutation.builder().input(createTodoInput).build())
        .enqueue(mutationCallback);
}

private GraphQLCall.Callback<CreateTodoMutation.Data> mutationCallback = new GraphQLCall.Callback<CreateTodoMutation.Data>() {
    @Override
    public void onResponse(@Nonnull Response<CreateTodoMutation.Data> response) {
        Log.i("Results", "Added Todo");
    }

    @Override
    public void onFailure(@Nonnull ApolloException e) {
        Log.e("Error", e.toString());
    }
};
```

### Subscriptions
Finally it's time to setup a subscription to realtime data. The callback is just `AppSyncSubscriptionCall.Callback` and you invoke it with a client `.subscribe()` call and pass in a builder with syntax of `{NAME}Subscription.builder()` where `{NAME}` comes from the GraphQL statements that `amplify codegen types` created. Note that the Amplify GraphQL transformer has a common nomenclature of puttin the word `On` in front of a subscription like the below example:

```java
private AppSyncSubscriptionCall subscriptionWatcher;

    private void subscribe(){
        OnCreateTodoSubscription subscription = OnCreateTodoSubscription.builder().build();
        subscriptionWatcher = mAWSAppSyncClient.subscribe(subscription);
        subscriptionWatcher.execute(subCallback);
    }

    private AppSyncSubscriptionCall.Callback subCallback = new AppSyncSubscriptionCall.Callback() {
        @Override
        public void onResponse(@Nonnull Response response) {
            Log.i("Response", response.data().toString());
        }

        @Override
        public void onFailure(@Nonnull ApolloException e) {
            Log.e("Error", e.toString());
        }

        @Override
        public void onCompleted() {
            Log.i("Completed", "Subscription completed");
        }
    };

```

Subscriptions can also take `input` types like mutations, in which case they will be subscribing to particular events based on the input. Learn more about Subscription arguments in AppSync [here](https://docs.aws.amazon.com/appsync/latest/devguide/real-time-data.html).

### Complete Sample <a name="androidsample"></a>

**MainActivity.java**

```java
import android.util.Log;
import com.amazonaws.mobile.config.AWSConfiguration;
import com.amazonaws.mobileconnectors.appsync.AWSAppSyncClient;
import com.amazonaws.mobileconnectors.appsync.AppSyncSubscriptionCall;
import com.amazonaws.mobileconnectors.appsync.fetcher.AppSyncResponseFetchers;
import com.apollographql.apollo.GraphQLCall;
import com.apollographql.apollo.api.Response;
import com.apollographql.apollo.exception.ApolloException;
import javax.annotation.Nonnull;
import amazonaws.demo.todo.CreateTodoMutation;
import amazonaws.demo.todo.ListTodosQuery;
import amazonaws.demo.todo.OnCreateTodoSubscription;
import amazonaws.demo.todo.type.CreateTodoInput;

public class MainActivity extends AppCompatActivity {

    private AWSAppSyncClient mAWSAppSyncClient;
    private AppSyncSubscriptionCall subscriptionWatcher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mAWSAppSyncClient = AWSAppSyncClient.builder()
                .context(getApplicationContext())
                .awsConfiguration(new AWSConfiguration(getApplicationContext()))
                .build();
        query();
        mutation();
        subscribe();
    }

    private void subscribe(){
        OnCreateTodoSubscription subscription = OnCreateTodoSubscription.builder().build();
        subscriptionWatcher = mAWSAppSyncClient.subscribe(subscription);
        subscriptionWatcher.execute(subCallback);
    }

    private AppSyncSubscriptionCall.Callback subCallback = new AppSyncSubscriptionCall.Callback() {
        @Override
        public void onResponse(@Nonnull Response response) {
            Log.i("Response", response.data().toString());
        }

        @Override
        public void onFailure(@Nonnull ApolloException e) {
            Log.e("Error", e.toString());
        }

        @Override
        public void onCompleted() {
            Log.i("Completed", "Subscription completed");
        }
    };

    public void query(){
        mAWSAppSyncClient.query(ListTodosQuery.builder().build())
                .responseFetcher(AppSyncResponseFetchers.CACHE_AND_NETWORK)
                .enqueue(todosCallback);
    }

    private GraphQLCall.Callback<ListTodosQuery.Data> todosCallback = new GraphQLCall.Callback<ListTodosQuery.Data>() {
        @Override
        public void onResponse(@Nonnull Response<ListTodosQuery.Data> response) {
            Log.i("Results", response.data().listTodos().items().toString());
        }

        @Override
        public void onFailure(@Nonnull ApolloException e) {
            Log.e("ERROR", e.toString());
        }
    };

    public void mutation(){

        CreateTodoInput createTodoInput = CreateTodoInput.builder().
                name("Use AppSync").
                description("Realtime and Offline").
                build();

        mAWSAppSyncClient.mutate(CreateTodoMutation.builder().input(createTodoInput).build())
                .enqueue(mutationCallback);

    }

    private GraphQLCall.Callback<CreateTodoMutation.Data> mutationCallback = new GraphQLCall.Callback<CreateTodoMutation.Data>() {
        @Override
        public void onResponse(@Nonnull Response<CreateTodoMutation.Data> response) {
            Log.i("Results", "Added Todo");
        }

        @Override
        public void onFailure(@Nonnull ApolloException e) {
            Log.e("Error", e.toString());
        }
    };
}
```
