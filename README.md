Stack Exchange Editor Toolkit
=============================

## About

This userscript adds a button to edit pages on Stack Exchange sites that fixes most common grammatical and usage errors with a click and automatically composes an editing summary based on the changes made.

## Usage

![Example Usage](https://dl.dropboxusercontent.com/u/56017856/SOEdit.gif)

## Rules

The rules included in the standard script are as follows:

 - Uppercases lowercase "i"s in posts
 - Corrects to proper spelling/capitalization of "Stack Overflow" and "Stack Exchange" in order to fit the legal naming requirements
 - Expands "SO" and "SE" to "Stack Overflow" and "Stack Exchange," respectively
 - Corrects to proper spelling/capitalization of...
  - JavaScript
  - JSFiddle
  - jQuery
  - HTML
  - CSS
  - JSON
  - AJAX
  - AngularJS
  - PHP
  - Upvote/Downvote
 - Capitalizes the first letter of new lines
 - Removes common greetings
 - Removes "thanks" and similar phrases
 - Removes "Edit:" and similar modifiers
 - Replaces the now-banned mysite.domain with example.domain


## Expandability

The script can be easily expanded by adding rules to the `edits` dictionary with the format given below:

    anArbitraryName: {
        expr: /aRegularExpressionForMatching/,
        replacement: "What to replace it with (may include captured text like $1)",
        reason: "an unpunctuated reason starting with a lowercase letter that will be formatted automatically and inserted into the edit summary"
    },
    
If you fix any of my rules or come up with new ones, feel free to [make a pull request](https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/pulls).

If you notice any odd behavior of the script, please [report an issue](https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/issues/new) (this may seem obvious, but odd behavior may not seem like a "bug" in a traditional sense).
