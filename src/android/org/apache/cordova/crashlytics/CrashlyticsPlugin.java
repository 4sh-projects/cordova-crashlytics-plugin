package org.apache.cordova.crashlytics;

import java.lang.Override;

import org.apache.cordova.*;

import android.content.Context;
import org.json.JSONException;
import com.crashlytics.android.Crashlytics;

public class CrashlyticsPlugin extends CordovaPlugin {

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        Crashlytics.start((Context) cordova.getActivity());
    }

    @Override
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        final String message = args.getString(0);
        if(message == null || message.length()==0) {
            callbackContext.error("Expected one non-empty string argument.");
            return true;
        }

        if("logError".equals(action)) {
            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    Crashlytics.log(message);
                    callbackContext.success();
                }
            });
            return true;
        } else if("throwError".equals(action)) {
            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    Crashlytics.logException(new RuntimeException(message));
                    callbackContext.success();
                }
            });
            return true;
        }
        return false;
    }
}