source "https://rubygems.org"

# blog.dex.moe is built by GitHub Pages' classic builder, so pin the same
# toolchain locally (Jekyll 3.10 + whitelisted plugins). To upgrade, run
# `bundle update github-pages`. Run Jekyll with `bundle exec jekyll serve`.
# Versions: https://pages.github.com/versions/
gem "github-pages", group: :jekyll_plugins

# Ruby >= 3.0 no longer bundles webrick, which `jekyll serve` needs.
gem "webrick"

# If you have any plugins, put them here! They must be on the GitHub Pages
# whitelist or they will be ignored in production.
group :jekyll_plugins do
   gem "jekyll-feed"
   gem "jekyll-seo-tag"
   # gem "jekyll-last-modified-at" # not supported at github-pages safemode
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
