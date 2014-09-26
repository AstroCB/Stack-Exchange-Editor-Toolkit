Stack Exchange Editor Toolkit
=============================

## About

This userscript adds a button to edit pages on Stack Exchange sites that fixes most common grammatical and usage errors with a click and automatically composes an editing summary based on the changes made.

## Usage

![Example Usage](https://dl.dropboxusercontent.com/u/56017856/SOEdit.gif)

## Expandability

The script can be easily expanded by adding rules to the `edits` dictionary with the format given below:

    anArbitraryName: {
        expr: /aRegularExpressionForMatching/,
        replacement: "What to replace it with (may include captured text like $1)",
        reason: "an unpunctuated reason starting with a lowercase letter that will be formatted automatically and inserted into the edit summary"
    },
    
    If you fix any of my rules or come up with new ones, feel free to make a pull request.

## Known issues

 - Changes `i` in code to I (fix in progress)
 - May add Stack Overflow reason to edit summary if it is detected despite correct usage (fix in progress)
 - Removal of "Edit" and "Update" may not occur if enclosed in bold (`**`) or italic (`*`) markers (minor)
 - If a URL begins a line, its first letter will be capitalized (minor)
 - When "Thanks" is removed, its entire line is removed; so, if "thanks" is used not as a token of gratitude, but as a descriptor, or is part of the context of the post, it may change the post's meaning (minor)
   - If used on the case below, only "Thanks," will be removed, and "Example Name" will not

     > Thanks,
     >
     > Example Name
