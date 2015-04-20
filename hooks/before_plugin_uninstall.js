var android = require('./lib/android');
var ios = require('./lib/ios');

module.exports = function(context) {
    var platforms = context.opts.cordova.platforms;

    if (platforms.indexOf('android') !== -1) {
        android.deletePropertiesFile();

        android.removeBuildGradleExtras();
    }

    if (platforms.indexOf('ios') !== -1) {
        var xcodeProjectPath = ios.getXcodeProjectPath(context);

        return ios.removeShellScriptBuildPhase(context, xcodeProjectPath);
    }
};
