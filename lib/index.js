"use strict";

var defaultLanguageMap, marked, querystring;

marked = require("marked");
querystring = require("querystring");

// https://confluence.atlassian.com/doc/code-block-macro-139390.html
defaultLanguageMap = {
    "": "none",
    actionscript3: "actionscript3",
    bash: "bash",
    csharp: "csharp",
    coldfusion: "coldfusion",
    cpp: "cpp",
    css: "css",
    delphi: "delphi",
    diff: "diff",
    erlang: "erlang",
    groovy: "groovy",
    html: "html",
    java: "java",
    javafx: "javafx",
    javascript: "javascript",
    js: "javascript",
    perl: "perl",
    php: "php",
    powershell: "powershell",
    python: "python",
    ruby: "ruby",
    scala: "scala",
    shell: "bash",
    sql: "sql",
    vb: "vb",
    xml: "xml"
};


/**
 * This class is how the marked library translsates markdown into something
 * else.
 */
class ConfluenceRenderer {
    /**
     * Creates a new instance. The `options` parameter control a few
     * tweaks that can be applied by the user in order to render better
     * markup.
     *
     * @param {Object} options
     */
    constructor(options) {
        // Must not save it as `this.options` because marked overwrites
        // that property.
        this.renderOptions = options;
    }


    /**
     * Blockquote.
     *
     *   > This is a blockquote.
     *
     * is changed into
     *
     *   {quote}
     *   This is a blockquote.
     *   {quote}
     *
     * @param {string} text
     * @return {string}
     */
    blockquote(text) {
        return `{quote}\n${text.trim()}\n{quote}\n\n`;
    }


    /**
     * A line break. Supposedly if you have a line with 2 or more spaces
     * followed by a line that doesn't have whitespace, then it turns into
     * this element. I'm failing to reproduce that scenario.
     *
     * @return {string}
     */
    br() {
        return "\n";
    }


    /**
     * Code block.
     *
     *   ```js
     *   // JavaScript code
     *   ```
     *
     * is changed into
     *
     *   {code:language=javascript|borderStyle=solid|theme=RDark|linenumbers=true|collapse=false}
     *   // JavaScript code
     *   {code}
     *
     * @param {string} text
     * @param {string} lang
     * @return {string}
     */
    code(text, lang) {
        var stylingOptions;

        // Simple clone of the options.
        stylingOptions = JSON.parse(JSON.stringify(this.renderOptions.codeStyling));
        lang = lang || "";
        lang = lang.toLowerCase();
        lang = this.renderOptions.codeLanguageMap[lang] || this.renderOptions.codeLanguageMap[""];

        if (lang) {
            stylingOptions.language = lang;
        }

        // If too big, collapse.
        if (text.split("\n").length > this.renderOptions.codeCollapseAt) {
            stylingOptions.collapse = true;
        }

        // Convert to a string
        stylingOptions = querystring.stringify(stylingOptions, "|");

        if (stylingOptions) {
            stylingOptions = `:${stylingOptions}`;
        }

        return `{code${stylingOptions}}\n${text}\n{code}\n\n`;
    }


    /**
     * Inline code.
     *
     *   Text that has statements, like `a = true` or similar.
     *
     * turns into
     *
     *   Text that has statements, like {{a = true}} or similar.
     *
     * Be wary. This converts wrong: "Look at `~/file1` or `~/file2`"
     * Confluence thinks it is subscript and converts the markup into
     * "Look at <code><sub>/file1</code> or <code></sub>/file2</code>".
     * That's why some characters need to be escaped.
     *
     * @param {string} text
     * @return {string}
     */
    codespan(text) {
        text = text.split(/(&[^;]*;)/).map((match, index) => {
            // These are the delimeters.
            if (index % 2) {
                return match;
            }

            return match.replace(/[^a-zA-Z0-9 ]/g, (badchar) => {
                return `&#${badchar[0].charCodeAt(0)};`;
            });
        });

        return `{{${text.join("")}}}`;
    }


    /**
     * Strikethrough.
     *
     *   Supported ~~everywhere~~ in GFM only.
     *
     * turns into
     *
     *   Supported -everywhere- in GFM only.
     *
     * @param {string} text
     * @return {string}
     */
    del(text) {
        return `-${text}-`;
    }


    /**
     * Emphasis.
     *
     *   Typically this is *italicized* text.
     *
     * turns into
     *
     *   Typically this is _italicized_ text.
     *
     * @param {string} text
     * @return {string}
     */
    em(text) {
        return `_${text}_`;
    }


    /**
     * Headings 1 through 6.
     *
     *   Heading 1
     *   =========
     *
     *   # Heading 1 alternate
     *
     *   ###### Heading 6
     *
     * turns into
     *
     *   h1. Heading 1
     *
     *   h1. Heading 1 alternate
     *
     *   h6. Heading 6
     *
     * @param {string} text
     * @param {number} level
     * @return {string}
     */
    heading(text, level) {
        return `h${level}. ${text}\n\n`;
    }


    /**
     * Horizontal rule.
     *
     *   ---
     *
     * turns into
     *
     *   ----
     *
     * @return {string}
     */
    hr() {
        return "----\n\n";
    }


