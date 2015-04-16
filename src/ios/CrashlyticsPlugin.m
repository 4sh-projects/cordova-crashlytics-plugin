#import <Crashlytics/Crashlytics.h>

#import "CrashlyticsPlugin.h"

@interface CrashlyticsPlugin ()

@property (nonatomic, strong) Crashlytics* crashlytics;

@end

@implementation CrashlyticsPlugin

#pragma mark - Initializers

- (void)pluginInitialize {
    [super pluginInitialize];

    NSDictionary *settings = self.commandDelegate.settings;
    NSString *apiKey = settings[@"crashlytics_api_key"];

    if (apiKey == nil) {
        [NSException raise:@"CrashlyticsPlugin error!" format:@"No API Key configured"];
    }

    self.crashlytics = [Crashlytics startWithAPIKey:apiKey];
}

@end
