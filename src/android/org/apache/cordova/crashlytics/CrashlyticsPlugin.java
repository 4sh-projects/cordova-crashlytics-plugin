package org.apache.cordova.crashlytics;

import android.content.Context;
import com.crashlytics.android.Crashlytics;
import org.apache.cordova.*;
import org.json.JSONException;

import java.util.HashMap;
import java.util.Map;

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

        public static boolean argsLengthValid(int minExpectedArgsLenght, CordovaArgs args) throws JSONException {
            return (args != null
                    // Doesn't seem to have any api (better than this...) to retrieve args' length ...
                    && args.getString(minExpectedArgsLenght -1)!=null
                    && args.getString(minExpectedArgsLenght -1).length()!=0);
        }
    }

    public static final Map<String, CrashlyticsCall> CALL_SITES = new HashMap<String, CrashlyticsCall>(){{
        this.put("logError", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.log(args.getString(0));
            }
        }));
        // Kept for backward compatibility only ...
        this.put("throwError", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.logException(new RuntimeException(args.getString(0)));
            }
        }));
        this.put("logException", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.logException(new RuntimeException(args.getString(0)));
            }
        }));
        this.put("log", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                if (CrashlyticsCall.argsLengthValid(3, args)) {
                    Crashlytics.log(args.getInt(0), args.getString(1), args.getString(2));
                } else {
                    Crashlytics.log(args.getString(0));
                }
            }
        }));
        this.put("setApplicationInstallationIdentifier", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setApplicationInstallationIdentifier(args.getString(0));
            }
        }));
        this.put("setBool", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setBool(args.getString(0), args.getBoolean(1));
            }
        }));
        this.put("setDouble", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setDouble(args.getString(0), args.getDouble(1));
            }
        }));
        this.put("setFloat", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setFloat(args.getString(0), Float.valueOf(args.getString(1)));
            }
        }));
        this.put("setInt", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setInt(args.getString(0), args.getInt(1));
            }
        }));
        this.put("setLong", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setLong(args.getString(0), args.getLong(1));
            }
        }));
        this.put("setString", new CrashlyticsCall(2, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setString(args.getString(0), args.getString(1));
            }
        }));
        this.put("setUserEmail", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setUserEmail(args.getString(0));
            }
        }));
        this.put("setUserIdentifier", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setUserIdentifier(args.getString(0));
            }
        }));
        this.put("setUserName", new CrashlyticsCall(1, new CrashlyticsCallSite() {
            @Override
            public void call(CordovaArgs args) throws JSONException {
                Crashlytics.setUserName(args.getString(0));
            }
        }));

    }};

    @Override
    public boolean execute(String action, final CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        if(CALL_SITES.containsKey(action)) {
            final CrashlyticsCall crashlyticsCall = CALL_SITES.get(action);
            if(!CrashlyticsCall.argsLengthValid(crashlyticsCall.minExpectedArgsLength, args)) {
                callbackContext.error(String.format("Unsatisfied min args length (expected=%s)", crashlyticsCall.minExpectedArgsLength));
                return true;
            }

            cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        crashlyticsCall.callSite.call(args);
                        callbackContext.success();
                    } catch (JSONException e) {
                        callbackContext.error(e.getMessage());
                    }
                }
            });
            return true;
        }

        return false;
    }
}