    /**
     * Embedded HTML.
     *
     *   <div></div>
     *
     * turns into
     *
     *   <div></div>
     *
     * @param {string} text
     * @return {string}
     */
    html(text) {
        return text;
    }


    /**
     * An embedded image.
     *
     *   ![alt-text](image-url)
     *
     * is changed into
     *
     *   !image-url!
     *
     * Markdown supports alt text and titles. Confluence does not.
     *
     * @param {string} href
     * @return {string}
     */
    image(href) {
        href = this.renderOptions.imageRewrite(href);

        return `!${href}!`;
    }


    /**
     * Link to another resource.
     *
     *   [Home](/)
     *   [Home](/ "some title")
     *
     * turns into
     *
     *   [Home|/]
     *   [some title|/]
     *
     * @param {string} href
     * @param {string} title
     * @param {string} text
     * @return {string}
     */
    link(href, title, text) {
        // Sadly, one must choose if the link's title should be displayed
        // or the linked text should be displayed. We picked the linked text.
        text = text || title;

        if (text) {
            text += "|";
        }

        href = this.renderOptions.linkRewrite(href);

        return `[${text}${href}]`;
    }


    /**
     * Converts a list.
     *
     *     # ordered
     *         * unordered
     *
     * becomes
     *
     *     # ordered
     *     #* unordered
     *
     * Note: This adds an extra "\r" before the list in order to cope
     * with nested lists better. When there's a "\r" in a nested list, it
     * is translated into a "\n". When the "\r" is left in the converted
     * result then it is removed.
     *
     * @param {string} text
     * @param {boolean} ordered
     * @return {string}
     */
    list(text, ordered) {
        text = text.trim();

        if (ordered) {
            text = text.replace(/^\*/gm, "#");
        }

        return `\r${text}\n\n`;
    }


    /**
     * Changes a list item. Always marks it as an unordered list, but
     * list() will change it back.
     *
     * @param {string} text
     * @return {string}
     */
    listitem(text) {
        // If a list item has a nested list, it will have a "\r" in the
        // text. Turn that "\r" into "\n" but trim out other whitespace
        // from the list.
        text = text.replace(/\s*$/, "").replace(/\r/g, "\n");

        // Convert newlines followed by a # or a * into sub-list items
        text = text.replace(/\n([*#])/g, "\n*$1");

        return `* ${text}\n`;
    }


    /**
     * A paragraph of text.
     *
     * @param {string} text
     * @return {string}
     */
    paragraph(text) {
        return `${text}\n\n`;
    }


    /**
     * Creates strong text.
     *
     *   This is typically **bolded**.
     *
     * becomes
     *
     *   This is typically *bolded*.
     *
     * @param {string} text
     * @return {string}
     */
    strong(text) {
        return `*${text}*`;
    }


    /**
     * Renders a table. Most of the work is done in tablecell.
     *
     * @param {string} header
     * @param {string} body
     * @return {string}
     */
    table(header, body) {
        return `${header}${body}\n`;
    }


    /**
     * Converts a table cell. When this is a header, the cell is prefixed
     * with two bars instead of one.
     *
     * @param {string} text
     * @param {Object} flags
     * @return {string}
     */
    tablecell(text, flags) {
        var boundary;

        if (flags.header) {
            boundary = "||";
        } else {
            boundary = "|";
        }

        return `${boundary}${text}`;
    }


    /**
     * Converts a table row. Most of the work is done in tablecell, however
     * that can't tell if the cell is at the end of a row or not. Get the
     * first cell's leading boundary and remove the double-boundary marks.
     *
     * @param {string} text
     * @return {string}
     */
    tablerow(text) {
        var boundary;

        boundary = text.match(/^\|*/);

        if (boundary) {
            boundary = boundary[0];
        } else {
            boundary = "|";
        }

        return `${text}${boundary}\n`;
    }


    /**
     * Simple text.
     *
     * @param {string} text
     * @return {string}
     */
    text(text) {
        return text;
    }
}


/**
 * Set up a default URI rewriter
 *
 * @param {string} href
 * @return {string}
 */
function defaultHrefRewrite(href) {
    return href;
}

module.exports = (markdown, options) => {
    var result;

    // Set defaults.
    options = options || {};
    options.marked = options.marked || {};
    options.codeLanguageMap = options.codeLanguageMap || defaultLanguageMap;
    options.codeStyling = options.codeStyling || {
        theme: "RDark",
        linenumbers: true
    };
    options.codeCollapseAt = options.codeCollapseAt || 20;
    options.linkRewrite = options.linkRewrite || defaultHrefRewrite;
    options.imageRewrite = options.imageRewrite || defaultHrefRewrite;

    // Always override this one property.
    options.marked.renderer = new ConfluenceRenderer(options);

    // Replace "\r\n" and "\r" with "\n".
		// Convert Buffer to String for replacement to work
		markdown = markdown.toString();
		//console.log(markdown);
    markdown = markdown.replace(/\r\n?/g, "\n");

    // Convert.
    result = marked(markdown, options.marked).trim();

    // Fix the \r placeholder for list beginnings. See list() for more info.
    result = result.replace(/\r/g, "");

    // Remove trailing whitespace.
    result = result.trim();

    return result;
};

module.exports.defaultLanguageMap = defaultLanguageMap;
