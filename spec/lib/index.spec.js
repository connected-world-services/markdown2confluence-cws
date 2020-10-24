"use strict";

var convert;

convert = require("../../");

describe("markdown2confluence", () => {
    describe("general", () => {
        it("accepts a string", () => {
            expect(convert("abc")).toEqual("abc");
        });
        it("accepts a Buffer", () => {
            expect(convert(Buffer.from("abc", "utf8"))).toEqual("abc");
        });
    });
    describe("blockquote", () => {
        it("converts a single line quote correctly", () => {
            expect(convert(`Paragraph

> one line quote

Another paragraph`)).toEqual(`Paragraph

{quote}
one line quote
{quote}

Another paragraph`);
        });
        it("works on multi-line quotes and multiple quotes", () => {
            expect(convert(`> line 1
> line 2

inner text

> quote 2
> More quote 2
> and more`)).toEqual(`{quote}
line 1
line 2
{quote}

inner text

{quote}
quote 2
More quote 2
and more
{quote}`);
        });
    });
    describe("br", () => {
        // Not really sure how to get the "br" code to trigger.
    });
    describe("code", () => {
        it("formats with code fences", () => {
            expect(convert("```js\nthis is code\n```")).toEqual(`{code:theme=RDark|linenumbers=true|language=javascript}
this is code
{code}`);
        });
        it("formats with indentation", () => {
            expect(convert(`
    // different code
`)).toEqual(`{code:theme=RDark|linenumbers=true|language=none}
// different code
{code}`);
        });
        it("uses the language map (lowercased) and code styling options", () => {
            expect(convert("```Moo\ncow()\n```", {
                codeLanguageMap: {
                    moo: "cowspeak"
                },
                codeStyling: {
                    anything: "goes_here"
                }
            })).toEqual(`{code:anything=goes_here|language=cowspeak}
cow()
{code}`);
        });
        it("allows 20 lines before collapsing", () => {
            expect(convert("```\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n```", {
                codeStyling: {}
            })).toEqual("{code:language=none}\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n{code}");
        });
        it("collapses when too big", () => {
            expect(convert("```\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n```", {
                codeStyling: {}
            })).toEqual("{code:language=none|collapse=true}\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n13\n14\n15\n16\n17\n18\n19\n20\n21\n{code}");
        });
        it("collapses at a set number", () => {
            expect(convert("```\n1\n2\n3\n```", {
                codeStyling: {},
                codeCollapseAt: 2
            })).toEqual("{code:language=none|collapse=true}\n1\n2\n3\n{code}");
        });
    });
    describe("codespan", () => {
        it("wraps things in braces", () => {
            expect(convert("text `code` text text `code`")).toEqual("text {{code}} text text {{code}}");
        });
        it("changes unsafe text so Confluence understands it", () => {
            expect(convert("`~/file` and `~/folder` and `{braces}`")).toEqual("{{&#126;&#47;file}} and {{&#126;&#47;folder}} and {{&#123;braces&#125;}}");
        });
        it("preserves entities that are already HTML encoded", () => {
            expect(convert("`Fish&Chips`")).toEqual("{{Fish&amp;Chips}}");
            expect(convert("`> and <`")).toEqual("{{&gt; and &lt;}}");
        });
        it("is a bit strange here", () => {
            // The markdown processing treats this as NOT HTML, so it is
            // going to escape the & into &amp; first.
            expect(convert("`it&#38;s`")).toEqual("{{it&amp;&#35;38&#59;s}}");
        });
    });
    describe("del / strikethrough", () => {
        it("converts in GFM", () => {
            expect(convert("~~thing~~")).toEqual("-thing-");
        });
    });
    describe("em / italics", () => {
        it("converts", () => {
            expect(convert("*one* and _two_")).toEqual("_one_ and _two_");
        });
    });
    describe("headings", () => {
        it("works on multi-line headings", () => {
            expect(convert("multi-line\n====")).toEqual("h1. multi-line");
        });
        it("works on single-line headings", () => {
            expect(convert("###### single-line")).toEqual("h6. single-line");
        });
    });
    describe("hr", () => {
        it("provides a horizontal rule", () => {
            expect(convert("---")).toEqual("----");
        });
        it("adds a blank line", () => {
            expect(convert("--------------\nWords here")).toEqual("----\n\nWords here");
        });
    });
    describe("html", () => {
        it("embeds HTML", () => {
            expect(convert("<div>\n</div>")).toEqual("<div>\n</div>");
        });
    });
    describe("image", () => {
        it("embeds an image", () => {
            expect(convert("![alt text](image.png \"title\")")).toEqual("!image.png!");
        });
        it("works with referenced links", () => {
            expect(convert("![alt text][img]\n\n[img]: <image.png> \"title\"")).toEqual("!image.png!");
        });
        it("allows href rewriting", () => {
            expect(convert("![alt text](image.png)", {
                imageRewrite: (href) => {
                    return `http://example.com/${href}`;
                }
            })).toEqual("!http://example.com/image.png!");
        });
    });
    describe("link", () => {
        it("embeds a link", () => {
            expect(convert("[text](url/ \"title\")")).toEqual("[text|url/]");
        });
        it("embeds a link with a link definition", () => {
            expect(convert("[text][ref]\n\n[ref]: <url/> (title)")).toEqual("[text|url/]");
        });
        it("allows href rewriting", () => {
            expect(convert("[text](url/)", {
                linkRewrite: (href) => {
                    return `http://example.com/${href}`;
                }
            })).toEqual("[text|http://example.com/url/]");
        });
    });
    describe("list", () => {
        // All of these tests have an extra newline above the list
        // because there's really no other way handle nested lists.
        // Check the source code for better explanations.
        it("converts an unordered, collapsed list", () => {
            expect(convert(`Unordered, collapsed

* one
* two
* three`)).toEqual(`Unordered, collapsed

* one
* two
* three`);
        });
        it("converts an unordered, expanded list", () => {
            expect(convert(`Unordered, expanded
* one

* two

* three`)).toEqual(`Unordered, expanded

* one
* two
* three`);
        });
        it("converts an ordered, collapsed list", () => {
            expect(convert(`Ordered, collapsed

1. one
2. two
3. three`)).toEqual(`Ordered, collapsed

# one
# two
# three`);
        });
        it("converts an ordered, expanded list", () => {
            expect(convert(`Ordered, expanded

1. one

2. two

3. three`)).toEqual(`Ordered, expanded

# one
# two
# three`);
        });
        it("converts a terribly complex list", () => {
            expect(convert(`* unordered:1:1
* unordered:1:2
    1. ordered:2:1
        1. ordered:3:1
        2. ordered:3:2
    2. ordered:2:2
        * unordered:4:1
        * unordered:4:2
    3. ordered:2:3
        * unordered:5:1
* unordered:1:3
    * unordered:6:1
        1. ordered:7:1
        2. ordered:7:2
    * unordered:6:2
        * unordered:8:1
        * unordered:8:2
* unordered:1:4`)).toEqual(`* unordered:1:1
* unordered:1:2
*# ordered:2:1
*## ordered:3:1
*## ordered:3:2
*# ordered:2:2
*#* unordered:4:1
*#* unordered:4:2
*# ordered:2:3
*#* unordered:5:1
* unordered:1:3
** unordered:6:1
**# ordered:7:1
**# ordered:7:2
** unordered:6:2
*** unordered:8:1
*** unordered:8:2
* unordered:1:4`);
        });
    });
    describe("paragraphs", () => {
        it("manages newlines", () => {
            expect(convert("line1\n\n\n\nline2")).toEqual("line1\n\nline2");
        });
    });
    describe("strong / bold", () => {
        it("converts", () => {
            expect(convert("**one** and __two__")).toEqual("*one* and *two*");
        });
    });
    describe("tables", () => {
        it("converts a simple table", () => {
            expect(convert(`| heading | heading2 |
|---|---|
| cell1 | cell2 |`)).toEqual(`||heading||heading2||
|cell1|cell2|`);
        });
    });
    describe("text", () => {
        it("converts plain text", () => {
            expect(convert("text\ntext2")).toEqual("text\ntext2");
        });
    });
});
