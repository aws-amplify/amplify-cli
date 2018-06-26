"use strict";

const npm = /^win/.test(process.platform) ? "npm.cmd" : "npm"; 

const reactConfig = {
	"SourceDir": "src",
	"DistributionDir": "build",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

const reactNativeConfig = {
	"SourceDir": "/",
	"DistributionDir": "/",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

const angularConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": "ng serve",
}

const ionicConfig = {
	"SourceDir": "src",
	"DistributionDir": "www",
	"BuildCommand": npm + " run-script build",
	"StartCommand": "ionic serve",
}

const vueConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script serve",
}

const androidConfig = {
	"SourceDir": "app/src",
	"DistributionDir": "app/build",
	"BuildCommand": "./gradlew build",
	"StartCommand": "",
}

const xcodeConfig = {
	"SourceDir": "src",
	"DistributionDir": "/",
	"BuildCommand": "",
	"StartCommand": "",
}

const defaultConfig = {
	"SourceDir": "src",
	"DistributionDir": "dist",
	"BuildCommand": npm + " run-script build",
	"StartCommand": npm + " run-script start",
}

module.exports = {
    'react': reactConfig,
	'react-native': reactNativeConfig,
	'angular': angularConfig,
    'ionic': ionicConfig,
	'vue': vueConfig, 
	'android': androidConfig,
	'xcode': xcodeConfig,
	'none': defaultConfig
}
