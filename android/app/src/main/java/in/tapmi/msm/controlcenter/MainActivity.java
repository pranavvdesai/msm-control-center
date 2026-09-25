package in.tapmi.msm.controlcenter;

import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (getBridge() != null && getBridge().getWebView() != null) {
            cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }
}
