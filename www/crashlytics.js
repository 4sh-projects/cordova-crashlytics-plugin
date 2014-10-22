"use strict";

var exec = require('cordova/exec');

var Crashlytics = function(){

    this.logException = function(msg) {
        exec(null, null, "Crashlytics", "logException", [msg]);
    }
};

var crashlytics = new Crashlytics();

module.exports = crashlytics;
