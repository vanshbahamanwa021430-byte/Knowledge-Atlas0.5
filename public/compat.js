/* Runs on any browser engine (ES5). If the app has not started within a few seconds, which happens when
   the device's built-in browser engine is too old, explain what to update instead of showing a blank screen. */
(function () {
  function show() {
    if (window.__atlasBooted) return;
    var el = document.getElementById('app');
    if (!el || el.children.length) return;
    el.innerHTML = '<div style="font:16px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#0F1A3D;max-width:520px;margin:12vh auto;padding:24px">' +
      '<h1 style="font-size:26px;margin:0 0 12px">This device needs an update</h1>' +
      '<p>Knowledge Atlas could not start because the built-in browser engine on this device is too old.</p>' +
      '<p><b>Android:</b> open the Play Store, update <b>Android System WebView</b> and <b>Chrome</b>, then reopen the app.</p>' +
      '<p><b>iPhone or iPad:</b> update to iOS 14 or later in Settings, General, Software Update.</p>' +
      '<p><b>Computer:</b> use a current version of Chrome, Edge, Firefox or Safari.</p></div>';
  }
  var modules = 'noModule' in document.createElement('script');
  if (!modules) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show(); }
  else setTimeout(show, 9000);
})();
