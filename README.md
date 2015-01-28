# org.apache.cordova.crashlytics

This plugin provides a bridge between javascript error handling and Crashlytics serverside
client API.

## Installation

    cordova plugin add https://github.com/4sh-projects/cordova-crashlytics-plugin

### Android specificities

Update your `platforms/android/AndroidManifest.xm` file by adding your crashlytics API key :

    <?xml version='1.0' encoding='utf-8'?>
    <manifest android:hardwareAccelerated="true" android:versionCode="1" android:versionName="1.0.0" android:windowSoftInputMode="adjustPan" package="your.package.here" xmlns:android="http://schemas.android.com/apk/res/android">
    ...
        <application android:hardwareAccelerated="true" android:icon="@drawable/icon" android:label="@string/app_name">
            ...
            <meta-data android:name="com.crashlytics.ApiKey" android:value="<YOUR APIKEY HERE>" />
            ...
        </application>
    ...
    </manifest>

## Crashlytics

Plugins provides a `navigator.crashlytics` object with following methods :
- logException(string) : Sends an exception (non fatal) to the Crashlytics backend
- log(string) : Sends a standard log message (non fatal) to the Crashlytics backend
- log(errorLevel, tag, msg)
- setApplicationInstallationIdentifier(appInstId)
- setBool(key, value)
- setDouble(key, value)
- setFloat(key, value)
- setInt(key, value)
- setLong(key, value)
- setString(key, value)
- setUserEmail(email)
- setUserIdentifier(userId)
- setUserName(userName)


### Supported platforms

- Android

### AngularJS integration

Use the following snippet to integrate the plugin in your AngularJS app gracefully :

    var module = angular.module("my-module", []);

    module.config(['$provide', function($provide) {
        $provide.decorator("$exceptionHandler", ['$delegate', function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);

                // Decorating standard exception handling behaviour by sending exception to crashlytics plugin
                var message = exception.toString();
                // Here, I rely on stacktrace-js (http://www.stacktracejs.com/) to format exception stacktraces before
                // sending it to the native bridge
                var stacktrace = $window.printStackTrace({e: exception});
                navigator.crashlytics.logException("ERROR: "+message+", stacktrace: "+stacktrace);
            };
        }]);
    }]);

