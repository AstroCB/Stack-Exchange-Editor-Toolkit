# Stack Exchange Editor Toolkit <img alt="Stack Exchange Auto Editor Logo" src="https://i.imgur.com/79qYzkQ.png" style="width:1em;height:1em;vertical-align:sub">

## About

This user script adds a button when editing Stack Exchange sites that automatically fixes many common grammar, spelling, capitalization, and usage errors.

[View on Stack Apps](http://stackapps.com/questions/4899/stack-exchange-editor-toolkit)

## Installation

1. Install a user script extension (such as [Tampermonkey](https://www.tampermonkey.net/)) for your browser. [Greasy Fork](https://greasyfork.org/en) maintains a list of user script extensions that are available for various browsers.
2. [Click here to install `editor.user.js`](https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/raw/master/editor.user.js) within your user script manager.

## Usage

1. Edit a post or a comment on a Stack Exchange site.
1. Click the Auto Editor button that appears in the toolbar for posts or below comments.
1. The edit area will flash green if edits were automatically made, red if no edits were needed.
1. Click the same button again to get a report of what changed, see diffs, and view the status of the unit tests.
1. Submit the edits to Stack Exchange after making other manual edits as desired.

⚠️ **This tool sometimes suggests edits that make posts worse.** You are responsible for manually reviewing all edits. Auto-edit rules are created from heuristics and regular expressions and they are not infallible. This tool is designed to save you effort by doing the right thing 90% of time. Bad auto-edits will need to be manually fixed or abandoned. All edits will have your name attached to them, so you don't want to blindly trust this tool.

## Rules

This script performs the following actions automatically:

 - Corrects commonly misspelled words such as "untill" → "until"
 - Capitalizes commonly used technologies names and acronyms such as "javascript" → "JavaScript"
 - Fixes contractions with a missing apostrophe such as  such as "dont" → "don't"
 - Ensures the title starts with a capital letter but is not all caps.
 - Removes niceties such as "hello", "thanks", and "please help"
 - Removes "Edit:"
 - Code format HTML tags not allowed in markdown
 - Replaces domain names like "mydomain", "abc" or "foo" that have a real top level domain with [officially approved example domains](https://datatracker.ietf.org/doc/html/rfc2606#section-3) like `example.com`. When multiple different example domains are used, the replacements will use the [`.example` top level domain which is also reserved for example usage](https://datatracker.ietf.org/doc/html/rfc2606#section-2).
 - Applies code formatting to example URLs and file names

To minimize false-auto-corrections, these rules are markdown-aware. For example, spelling corrections are not applied inside code blocks or URLs. Each rule has a list of places where it should be applied.

The rules are coded into the [source code for the script](https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/blob/master/editor.user.js). To change the rules, you would need to edit it.
