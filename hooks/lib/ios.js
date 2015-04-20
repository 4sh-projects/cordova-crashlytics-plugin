var fs = require('fs');
var path = require('path');

var common = require('./common');

module.exports = {
    addShellScriptBuildPhase: function(context, xcodeProjectPath) {
        var pluginConfig = common.getPluginConfig('android');

        return this._editXcodeProject(context, xcodeProjectPath, function(xcodeProject, callback) {
            var id = xcodeProject.generateUuid();

            xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id] = {
                isa: 'PBXShellScriptBuildPhase',
                buildActionMask: 2147483647,
                files: [],
                inputPaths: [],
                name: '"' + this._comment + '"',
                outputPaths: [],
                runOnlyForDeploymentPostprocessing: 0,
                shellPath: '/bin/sh',
                shellScript: '"../../plugins/org.apache.cordova.crashlytics/libs/ios/Crashlytics.framework/run ' + pluginConfig.apiKey + ' ' + pluginConfig.apiSecret + '"',
                showEnvVarsInLog: 0
            };

            xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id + '_comment'] = this._comment;

            for (var nativeTargetId in xcodeProject.hash.project.objects.PBXNativeTarget) {
                if (nativeTargetId.indexOf('_comment') === -1) {
                    xcodeProject.hash.project.objects.PBXNativeTarget[nativeTargetId].buildPhases.push({
                        value: id,
                        comment: this._comment
                    });
                }
            }

            callback();
        }.bind(this));
    },

    removeShellScriptBuildPhase: function(context, xcodeProjectPath) {
        return this._editXcodeProject(context, xcodeProjectPath, function(xcodeProject, callback) {
            for (var shellScriptBuildPhaseId in xcodeProject.hash.project.objects.PBXShellScriptBuildPhase) {
                var deleteShellScriptBuildPhaseId = false;

                if (shellScriptBuildPhaseId.indexOf('_comment') !== -1) {
                    deleteShellScriptBuildPhaseId = (xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[shellScriptBuildPhaseId] === this._comment);
                } else {
                    deleteShellScriptBuildPhaseId = (xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[shellScriptBuildPhaseId].name.indexOf(this._comment) !== -1);
                }

                if (deleteShellScriptBuildPhaseId) {
                    delete xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[shellScriptBuildPhaseId];
                }
            }

            for (var nativeTargetId in xcodeProject.hash.project.objects.PBXNativeTarget) {
                if (nativeTargetId.indexOf('_comment') === -1) {
                    xcodeProject.hash.project.objects.PBXNativeTarget[nativeTargetId].buildPhases = xcodeProject.hash.project.objects.PBXNativeTarget[nativeTargetId].buildPhases.filter(this._buildPhaseFilter.bind(this));
                }
            }

            callback();
        }.bind(this));
    },

    getXcodeProjectPath: function(context) {
        var appName = this._getAppName(context);

        return path.join('platforms', 'ios', appName + '.xcodeproj', 'project.pbxproj');
    },

    _editXcodeProject: function(context, xcodeProjectPath, callback) {
        var Q = context.requireCordovaModule('q');
        var xcode = context.requireCordovaModule('xcode');

        var xcodeProject = xcode.project(xcodeProjectPath);

        var deferral = new Q.defer();

        xcodeProject.parse(function(err) {
            if (err) {
                throw err;
            }

            callback(xcodeProject, function() {
                fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync());

                deferral.resolve();
            });
        });

        return deferral.promise;
    },

    _getAppName: function(context) {
        var ConfigParser = context.requireCordovaModule('cordova-lib').configparser;

        var config = new ConfigParser('config.xml');
        return config.name();
    },

    _buildPhaseFilter: function(value) {
        return (value.comment !== this._comment);
    },

    _comment: 'Crashlytics run'
};