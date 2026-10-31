package com.knowledgeatlas.app;

import android.app.Activity;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import java.util.ArrayList;
import java.util.List;

/**
 * Optional "Sign in with Google" for cloud sync. Uses Google's Authorization API (Play services) to get a short-lived
 * access token for the user's own Drive appDataFolder (scope drive.appdata) plus openid/email/profile.
 * The OAuth client is matched by package name + signing certificate, so no client secret is in the app.
 */
@CapacitorPlugin(name = "GoogleDrive")
public class GoogleDrivePlugin extends Plugin {
    private ActivityResultLauncher<IntentSenderRequest> launcher;
    private PluginCall pending;

    @Override
    public void load() {
        launcher = getActivity().registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), this::onResult);
    }

    private AuthorizationRequest request(PluginCall call) {
        List<Scope> scopes = new ArrayList<>();
        try {
            for (Object s : call.getArray("scopes").toList()) scopes.add(new Scope(String.valueOf(s)));
        } catch (Exception e) { /* defaults below */ }
        if (scopes.isEmpty()) { scopes.add(new Scope("https://www.googleapis.com/auth/drive.appdata")); scopes.add(new Scope("openid")); scopes.add(new Scope("email")); scopes.add(new Scope("profile")); }
        return AuthorizationRequest.builder().setRequestedScopes(scopes).build();
    }

    @PluginMethod
    public void authorize(PluginCall call) {
        Identity.getAuthorizationClient(getActivity()).authorize(request(call))
            .addOnSuccessListener(result -> {
                if (result.hasResolution() && result.getPendingIntent() != null) {
                    if (call.getBoolean("silent", false)) { call.reject("Sign-in needed", "NEEDS_UI"); return; }
                    pending = call;
                    launcher.launch(new IntentSenderRequest.Builder(result.getPendingIntent().getIntentSender()).build());
                } else resolve(call, result);
            })
            .addOnFailureListener(e -> call.reject(e.getMessage() != null ? e.getMessage() : "Google sign-in failed", "FAILED"));
    }

    private void onResult(ActivityResult r) {
        PluginCall call = pending; pending = null;
        if (call == null) return;
        if (r.getResultCode() != Activity.RESULT_OK) { call.reject("Sign-in was cancelled", "CANCELLED"); return; }
        try { resolve(call, Identity.getAuthorizationClient(getActivity()).getAuthorizationResultFromIntent(r.getData())); }
        catch (Exception e) { call.reject(e.getMessage() != null ? e.getMessage() : "Google sign-in failed", "FAILED"); }
    }

    private void resolve(PluginCall call, AuthorizationResult result) {
        if (result.getAccessToken() == null) { call.reject("No access token", "FAILED"); return; }
        JSObject o = new JSObject();
        o.put("accessToken", result.getAccessToken());
        o.put("scopes", String.join(" ", result.getGrantedScopes()));
        call.resolve(o);
    }
}
