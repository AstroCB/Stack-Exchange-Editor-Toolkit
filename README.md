Stack Exchange Editor Toolkit
=============================

## About

This userscript adds a button to edit pages on Stack Exchange sites that fixes most common grammatical and usage errors with a click and automatically composes an editing summary based on the changes made.

# Usage

![Example Usage](https://photos-3.dropbox.com/t/0/AADLNho-ZKYJbQBobIWnCs0WzmDRZrKctzOcFam3r5Cw_Q/12/56017856/jpeg/1024x768/3/1411675200/0/2/SOEdit.gif/oAM3WqbLbrU2iG_IlTwyOn-xTMLSJmuH5Ke3o-sc1ZM)

## Known issues

 - Changes `i` in code to I (fix in progress)
 - May add Stack Overflow reason to edit summary if it is detected despite correct usage (fix in progress)
 - Removal of "Edit" and "Update" may not occur if enclosed in bold (`**`) or italic (`*`) markers (minor)
 - If a URL begins a line, its first letter will be capitalized (minor)
 - When "Thanks" is removed, its entire line is removed. If "thanks" is used not as a token of gratitude, but as a descriptor, or is part of the context of the post, it may change the post's meaning. Also, if used on the case below, only "Thanks," will be removed, and "Example Name" will not (minor)

> Thanks,
>
> Example Name
