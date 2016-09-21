## TinCanJS Project Website

### API Doc Generation

To build the API doc checkout to the release tag, and then issue:

    grunt yuidoc

    The generated documentation will be available in `doc/api/`.

### Local Site Development

With Bundler (http://bundler.io - a Ruby project) installed, the site can be rendered locally using Jekyll with:

    bundle exec jekyll serve --baseurl='/TinCanJS'
