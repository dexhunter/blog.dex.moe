// Shows this page's view count from GoatCounter in the footer.
// Requires "Allow adding visitor counts on your website" in GoatCounter settings.
(function () {
  var el = document.getElementById('pageviews');
  if (!el || !window.fetch) return;
  var url = el.getAttribute('data-endpoint') + '/counter/' +
    encodeURIComponent(location.pathname) + '.json';
  fetch(url).then(function (r) {
    // 404 means no views recorded yet for this path; keep the line hidden.
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (d) {
    el.querySelector('.pageviews-count').textContent = d.count;
    el.hidden = false;
  }).catch(function () {});
})();
