var fs = require('fs');
var path = require('path');

module.exports = function(context) {
    var platforms = context.opts.platforms;

    if (platforms.indexOf('android') !== -1) {
        android.deletePropertiesFile();
        android.createPropertiesFile();

        android.removeBuildGradleExtras();
        android.addBuildGradleExtras();
    }

    if (platforms.indexOf('ios') !== -1) {
        var xcodeProjectPath = ios.getXcodeProjectPath(context);

        return ios.removeShellScriptBuildPhase(context, xcodeProjectPath).then(function() {
            ios.addShellScriptBuildPhase(context, xcodeProjectPath);
        });
    }
};

var android = {
    createPropertiesFile: function() {
        var pluginConfig = common.getPluginConfig('android');

        var crashlyticsPropertiesPath = this._getCrashlyticsPropertiesPath();

        var crashlyticsProperties = '';
        crashlyticsProperties += 'apiKey=' + pluginConfig.apiKey + '\n';
        crashlyticsProperties += 'apiSecret=' + pluginConfig.apiSecret + '\n';

        fs.writeFileSync(crashlyticsPropertiesPath, crashlyticsProperties);
    },

    deletePropertiesFile: function() {
        var crashlyticsPropertiesPath = this._getCrashlyticsPropertiesPath();

        fs.unlinkSync(crashlyticsPropertiesPath);
    },

    addBuildGradleExtras: function() {
        var buildGradle = this._readBuildGradle();

        buildGradle +=  '// CRASHLYTICS PLUGIN EXTRAS START\n' +
                        'buildscript {\n' +
                        '    repositories {\n' +
                        '        maven { url \'http://download.crashlytics.com/maven\' }\n' +
                        '    }\n' +
                        '    dependencies {\n' +
                        '        classpath \'com.crashlytics.tools.gradle:crashlytics-gradle:1.+\'\n' +
                        '    }\n' +
                        '}\n' +
                        '// CRASHLYTICS PLUGIN EXTRAS END\n';

        this._writeBuildGradle(buildGradle);
    },

    removeBuildGradleExtras: function() {
        var buildGradle = this._readBuildGradle();

        buildGradle = buildGradle.replace(/\/\/ CRASHLYTICS PLUGIN EXTRAS START[\s\S]*\/\/ CRASHLYTICS PLUGIN EXTRAS END\n/, '');

        this._writeBuildGradle(buildGradle);
    },

    _getCrashlyticsPropertiesPath: function() {
        return path.join('platforms', 'android', 'crashlytics.properties');
    },

    _readBuildGradle: function() {
        return fs.readFileSync(this._getBuildGradlePath(), 'utf-8');
    },

    _writeBuildGradle: function(buildGradle) {
        fs.writeFileSync(this._getBuildGradlePath(), buildGradle);
    },

    _getBuildGradlePath: function() {
        return path.join('platforms', 'android', 'build.gradle');
    }
};

var ios = {
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

var common = {
    getPluginConfig: function(platform) {
        var pluginConfig = require(path.join('..', '..', platform + '.json'));

        return {
            apiKey: pluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_KEY,
            apiSecret: pluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_SECRET
        };
    }
};
