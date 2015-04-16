var fs = require('fs');
var path = require('path');

module.exports = function(context) {
    var ConfigParser = context.requireCordovaModule('cordova-lib').configparser;
    var xcode = context.requireCordovaModule('xcode');

    var platforms = context.opts.platforms;

    if (platforms.indexOf('android') !== -1) {
        var buildGradlePath = path.join('platforms', 'android', 'build.gradle');
        var buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

        var buildscriptExtra =  '    repositories {\n' +
                                '        maven { url \'http://download.crashlytics.com/maven\' }\n' +
                                '    }\n' +
                                '    dependencies {\n' +
                                '        classpath \'com.crashlytics.tools.gradle:crashlytics-gradle:1.+\'\n' +
                                '    }\n';

        buildGradle = buildGradle.replace(/(buildscript {)/, '$1\n' + buildscriptExtra);

        fs.writeFileSync(buildGradlePath, buildGradle);
    }

    if (platforms.indexOf('ios') !== -1) {
        var config = new ConfigParser('config.xml');
        var appName = config.name();

        var xcodeProjectPath = path.join('platforms', 'ios', appName + '.xcodeproj', 'project.pbxproj');
        var xcodeProject = xcode.project(xcodeProjectPath);

        var iosPluginConfig = require('../../ios.json');

        var apiKey = iosPluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_KEY;
        var apiSecret = iosPluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_SECRET;

        xcodeProject.parse(function(err) {
            if (err) {
                throw err;
            }

            var entryPresent = false;
            var comment = 'Crashlytics run';

            for (var shellScriptBuildPhaseId in xcodeProject.hash.project.objects.PBXShellScriptBuildPhase) {
                if (shellScriptBuildPhaseId.indexOf('_comment') !== -1 &&
                        xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[shellScriptBuildPhaseId] === comment) {
                    entryPresent = true;
                    break;
                }
            }

            if (!entryPresent) {
                var id = xcodeProject.generateUuid();

                xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id] = {
                    isa: 'PBXShellScriptBuildPhase',
                    buildActionMask: 2147483647,
                    files: [],
                    inputPaths: [],
                    name: '"' + comment + '"',
                    outputPaths: [],
                    runOnlyForDeploymentPostprocessing: 0,
                    shellPath: '/bin/sh',
                    shellScript: '"../../plugins/org.apache.cordova.crashlytics/libs/ios/Crashlytics.framework/run ' + apiKey + ' ' + apiSecret + '"',
                    showEnvVarsInLog: 0
                };

                xcodeProject.hash.project.objects.PBXShellScriptBuildPhase[id + '_comment'] = comment;

                for (var nativeTargetId in xcodeProject.hash.project.objects.PBXNativeTarget) {
                    if (nativeTargetId.indexOf('_comment') === -1) {
                        xcodeProject.hash.project.objects.PBXNativeTarget[nativeTargetId].buildPhases.push({
                            value: id,
                            comment: comment
                        });
                    }
                }

                fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync());
            }
        });
    }
};
