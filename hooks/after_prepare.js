var fs = require('fs');
var path = require('path');

module.exports = function(context) {
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
};
