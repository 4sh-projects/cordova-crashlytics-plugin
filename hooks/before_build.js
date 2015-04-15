var fs = require('fs');

module.exports = function(context) {
    var platforms = context.opts.platforms;

    if (platforms.indexOf('android') !== -1) {
        var androidPluginConfig = require('../../android.json');

        var apiKey = androidPluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_KEY;
        var apiSecret = androidPluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_SECRET;

        var crashlyticsProperties = '';
        crashlyticsProperties += 'apiKey=' + apiKey + '\n';
        crashlyticsProperties += 'apiSecret=' + apiSecret + '\n';

        fs.writeFileSync('platforms/android/crashlytics.properties', crashlyticsProperties);
    }
};
