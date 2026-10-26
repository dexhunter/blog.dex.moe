// External initialization keeps the Content Security Policy free of inline scripts.
(function () {
  var id = document.currentScript.getAttribute('data-measurement-id');
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
})();
