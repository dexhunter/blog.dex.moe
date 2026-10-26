# Dex's blog

Jekyll site at <https://blog.dex.moe>, built with GitHub Pages.

## Local preview

Use Homebrew Ruby instead of Apple's system Ruby:

```sh
brew install ruby
export PATH="$(brew --prefix ruby)/bin:$PATH"
make setup
make web
```

Run these commands from the repository directory, then open
<http://127.0.0.1:4000>. Restart the server after changing _config.yml.
Setup needs access to RubyGems; native gems may need Apple's Command Line
Tools (`xcode-select --install`). Gems are installed in ignored vendor/bundle.
The Gemfile uses github-pages to match the hosted Jekyll toolchain.

## Production and Analytics

`make build` generates _site with JEKYLL_ENV=production; it does not publish.
Deploy by pushing to the existing GitHub Pages source branch.

GA4 uses measurement ID G-VZBYFXB76V from _config.yml. The shared head loads
Analytics once per page in production only. Development previews do not send
Analytics events. Initialization is in assets/js/analytics.js to preserve the
Content Security Policy's ban on inline scripts. The policy allows only the
Google script and collection hosts needed by this integration in production.
The existing GoatCounter page-view display remains enabled.

After deployment, check the page source for G-VZBYFXB76V and confirm traffic
in [Analytics Realtime](https://analytics.google.com/analytics/web/#/a96340754p560810647/reports/intelligenthome).
