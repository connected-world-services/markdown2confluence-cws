Markdown2Confluence
===================

Convert [Markdown] to [Confluence Wiki Markup]. This is an updated version of the original [markdown2confluence-cws](https://github.com/connected-world-services/markdown2confluence-cws) project.

[![npm version][npm-badge]][npm-link]
[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Overview
--------

Using [Markdown] is fast becoming a standard for open-source projects and their documentation. There are a few variants, such as [GitHub Flavored Markdown], which add additional features.

Atlassian's Confluence has a different way of writing documentation, according to their [Confluence Wiki Markup] and [later pages](https://confluence.atlassian.com/display/DOC/Confluence+Wiki+Markup) and [references](https://roundcorner.atlassian.net/secure/WikiRendererHelpAction.jspa?section=all).

This project contains a library and a command-line tool that bridges the gap and converts from Markdown to Confluence.


Command-Line Use
----------------

Install the tool.

    npm install -g markdown2confluence-cws

Use it to convert a markdown file.

    markdown2confluence README.md

Or pipe in a file.

    cat README.md | markdown2confluence


Library Use
-----------

Use `npm` to install this package easily.

    $ npm install --save markdown2confluence-cws

Alternately you may edit your `package.json` and add this to your `dependencies` object:

    {
        ...
        "dependencies": {
            ...
            "markdown2confluence-cws": "*"
            ...
        }
        ...
    }

Now you write some JavaScript to load Markdown content and convert.

    markdown2confluence = require("markdown2confluence-cws");
    markdown = fs.readFileSync("README.md");
    confluence = markdown2confluence(markdown);
    console.log(confluence); // Converted!

This uses the wonderful [marked](https://www.npmjs.com/package/marked) library to parse and reformat the Markdown text. Because of this, you are welcome to pass additional options to the conversion function. See the marked package for options. Besides configuring marked, you can also change additional behavior.

    // Showing how to set two of the options for the marked library.
    confluence = markdown2confluence(markdown, {
        // When code has more than this many lines, set the collapse property
        // so Confluence shows a shorter block of code.
        codeCollapseAt: 20,

        // Map between Markdown and Confluence languages. There's a healthy
        // number of these defined. Setting this property overrides the
        // default mapping. If you want to augment the map, you could
        // add them to markdown2confluence.defaultLanguageMap.
        codeLanguageMap: {
            markdownLanguage: "confluenceLanguage"
        },

        // Additional code styling options.
        codeStyling: {
            linenumbers: true,
            theme: "RDark"
        },

        // Rewrite image urls using your own custom logic.
        imageRewrite: (href) => {
            return href;
        },

        // Rewrite link urls using your own custom logic.
        linkRewrite: (href) => {
            return href;
        },

        // These options are passed to marked. A .renderer property is
        // always added in order to change Markdown to Confluence Wiki Markup.
        marked: {
            gfm: true,
            tables: true
        }
    });


Supported Markdown
------------------

The aim of this library is to convert as much Markdown to Confluence Wiki Markup. As such, most Markdown is supported but there are going to be rare cases that are not supported (such as code blocks within lists) or other scenarios that people find.

If it is possible to convert the Markdown to Confluence Wiki Markup (without resorting to HTML), then this library should be able to do it. If you find anything wrong, it is likely a bug and should be reported. I would need a sample of Markdown, the incorrect translation and the correct way to represent that in Confluence. Please file an issue with this information in order to help replicate and fix the issue.

A good demonstration chunk of markdown is available in [demo.md](demo.md).

**What does not work?**

* HTML. It is copied verbatim to the output text.
* Did you find anything else? Please tell us about it by opening an issue.


License
-------

This software is licensed under an [ISC license][LICENSE].


[codecov-badge]: https://img.shields.io/codecov/c/github/connected-world-services/markdown2confluence-cws/master.svg
[codecov-link]: https://codecov.io/github/connected-world-services/markdown2confluence-cws?branch=master
[Confluence Wiki Markup]: https://confluence.atlassian.com/display/CONF42/Confluence+Wiki+Markup
[dependencies-badge]: https://img.shields.io/david/connected-world-services/markdown2confluence-cws.svg
[dependencies-link]: https://david-dm.org/connected-world-services/markdown2confluence-cws
[devdependencies-badge]: https://img.shields.io/david/dev/connected-world-services/markdown2confluence-cws.svg
[devdependencies-link]: https://david-dm.org/connected-world-services/markdown2confluence-cws#info=devDependencies
[GitHub Flavored Markdown]: https://guides.github.com/features/mastering-markdown/
[LICENSE]: LICENSE.md
[Markdown]: http://daringfireball.net/projects/markdown/syntax
[npm-badge]: https://img.shields.io/npm/v/markdown2confluence-cws.svg
[npm-link]: https://npmjs.org/package/markdown2confluence-cws
[travis-badge]: https://img.shields.io/travis/connected-world-services/markdown2confluence-cws/master.svg
[travis-link]: http://travis-ci.org/connected-world-services/markdown2confluence-cws
