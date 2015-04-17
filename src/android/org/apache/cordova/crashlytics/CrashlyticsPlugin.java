package org.apache.cordova.crashlytics;

import android.content.Context;

import com.crashlytics.android.Crashlytics;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import javax.security.auth.callback.Callback;

public class CrashlyticsPlugin extends CordovaPlugin {

    @Override
    public void pluginInitialize() {
        super.pluginInitialize();
        Crashlytics.start(cordova.getActivity());
    }

    private static enum BridgedMethods {
        logException(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.logException(new RuntimeException(args.getString(0)));
            }
        },
        log(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                if (argsLengthValid(3, args)) {
                    Crashlytics.log(args.getInt(0), args.getString(1), args.getString(2));
                } else {
                    Crashlytics.log(args.getString(0));
                }
            }
        },
        setApplicationInstallationIdentifier(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setApplicationInstallationIdentifier(args.getString(0));
            }
        },
        setBool(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setBool(args.getString(0), args.getBoolean(1));
            }
        },
        setDouble(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setDouble(args.getString(0), args.getDouble(1));
            }
        },
        setFloat(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setFloat(args.getString(0), Float.valueOf(args.getString(1)));
            }
        },
        setInt(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setInt(args.getString(0), args.getInt(1));
            }
        },
        setLong(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setLong(args.getString(0), args.getLong(1));
            }
        },
        setString(2){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setString(args.getString(0), args.getString(1));
            }
        },
        setUserEmail(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setUserEmail(args.getString(0));
            }
        },
        setUserIdentifier(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setUserIdentifier(args.getString(0));
            }
        },
        setUserName(1){
            @Override
            public void call(JSONArray args) throws JSONException {
                Crashlytics.setUserName(args.getString(0));
            }
        },
        simulateCrash(0, true){
            @Override
            public void call(JSONArray args) throws JSONException {
                String message = args.length() == 0 ? "This is a crash":args.getString(0);
                throw new RuntimeException(message);
            }
        };

        int minExpectedArgsLength;
        boolean throwThrowable;
        BridgedMethods(int minExpectedArgsLength) {
            this(minExpectedArgsLength, false);
        }
        BridgedMethods(int minExpectedArgsLength, boolean throwThrowable) {
            this.minExpectedArgsLength = minExpectedArgsLength;
            this.throwThrowable = throwThrowable;
        }

        public abstract void call(JSONArray args) throws JSONException;

        public static boolean argsLengthValid(int minExpectedArgsLength, JSONArray args) throws JSONException {
            return (args != null && args.length() >= minExpectedArgsLength);
        }

        public Runnable runnableFrom(final CallbackContext callbackContext, final JSONArray args) {
            final BridgedMethods method = this;
            return new Runnable() {
                @Override
                public void run() {
                    try {
                        method.call(args);
                        callbackContext.success();
                    } catch (Throwable t) {
                        callbackContext.error(t.getMessage());
                        if (method.throwThrowable) {
                            throw new RuntimeException(t);
                        }
                    }
                }
            };
        }
    }

    @Override
    public boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        try {
            final BridgedMethods bridgedMethods = BridgedMethods.valueOf(action);
            if (bridgedMethods != null) {
                if (!BridgedMethods.argsLengthValid(bridgedMethods.minExpectedArgsLength, args)) {
                    callbackContext.error(String.format("Unsatisfied min args length (expected=%s)", bridgedMethods.minExpectedArgsLength));
                    return true;
                }

                Runnable runnable = bridgedMethods.runnableFrom(callbackContext, args);
                cordova.getThreadPool().execute(runnable);

                return true;
            }
        }catch(IllegalArgumentException e) { // Didn't found any enum value corresponding to requested action
            return false;
        }

        return false;
    }
}