package org.apache.cordova.crashlytics;

import java.lang.Override;
import java.util.HashMap;
import java.util.Map;

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

    static interface CrashlyticsCallSite {
        public void call(CordovaArgs args) throws JSONException;
    }

    static class CrashlyticsCall {
        int minExpectedArgsLength;
        CrashlyticsCallSite callSite;
        public CrashlyticsCall(int minExpectedArgsLength, CrashlyticsCallSite callSite) {
            this.minExpectedArgsLength = minExpectedArgsLength;
            this.callSite = callSite;
        }
    }

    public static final Map<String, CrashlyticsCall> CALL_SITES = new HashMap<String, CrashlyticsCall>(){{
        this.put("logError", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.log(args.getString(0));
            }
        }));
        this.put("throwError", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.logException(new RuntimeException(args.getString(0)));
            }
        }));
    }};

    @Override
    public boolean execute(String action, final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        if(CALL_SITES.containsKey(action)) {
            final CrashlyticsCall crashlyticsCall = CALL_SITES.get(action);
            if(args == null
                    // Doesn't seem to have any api (better than this...) to retrieve args' length ...
                    || args.getString(crashlyticsCall.minExpectedArgsLength -1)==null
                    || args.getString(crashlyticsCall.minExpectedArgsLength -1).length()==0) {
                callbackContext.error(String.format("Unsatisfied min args length (expected=%s)", crashlyticsCall.minExpectedArgsLength));
                return true;
            }

            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    crashlyticsCall.callSite.call(args);
                    callbackContext.success();
                }
            });
            return true;
        }

        return false;
    }
}