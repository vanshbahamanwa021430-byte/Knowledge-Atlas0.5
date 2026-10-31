package com.knowledgeatlas.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleDrivePlugin.class);
        registerPlugin(AtlasMediaPlugin.class);
        registerPlugin(AtlasSecurePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
