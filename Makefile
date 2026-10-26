.PHONY: setup web build

export BUNDLE_PATH ?= vendor/bundle

setup:
	bundle install

web:
	JEKYLL_ENV=development bundle exec jekyll serve --host 127.0.0.1

build:
	JEKYLL_ENV=production bundle exec jekyll build
