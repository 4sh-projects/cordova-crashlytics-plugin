"use strict";

var exec = require('cordova/exec');

var Crashlytics = function(){

    var methods = [
        'logException', 'log', 'setApplicationInstallationIdentifier',
        'setBool', 'setDouble', 'setFloat', 'setInt', 'setLong', 'setString', 'setUserEmail',
        'setUserIdentifier', 'setUserName'
    ];

    var execCall;
    var rippleMock = (window.parent && window.parent.ripple);
    if(rippleMock) {
        console.warn("navigator.crashlytics not defined : considering you're in dev mode and mocking it !");
        execCall = function(methodName, args){ console.log("[Crashlytics] Call to "+methodName+"("+args+")"); }
    } else {
        execCall = function(methodName, args){ exec(null, null, "Crashlytics", methodName, args); };
    }

    for(var i=0; i<methods.length; i++) {
        this[methods[i]] = function(){
            execCall(methods[i], arguments);
        };
    }

    this.LOG_LEVELS = {
        VERBOSE: 2,
        DEBUG: 3,
        INFO: 4,
        WARN: 5,
        ERROR: 6,
        ASSERT: 7
    };
};

var crashlytics = new Crashlytics();

module.exports = crashlytics;
