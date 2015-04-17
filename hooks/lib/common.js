var path = require('path');

module.exports = {
    getPluginConfig: function(platform) {
        var pluginConfig = require(path.join('..', '..', '..', platform + '.json'));

        return {
            apiKey: pluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_KEY,
            apiSecret: pluginConfig.installed_plugins['org.apache.cordova.crashlytics'].CRASHLYTICS_API_SECRET
        };
    }
};
