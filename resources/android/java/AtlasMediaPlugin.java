package com.knowledgeatlas.app;

import android.app.Dialog;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Focus audio helpers.
 * - setBackgroundAudio: while focus sounds/music play, keep the WebView running when the app goes to the background or the
 *   screen turns off (partial wake lock, max 4 h; WebView kept resumed).
 * - spotifyLogin: opens Spotify's own login page in an in-app WebView dialog. All WebViews of the app share one cookie
 *   store, so after logging in the Spotify embed in the focus screen plays full tracks.
 */
@CapacitorPlugin(name = "AtlasMedia")
public class AtlasMediaPlugin extends Plugin {
    private PowerManager.WakeLock lock;
    private boolean keep = false;

    @Override
    public void load() {
        // The Spotify embed is a third-party iframe: it needs its cookies to know the user is logged in.
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(getBridge().getWebView(), true);
    }

    @PluginMethod
    public void setBackgroundAudio(PluginCall call) {
        keep = Boolean.TRUE.equals(call.getBoolean("on", false));
        try {
            if (keep) {
                if (lock == null) {
                    PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                    lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Prvlar:focusAudio");
                    lock.setReferenceCounted(false);
                }
                lock.acquire(4 * 60 * 60 * 1000L);
            } else if (lock != null && lock.isHeld()) lock.release();
        } catch (Exception ignored) { }
        call.resolve();
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (!keep) return;
        new Handler(Looper.getMainLooper()).post(() -> { WebView w = getBridge().getWebView(); w.onResume(); w.resumeTimers(); });
    }

    @PluginMethod
    public void spotifyLogin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Dialog d = new Dialog(getActivity(), android.R.style.Theme_DeviceDefault_Light_NoActionBar);
            LinearLayout box = new LinearLayout(getActivity()); box.setOrientation(LinearLayout.VERTICAL);
            Button done = new Button(getActivity()); done.setText("Done — back to Prvlar");
            WebView w = new WebView(getActivity());
            WebSettings s = w.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
            CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
            w.setWebViewClient(new WebViewClient());
            w.loadUrl("https://accounts.spotify.com/login?continue=https%3A%2F%2Fopen.spotify.com%2F");
            box.addView(done, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
            box.addView(w, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
            d.setContentView(box);
            done.setOnClickListener(v -> d.dismiss());
            d.setOnDismissListener(x -> { CookieManager.getInstance().flush(); w.destroy(); call.resolve(); });
            d.show();
        });
    }
}
