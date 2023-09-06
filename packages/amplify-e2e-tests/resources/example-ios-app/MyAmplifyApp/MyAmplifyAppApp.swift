//
// Copyright Amazon.com Inc. or its affiliates.
// All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
//

import SwiftUI
import Amplify


@main
struct MyAmplifyAppApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }

    // add a default initializer and configure Amplify
       init() {
        configureAmplify()
       }
}
func configureAmplify() {
    do {
        try Amplify.configure()
        print("Initialized Amplify")
    } catch {
        // simplified error handling for the tutorial
        print("Could not initialize Amplify: \(error)")
    }
}
