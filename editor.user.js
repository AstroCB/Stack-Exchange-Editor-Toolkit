// ==UserScript==
// @name Stack Exchange Auto Editor
// @author Stephen Ostermiller
// @author Cameron Bernhardt (AstroCB)
// @developer Jonathan Todd (jt0dd)
// @developer sathyabhat
// @contributor Unihedron
// @license MIT
// @version 1.6.0
// @namespace http://github.com/AstroCB
// @updateURL https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/raw/master/editor.meta.js
// @downloadURL https://github.com/AstroCB/Stack-Exchange-Editor-Toolkit/raw/master/editor.user.js
// @description Fixes common grammar and usage mistakes on Stack Exchange posts with a click
// @match https://*.stackexchange.com/posts/*
// @match https://*.stackexchange.com/questions/*
// @match https://*.stackexchange.com/review/*
// @match https://*.stackoverflow.com/*posts/*
// @match https://*.stackoverflow.com/*questions/*
// @match https://*.stackoverflow.com/review/*
// @match https://*.askubuntu.com/posts/*
// @match https://*.askubuntu.com/questions/*
// @match https://*.askubuntu.com/review/*
// @match https://*.superuser.com/posts/*
// @match https://*.superuser.com/questions/*
// @match https://*.superuser.com/review/*
// @match https://*.serverfault.com/posts/*
// @match https://*.serverfault.com/questions/*
// @match https://*.serverfault.com/review/*
// @match https://*.mathoverflow.net/posts/*
// @match https://*.mathoverflow.net/questions/*
// @match https://*.mathoverflow.net/review/*
// @match https://*.stackapps.com/posts/*
// @match https://*.stackapps.com/questions/*
// @match https://*.stackapps.com/review/*
// @grant GM_addStyle
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_xmlhttpRequest
// @connect raw.githubusercontent.com
// ==/UserScript==
(()=>{
	const ENVIRONMENT = getEnvironment()

	const DATA = {}
	ENVIRONMENT.file("spelling-corrections.txt",x=>{DATA.spellingCorrections=x})
	ENVIRONMENT.file("content-free-words.txt",x=>{DATA.contentFreeWords=x})
	ENVIRONMENT.file("example-domain-words.txt",x=>{DATA.exampleDomainWords=x})
	ENVIRONMENT.file("file-extensions.txt",x=>{DATA.fileExtensions=x})
	ENVIRONMENT.file("top-level-domains.txt",x=>{DATA.topLevelDomains=x})

	const rules = []

	function waitForData(){
		if (Object.keys(DATA).length != 5){
			setTimeout(waitForData,50)
			return
		}

		DATA.POST_CODE_FORMAT = /([_\*\"\'\`\;\,\.\?\:\!\)\>]*(?=\s|$))/

		const MISSPELLINGS = Object.assign({},...(
			DATA.spellingCorrections.trim().split(/[\n\|]/).map(l=>{
				var r = l.split(/:/)
				if(r.length>2) throw "Extra colons in " + l
				var toc = [], cor=r[r.length-1]
				if (!toc) throw "Empty correction: " + l
				if (r.length==2) toc = r[0].split(/,/)
				if (/[A-Z]/.test(cor)) toc.push(cor.toLowerCase())
				if (!toc.length) throw "No correction for " + cor
				return Object.assign({},...toc.map(w=>({[w]:cor})))
			})
		))

		const CONTENT_FREE_WORDS = "(?:"+DATA.contentFreeWords.trim().replace(/\n/g,"|")+")"

		// Top 100 from https://dnsinstitute.com/research/popular-tld-rank/ plus "tld"
		const TLD = new RegExp('(?:\\\\?\\.com?)?\\\\?\\.(?:'+DATA.topLevelDomains.trim().replace(/\n/g,"|")+')')

		const SUBDOM = /(?:(?:[a-zA-Z0-9\-]+|[\*\%])\\?\.)*/
		const REST_OF_URL = /(?:[\?\/\$\{][^ ]*?)?/
		const PORT_OPT = /(?:\:[0-9]+)?/
		const USER_OPT = /(?:[a-zA-Z\-\.]+\@)?/
		const PRE_CODE_FORMAT = /(^|\s)([_\*\"\'\(\<]*)/
		const ANSWER_WORDS = /(?:answers?|assistance|advice|examples?|fix|help|hints?|guidance|ideas?|point|pointers?|tips?|suggestions?)/
		const BETWEEN_WORDS = "[, \\-\\/]+"
		DATA.EXAMPLE_DOMAIN = new RegExp("^((?:.*\\.)?)(" +
				// Made entirely of example-like words
				// Followed by an optional number or single letter
				"(?:(?:(?:"+DATA.exampleDomainWords.trim().replace(/\n/g,"|")+"|(?:(?<=[a-zA-Z\\-])co)|(?:a(?=[a-zA-Z\\-]{3,})))-?)+(?:-?(?:[0-9]+|[A-Za-z]))?)" +
			')('+TLD.source +')$'
		,'i')
		DATA.DOMAIN_NAME = /(?<=^|[^A-Za-z0-9\\-\\.])(\.?(?:(?:[a-zA-Z0-9\-_]+|[\*\%])\\?\.)+[a-zA-Z]+)(?=\.?(?:[\;\,\:\/_\"\*'\)\<\>\?\!\` \t\$]|$))/gmi
		const WORD_OR_NON=/(?:[0-9a-zA-Z]+)|(?:[^0-9a-zA-Z]+)/gm
		const WORD=/^[0-9a-zA-Z]+$/

		rules.push(...[
			{
				expr: /\b(https?)[ \t]*:[ \t]*\/[ \t]*\/[ \t]*([a-zA-Z0-9\-]+)[ \t]*\./gi,
				replacement: "$1://$2.",
				reason: "fix URL",
				context: ["fullbody","title"]
			},{
				// Remove blank lines from beginning
				expr: /^[\n\r]+/gi,
				replacement: "",
				reason: "formatting",
				context: ["fullbody"],
				score: .1
			},{
				expr: DATA.DOMAIN_NAME,
				replacement: (domain)=>{
					var m = DATA.EXAMPLE_DOMAIN.exec(domain)
					if (!m) return domain
					var pre=m[1],
					name=m[2],
					tld=m[3]

					var escape = "";
					if (/^\\/.test(tld)){
						escape="\\"
						tld = tld.substr(1)
					}
					if (!/^example$/i.test(name)){
						if (context.exampleDomains[normalizeDomain(tld)] != 1){
							name = name.replace(/-example-/gi,'-').replace(/-?example-?/gi,'')
							tld='.example'
						} else {
							name = "example"
						}
					}
					return pre+name+escape+tld
				},
				reason: "use example domain",
				context: ["title","text","code","url"],
				score: .5
			},{
				// https://meta.stackexchange.com/questions/1777/what-html-tags-are-allowed-on-stack-exchange-sites
				expr: /.+/g,
				replacement: m=>{
					if (/^<\s*\/?\s*(?:a|b|blockquote|br|code|del|dd|dl|dt|em|h1|h2|h3|h4|h5|h6|hr|i|img|kbd|li|ol|p|pre|s|strike|strong|sub|sup|ul)(?:\s|\>|\/)/i.test(m)){
						// allowed tags
						return m
					}
					if(/^<\!\-\-\s*(?:language|language-all|begin snippet|end snippet|summary|End of automatically inserted text)/.test(m)){
						// Special comments
						return m
					}
					return "`"+m+"`"
				},
				reason: 'code format HTML',
				context: ["html"],
				score: 0
			},{
				expr: /^``$/g,
				replacement: "",
				reason: "remove empty code",
				context: ["code"],
				score: .2
			},{
				// Insert spaces after commas
				expr: /,([[a-z])/g,
				replacement: ", $1",
				reason: "grammar",
				score: .4
			},{
				// Remove spaces before punctuation
				expr: /[ ]+([,\!\?\.\:](?:\s|$))/gm,
				replacement: "$1",
				reason: "grammar",
				score: .4
			},{
				// Remove double spaces after periods
				expr: /([,\!\?\.\:]) {2,}/gm,
				replacement: "$1 ",
				reason: "grammar",
				score: .01
			},
			capitalizeWord(".htaccess","\\.?htacc?ess?"),
			capitalizeWordAndVersion("iOS", null, " "),
			capitalizeWord("Node.js","node\\.js"),
			capitalizeWordAndVersion("SQLite"),
			capitalizeWord("UTF-8"),
			{
				expr: new RegExp(/((?:^|\s)\(?)([A-Za-z0-9'\-]+)/.source + DATA.POST_CODE_FORMAT.source, "gm"),
				replacement: (p0,p1,w,p3)=>{
					if (MISSPELLINGS.hasOwnProperty(w)){
						w = MISSPELLINGS[w] // abbreviations or all lower case
					} else {
						var lc = w.toLowerCase()
						if (MISSPELLINGS.hasOwnProperty(lc)){
							var correct = MISSPELLINGS[lc]
							if (/[A-Z]/.test(correct)) w = correct // Always use capitalization proper noun corrections
							else if (/^(?:[A-Z][a-z]+)+$/.test(w)) w = correct[0].toUpperCase() + correct.substr(1) // Match capitalizization of misspelling
							else w = correct // Use lower case correction
						}
					}
					return p1+w+p3
				},
				reason: spellingReason,
				score: spellingScore
			},{
				edit: s=>{
					var m, tokens=[], replacements = []
					while (m = WORD_OR_NON.exec(s)){
						tokens.push(m[0])
					}
					for (var i=0; i<tokens.length-2; i++){
						if (WORD.test(tokens[i]) && /^[ \/\-]+$/.test(tokens[i+1])){
							var lc = (tokens[i] + " " + tokens[i+2]).toLowerCase()
							if (MISSPELLINGS.hasOwnProperty(lc)){
								var original = tokens[i] + tokens[i+1] + tokens[i+2]
								var correct = MISSPELLINGS[lc]
								if (!/[A-Z]/.test(correct) && /^(?:[A-Z][a-z]+)+$/.test(original)) correct = correct[0].toUpperCase() + correct.substr(1) // Match capitalizization of misspelling
								if (correct != original){
									tokens[i] = correct
									tokens[i+1] = ""
									tokens[i+2] = ""
									replacements.push({i:original,o:correct})
								}
							}
						}
					}
					return [replacements.length==0?s:tokens.join(""),replacements]
				},
				reason: spellingReason,
				score: spellingScore
			},{
				expr: /((?:^|\s)\(?)c(#|\++|\s|$)/gm,
				replacement: "$1C$2",
				reason: spellingReason,
				score: spellingScore
			},{
				expr: new RegExp(/((?:^|\s)\(?)[Ii]'?(m|ve)/.source + DATA.POST_CODE_FORMAT.source, "gm"),
				replacement: "$1I'$2$3",
				reason: spellingReason,
				score: spellingScore
			},{
				expr: new RegExp(
					"(?:[\\.\\!\\?]|\n\n|\r\r|\r\n\r\n|^)[\r\n\t ]*(?:"+ // Required start of sentence or paragraph
						"(?:" + CONTENT_FREE_WORDS + BETWEEN_WORDS + ")*(?:(?:"+[
							"thanks",
							"thank[ \\-]+you"
						].join(")|(?:")+"))"+
						"(?:" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*"+
						" *(?:[\\.\\!\\?]|\n\n|\r\r|\r\n\r\n|$)"+ // Required end of sentence or paragraph
						"[ \r\n\t]*"+
					")+","gi"
				),
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: new RegExp(
					// any help?
					"(?:^| +)(?:"+
						"(?:" + CONTENT_FREE_WORDS + BETWEEN_WORDS + ")*"+
						"(?:any|some)\\s"+ANSWER_WORDS.source+
						"(?:" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*"+
						"(?: *\\?)+"+ // Required ending question mark
						"(?: +|$)"+
					")+","gmi"
				),
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: new RegExp(
					"(?:^| +)(?:"+
						"(?:" + CONTENT_FREE_WORDS + BETWEEN_WORDS + ")*(?:(?:"+[
							// thanks ... answer
							"(?:thanks|(?:thank[ \\-]+you)|hoping|look|looking|someone|somebody|please|kindly|appreciate|need|seek|seeking)(" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*" + BETWEEN_WORDS + ANSWER_WORDS.source,
							// hope ... helps
							"(?:hope|hopefully)(" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*" + BETWEEN_WORDS + "(?:helps?|helped|fix|fixes|useful)",
							// thanks ... advance
							"(?:thanks|(?:thank[ \\-]+you))(" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*" + BETWEEN_WORDS + "(?:advance)",
							// answer ... please
							ANSWER_WORDS.source+"(" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*" + BETWEEN_WORDS + "(?:appreciated|good|great|please)",
						].join(")|(?:")+"))"+
						"(?:" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*"+
						"(?: *[\\:\\.\\!\\,\\?])*"+ // Optional end of a phrase or sentence
						"(?: +|$)"+
					")+","gmi"
				),
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: new RegExp(
					"(?:^|(?<=[\\:\\.\\!\\?\\n] *))(?:"+ // end of previous phrase or sentence
						"(?:" + CONTENT_FREE_WORDS + BETWEEN_WORDS + ")*(?:"+
							"(?:help|please|thanks|(?:thank[ \\-]+you))" +
						")(?:" + BETWEEN_WORDS + CONTENT_FREE_WORDS + ")*"+
						"(?: *(?:[\\:\\.\\!\\?\\n]|$)) *"+ // end of a phrase or sentence
					")+","gmi"
				),
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: /(?:^|[ \t]+)(?:my\s+first\s+question)\s*[\.\!\,\?]?(?:[ \t]+|$)/gmi,
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: /(?:(?:^|[ \t]+)(?:greetings|cheers|hi|hello|regards|good\s(?:evening|morning|day|afternoon))(?:\s+(?:guys|folks|everybody|everyone|all))?\s*[\.\!\,]?)+(?:[ \t]+|$)/gmi,
				replacement: removeLeaveSpace,
				reason: "remove niceties",
				score: .5
			},{
				expr: /(?<=^|[\.\!\?\:])[ \t]*(?:(?:\**)(edit|edited|updated?)[ \t]*[0-9]*:?(?:[\*\:]+)[ \t]*)+/gmi,
				replacement: "",
				reason: "remove edit indicator",
				score: .5
			},{
				// No lower case at all
				expr: /^((?=.*[A-Z])[^a-z]*)$/g,
				replacement: ($0,$1) => $1[0] + $1.substring(1).toLowerCase(),
				reason: "capitalization",
				context: ["title"],
				score: .5,
				rounds: "0"
			},{
				expr: /\[enter image description here\]/g,
				replacement: "[]",
				reason: "formatting",
				score: .1
			},{
				// Capitalize first letter
				expr: /^[a-z]+\s/gm,
				replacement: $0 => $0[0].toUpperCase()+$0.substring(1),
				reason: "capitalization",
				context: ["title"],
				score: .1,
				rounds: "0"
			},{
				expr: new RegExp(
					PRE_CODE_FORMAT.source +
					'(' +
						'(?:' +
							'(?:' +
								'(?:' +
									'(?:https?:\\/\\/)?'+ // Optional protocol
									USER_OPT.source +
									'(?:'+
										// example.tld style domains
										'(?:'+SUBDOM.source+'example'+TLD.source +')|'+
										// some.example style domains
										'(?:'+SUBDOM.source+'[a-zA-Z0-9\\-]+\\.(?:example|localhost|invalid|test))|' +
										// IPV6 IP addresses
										/(?:(?:(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4})|(?:[A-Fa-f0-9]{0,4}::[A-Fa-f0-9]{1,4}(?::[A-Fa-f0-9]{1,4}){0,6}))/.source + '|' +
										// IPV4 IP addresses
										/(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3})/.source +
									')'+
								')|(?:' +
									// domains without TLD (like localhost) formatted in URL
									'(?:https?:\\/\\/)' + // Required protocol
									USER_OPT.source +
									'[a-zA-Z0-9]+' + // Host name with no dots
								')' +
							')' +
							PORT_OPT.source +
							REST_OF_URL.source +
						')|(?:' +
							// domains without TLD (like localhost) with port number
							USER_OPT.source +
							'(?:[a-zA-Z0-9\-]*[a-zA-Z]+[a-zA-Z0-9\-]*\\:[0-9]+)' +
							REST_OF_URL.source +
						')|(?:' +
							// email addresses
							'[a-zA-Z0-9\\-_]+\\@(?:[a-zA-Z0-9\\-]+\\.)*[a-zA-Z]+' +
						')' +
					')'+
					DATA.POST_CODE_FORMAT.source
				,'gmi'),
				replacement: applyCodeFormat,
				reason: "code format example URL",
				context: ["text","url"],
				score: .2
			},{
				expr: new RegExp(
					PRE_CODE_FORMAT.source +
					'(' +
						'(?:' +
							// File name with common file extension
							'[a-zA-Z0-9\\._\\-\\/\\~\\\\]*'+
							// Extension list from https://fileinfo.com/filetypes/common
							// and https://gist.github.com/ppisarczyk/43962d06686722d26d176fad46879d41
							'\\.(?:'+DATA.fileExtensions.trim().replace(/\n/g,"|")+')'+
						')|(?:'+
							// Directory ending in slash (or backslash)
							'[a-zA-Z0-9\\._\\-\\~]*[\\/\\\\](?:[a-zA-Z0-9\\._\\-\\~]+[\\/\\\\])+'+
						')|(?:'+
							// Directory starting in slash
							'(?:\\/[a-zA-Z0-9\\._\\-\\~]+){2,}'+
						')|(?:'+
							// Windows file starting with drive letter
							'(?:[A-Z]\\:\\\\)[a-zA-Z0-9\\._\\-\\~\\\\]+'+
						')' +
					')' +
					DATA.POST_CODE_FORMAT.source
				,"gmi"),
				replacement: applyCodeFormat,
				reason: "code format file name",
				context: ["text"],
				score: .2
			},{
				// Remove trailing white space
				expr: /[ \t]+(\r\n|\n|$)/gm,
				replacement: "$1",
				reason: "formatting",
				context: ["title"],
				score: .01
			},{
				// Remove multiple new lines
				expr: /(?:\r|\n|\r\n){3,}/gm,
				replacement: "\n\n",
				reason: "formatting",
				context: ["fullbody"],
				score: .01
			}
		])
	}
	waitForData()

	function applyCodeFormat (m,prefix,start,url,suffix){
		start=start||''
		suffix=suffix||''
		var code='`'
		if ((m = url.search(/[_\*\"\'\`\;\,\.\?\:\!\)\>]+$/)) != -1){
			suffix = url.substr(m) + suffix
			url = url.substr(0,m)
		}
		if (start && (((/[\_\*\"\']+/.test(start) && suffix.startsWith(start)) || (start == "<" && suffix.startsWith(">"))))){
			suffix=suffix.substr(start.length)
			start = ""
		} else if (url.length<=4 && !url.match(/::/)){
			code=""
		} else if (url.match(/^node\.js$/i)){
			code=""
		}
		return prefix+start+code+url+code+suffix
	}

	function normalizeDomain(d){
		return d.replace(/\\/g,"").toLowerCase()
	}

	function spellingReason(i, o){
		i = i.toLowerCase()
		o = o.toLowerCase()
		if (o == i){
			return "capitalization"
		} else if (o.replace(/[^a-zA-Z0-9]/g,"") == i.replace(/[^a-zA-Z0-9]/g,"")){
			return "grammar"
		}
		return "spelling"
	}
	function spellingScore(r, i, o){
		switch (r){
			case "capitalization": return 0.3
			case "grammar": return 0.5
		}
		return 1
	}

	function removeLeaveSpace(s){
		var start = "", end=""
		if (/^[\.\!\?]/.test(s)){
			start = s[0]
			s = s.substr(1)
		}
		if(/^(?:\r\r|\n\n|\r\n\r\n)(\s|\S)*[ \t\r\n]$/.test(s)) end="\n\n"
		else if(/^[ \t\r\n](\s|\S)*(?:\r\r|\n\n|\r\n\r\n)$/.test(s)) end="\n\n"
		else if(/^[\r\n](\s|\S)*[ \t\r\n]$/.test(s)) end="\n"
		else if(/^[ \t\r\n](\s|\S)*(?:\r|\n|\r\n)$/.test(s)) end="\n"
		else if(/^[ \t\r\n](\s|\S)*[ \t\r\n]$/.test(s)) end=" "
		return start+end
	}

	// Create a rule for converting the given word into its exact given case.
	// The regex parameter is optional, if none is given, it is auto-created from the word
	// The auto created regex inserts white space for camel case words, a custom regex
	// should be created if other white space removal desired
	function capitalizeWord(word, re){
		if (!re) re = word
		re = re.replace(/[ \-]+/g, "[\\s\\-]*")
		re = re.replace(/([A-Z][a-z]+)([A-Z])/g, "$1\\s*$2")
		return {
			expr: new RegExp("((?:^|\\s)\\(?)(?:"+re+")"+DATA.POST_CODE_FORMAT.source,"igm"),
			replacement: "$1"+word+"$2",
			reason: spellingReason,
			score: .1
		}
	}

	// Create a rule for word capitalization same as above, but followed by
	// a numeric version. The separator can be used to Specify whether or
	// not a space in included in the output: FooBar8 vs FooBar 8
	function capitalizeWordAndVersion(word, re, separator){
		if (!separator) separator = ""
		if (!re) re = word
		re = re.replace(/ /g, "\\s*")
		re = re.replace(/([A-Z][a-z]+)([A-Z])/g, "$1\\s*$2")
		return {
			expr: new RegExp("((?:^|\\s)\\(?)(?:"+re+")"+(separator==" "?"\\s*":"")+"([0-9]+)"+DATA.POST_CODE_FORMAT.source,"igm"),
			replacement: "$1"+word+separator+"$2$3",
			reason: spellingReason,
			score: .1
		}
	}
	function tokenizeMarkdown(str){
		var tokens=[], m,
		startRx = new RegExp("(" + [
			/^ {0,3}([\~]{3,}|[\`]{3,})/, // start of code fence (group 1 and 2)
			/\<(?:[^\>\r\n]+)[\>\r\n]/, // HTML tag (group 3)
			/^(?: {0,3}>)*(?: {4}|\t)/, // start of indented code (group 4)
			/`/, // start of single backtick code (group 5)
			/\]\([^\)\r\n]+\)/, // link (group 6)
			/^ {0,3}\[[^ \t\r\n]+\]\:\s[^\r\n]*/, // footnote link (group 7)
			/(?:_+|\*+|[\'\"\(])?https?\:\/\/[^ \t\r\n]*/ // URL (group 8)
		].map(r=>r.source).join(')|(') + ")","gim"),
		codeRx = new RegExp("((?:" + [
			/(?: {0,3}>)*(?: {4}|\t).*(?:[\r\n]+(?: {0,3}>)*(?: {4}|\t).*)*/, // indented block
			/`[^`\r\n]*`/, // single back ticks
			/<\s*pre(?:\s[^>]*)?>[\s\S]*?<\s*\/\s*pre\s*>/, // HTML pre tags
			/<\s*code(?:\s[^>]*)?>[\s\S]*?<\s*\/\s*code\s*>/, // HTML code tags
		].map(r=>r.source).join(')|(?:') + "))","gi"),
		lastEnd=0
		while(m = (startRx.exec(str))){
			var thisStart=m.index
			if (m.index-lastEnd>0){
				tokens.push({type:"text",content:str.slice(lastEnd,m.index)})
				lastEnd=m.index
			}
			if (m[1]){
				// code fence
				var fence = m[2],
				endRx = new RegExp("^ {0,3}"+fence,"gm")
				endRx.lastIndex = lastEnd+fence.length
				if (m=(endRx.exec(str))){
					var end = m.index+fence.length
					tokens.push({type:"code",content:str.slice(lastEnd,end)})
					lastEnd=end
				} else {
					tokens.push({type:"code",content:str.substr(lastEnd)})
					return tokens
				}
			} else if (m[3] || m[4] || m[5]){
				// html tag OR indented code OR single backtick code
				codeRx.lastIndex = lastEnd
				var codeM=codeRx.exec(str)
				if (codeM && codeM.index == lastEnd){
					tokens.push({type:"code",content:codeM[1]})
					lastEnd+=codeM[1].length
				} else if (m[3]) {
					// Other HTML tags
					type = "html"
					// Unless it is a URL
					if (/^\<https?\:\/\//.test(m[3])) type = "url"
					tokens.push({type:type,content:m[3]})
					lastEnd+=m[3].length
				} else {
					tokens.push({type:"error",content:str.substr(lastEnd)})
					return tokens
				}
			} else if (m[6] || m[7]){
				var link = m[6] || m[7]
				tokens.push({type:"link",content:link})
				lastEnd+=link.length
			} else if (m[8]){
				tokens.push({type:"url",content:m[8]})
				lastEnd+=m[8].length
			} else {
				tokens.push({type:"error",content:str.substr(lastEnd)})
				return tokens
			}
			startRx.lastIndex=lastEnd
		}
		if (lastEnd<str.length)tokens.push({type:"text",content:str.substr(lastEnd,str.length)})
		return tokens
	}

	function getDefaultData(){
		return {
			editCount:0, reasons:[], replacements:[], score:0
		}
	}

	function getReason(rule, i, o){
		if (typeof rule.reason === 'function') return rule.reason(i,o)
		return rule.reason
	}

	function getScore(rule, r, i, o){
		switch (typeof(rule.score)){
			case "undefined": return 1
			case 'function': return rule.score(r,i,o)
		}
		return rule.score
	}

	function applyRules(d, input, type, round){
		rules.forEach(rule=>{
			var context = rule.context || ["title","text"]
			var inRound = typeof rule.rounds == 'undefined' || rule.rounds.includes(''+round)
			if (context.includes(type) && inRound){
				var ruleEditCount = 0,
				output = input
				if (rule.edit){
					var o = rule.edit(input)
					output = o[0]
					for (var i=0; i<o[1].length; i++){
						o[1][i].r = getReason(rule, o[1][i].i, o[1][i].o)
						d.reasons.push(o[1][i].r)
						d.replacements.push(o[1][i])
						o[1][i].s=getScore(rule, o[1][i].r, o[1][i].i, o[1][i].o)
						d.score+=o[1][i].s
					}
				} else {
					for(let m of input.matchAll(rule.expr)){
						var a = m[0]
						var b = a.replace(rule.expr, rule.replacement)
						if (a != b){
							var rep = {i:a,o:b,r:getReason(rule,a,b)}
							rep.s=getScore(rule,rep.r,a,b)
							d.replacements.push(rep)
							d.reasons.push(rep.r)
							ruleEditCount++
							d.score+=rep.s
						}
					}
					output = input.replace(rule.expr, rule.replacement)
				}
				if (output != input){
					d.editCount+=ruleEditCount
					input = output
				}
			}
		})
		return input
	}

	function recordExampleDomainsInput(d,input){
		if (!input) return;
		var domains = input.match(DATA.DOMAIN_NAME)
		for (var i=0; domains && i<domains.length; i++){
			var m = DATA.EXAMPLE_DOMAIN.exec(domains[i])
			if (m){
				var name=normalizeDomain(m[2]), tld=normalizeDomain(m[3]),domain=name+tld
				if (!(domain in d.exampleDomains)){
					d.exampleDomains[domain] = 1
					if (!(tld in d.exampleDomains)) d.exampleDomains[tld]=0
					d.exampleDomains[tld]++
				}
			}
		}
	}

	function recordExampleDomains(d){
		for (var i=0; i<d.bodyTokens.length; i++){
			if (/^(?:text|code|url)$/.test(d.bodyTokens[i].type)){
				recordExampleDomainsInput(d,d.bodyTokens[i].content)
			}
		}
		if (d.title) recordExampleDomainsInput(d, d.title)
	}

	var context

	function edit(d){
		context = d
		d.exampleDomains = {}
		var tries = 0
		do {
			var editsMade = d.replacements.length

			if (d.body){
				d.body = applyRules(d, d.body, "fullbody", tries)
				d.bodyTokens = tokenizeMarkdown(d.body)
			}
			if (!Object.keys(d.exampleDomains).length) recordExampleDomains(d)
			for (var i=0; i<d.bodyTokens.length; i++){
				d.bodyTokens[i].content = applyRules(d, d.bodyTokens[i].content, d.bodyTokens[i].type, tries)
			}
			if (d.body){
				d.body = d.bodyTokens.map(t=>t.content).join("")
			}

			if (d.title) d.title = applyRules(d, d.title, "title", tries)

			editsMade = d.replacements.length - editsMade
			tries++
			if (tries>=9){
				d.error="Ten rounds of edits"
				throw d
			}
		} while(editsMade>0)
		return d
	}

	function buildSummary(summary, reasons){
		var used={}
		summary.split(/, */).map(i=>{if(i)used[i]=1})
		for (var i=0; i<reasons.length; i++){
			// If this reason not already added, and overall summary not getting too long
			if (!used.hasOwnProperty(reasons[i]) && summary.length < 200) {
				summary += (summary.length==0?"":", ") + reasons[i]
				used[reasons[i]]=1
			}
		}
		return summary
	}

	function ui(){
		// Access to jQuery via dollar sign variable
		var $ = unsafeWindow.jQuery

		GM_addStyle(`
			.autoEditorButton{margin-left:0.5em;background:url("//i.imgur.com/79qYzkQ.png") center / contain no-repeat}
			.autoEditorButton:hover{background-image:url("//i.imgur.com/d5ZL09o.png")}
			button.autoEditorButton{width:2em;height:2em}
			.autoEditorInfo{height:100%;width:100%;left:0;top:0;position:fixed;background:#000A;z-index:99999;padding:1em}
			.autoEditorInfo .content{max-height:100%;max-width:1000px;margin:0 auto;overflow:auto;background:var(--white);padding:.5em}
			.autoEditorInfo *+h1{margin-top: 1em}
			.autoEditorInfo table{border-spacing.5em;margin-bottom:2em;}
			.autoEditorInfo th{font-weight:bold}
			.autoEditorInfo button.close{float:right}
			.autoEditorInfo th,.autoEditorInfo td{border:1px solid black;padding:0.5em}
			.autoEditorInfo td:not(:last-child){font-family:monospace;white-space:pre-wrap}
			.autoEditorInfo .diff{font-family:monospace;white-space:pre-wrap;margin-bottom:2em;max-width:600px}
			.autoEditorInfo ins{background:#cfc}
			.autoEditorInfo del{background:#fcc}
			.autoEditorInfo .editsMade{position:relative}
			.autoEditorInfo .ws::after{content:"∙";position:absolute;transform:translate(-8px, 0px);color:var(--yellow-400)}
			.autoEditorInfo .wn::before{content:"↲";position:absolute;color:var(--yellow-400)}
			.autoEditorInfo .wt::after{content:"→";position:absolute;transform:translate(-22px, 0px);color:var(--yellow-400)}
		`)

		//Preload icon alt
		new Image().src = '//i.imgur.com/79qYzkQ.png'
		new Image().src = '//i.imgur.com/d5ZL09o.png'

		$('body').keyup(e=>{
			if(e.key=="Escape"){
				var tki = $('.autoEditorInfo')
				if (tki.length){
					tki.remove()
					e.preventDefault()
					return false
				}
			}
			if(e.key=="e" && e.ctrlKey){
				var button = $(e.target).closest('.wmd-container').find('.autoEditorButton')
				if (button.length){
					e.preventDefault()
					button.trigger('click')
					return false
				}
			}
		})

		function cssColorVar(v){
			// get var then convert from hsv to rgb because passing hsv string to animate doesn't work
			return $('<div>').css("color",window.getComputedStyle(document.body).getPropertyValue(v))[0].style.color;
		}

		function addClick(button,d){
			return button.click(function(e){
				e.preventDefault()
				if (d.lastrun){
					// Second time button clicked, show a report
					if($('.autoEditorInfo').length) return // already open
					var info = $('<div class=content>').append($("<button class=close>Close</button>").click(()=>info.parent().remove())), table
					d.info=info
					if(d.getBody() != d.lastrun.body || d.getTitle() != d.lastrun.title){
						info.append("<h1>Manual edits detected</h1>").append($("<button>Re-run auto-edits</button>").click(()=>replaceFromUi(d)))
					}
					if (!d.replacements.length){
						info.append($("<h1>No auto-edits</h1>"))
					} else {
						info.append($("<h1>Auto-edits</h1>"))
						table = $("<table class=editsMade>").append($("<tr><th>Found</th><th>Replaced</th><th>Reason</th></tr>"))
						$.each(d.replacements, (x,r)=>{
							if (r.i.search(/^[ \t]+/)!=-1 && r.o.search(/^[ \t]+/)!=-1){
								r.i=r.i.replace(/^[ \t]+/,"")
								r.o=r.o.replace(/^[ \t]+/,"")
							}
							table.append($("<tr>").append($("<td>").html(visibleSpace(r.i))).append($("<td>").html(visibleSpace(r.o))).append($("<td>").html(r.r)))
						})
						info.append(table)
					}
					d.diffsfrom=$("<select class=diffsfrom><option value=initial>Before all edits</option><option selected value=before>Before last auto-edit</option></select>").on("change",(()=>doDiffs(d)))
					d.diffsto=$("<select class=diffsto><option value=lastrun>After last auto-edit</option><option value=now>Now</option></select>").on("change",(()=>doDiffs(d)))
					info.append($("<h1>Diffs from </h1>").append(d.diffsfrom).append(" to ").append(d.diffsto))
					info.append(d.diffs = $("<div class=diff>"))
					doDiffs(d)
					$('body').prepend($('<div class=autoEditorInfo>').append(info).click(e=>{
						if($(e.target).is('.autoEditorInfo')){
							e.preventDefault()
							$(e.target).remove()
							return false
						}
					}))
				} else {
					// First time button clicked, do all the replacements
					replaceFromUi(d)
				}
				return false
			})
		}

		function doDiffs(d){
			recordText(d, "now")
			var diffsfrom=d.diffsfrom.val(),
			diffsto=d.diffsto.val()
			try {
				var title = ""
				if(d[diffsfrom].title) title += "<h1>" + diff2html(d[diffsfrom].title, d[diffsto].title) + "</h1>"
				d.diffs.html(title + diff2html(d[diffsfrom].body, d[diffsto].body))
			} catch (x){
				d.diffs.html("")
				d.diffs.append($("<pre>").text("Diffs failed to render\n" + x.toString() + "\n\n" + x.stack))
			}
		}

		function replaceFromUi(d){
			if (d.info) d.info.parent().remove()
			recordText(d, "before")
			d.body = d.before.body
			d.title = d.before.title
			edit(d)
			// Flash red or green depending on whether edits were made
			d.flashMe.animate({backgroundColor:d.editCount==0?cssColorVar('--red-100'):cssColorVar('--green-100')},10)
			// Then back to white
			d.flashMe.animate({backgroundColor:cssColorVar('--white')})
			// Update values in UI
			d.setTitle(d.title)
			d.setBody(d.body)
			d.setSummary(buildSummary(d.getSummary(),d.reasons))
			recordText(d,"lastrun")

		}

		function needsButton(editor){
			if (!$(editor).is(':visible')) return false // not showing up
			if ($(editor).find('.autoEditorButton').length > 0) return false // Already has editor
			return true
		}

		function recordText(d,name){
			d[name]={
				title: d.getTitle(),
				body: d.getBody()
			}
		}

		// Continually monitor for newly created editing widgets
		setInterval(()=>{
			$('.wmd-button-bar').each(function(){
				if (needsButton(this)){
					var d = getDefaultData(),
					editContainer = $(this).parents('.inline-editor, .post-form, .post-editor, .js-review-editor').last(),
					bodyBox = editContainer.find('.js-post-body-field'),
					summaryBox = editContainer.find('.js-post-edit-comment-field'),
					titleBox = editContainer.find('.js-post-title-field')
					d.getTitle = function(){
						return titleBox.length?titleBox.val():''
					}
					d.setTitle = function(s){
						if (!titleBox.length) return
						titleBox.val(s)
						titleBox[0].dispatchEvent(new Event('keyup')) // Cause title display to be updated
					}
					d.getBody = function(){
						return bodyBox.val()
					}
					d.setBody = function(s){
						bodyBox.val(s)
						bodyBox[0].dispatchEvent(new Event('keypress')) // Cause markdown re-parse
					}
					d.flashMe = bodyBox
					d.getSummary = function(){
						return summaryBox.val()
					}
					d.setSummary = function(s){
						summaryBox.val(s)
					}
					editContainer.find('.wmd-spacer').last().before($('<li class=wmd-spacer>')).before(addClick($('<li class="wmd-button autoEditorButton" title="Auto edit Ctrl+E">'),d))
					recordText(d,"initial")
				}
			})
			$('.js-stacks-editor-container').each(function(){
				if (needsButton(this)){
					var d = getDefaultData(),
					editContainer = $(this).parents('.inline-editor, .post-form, .post-editor, .js-review-editor').last(),
					editArea = editContainer.find('.js-post-body-field'),
					summaryBox = editContainer.find('.js-post-edit-comment-field')
					d.getTitle = function(){
						return "" // This style editor only used for answers, so never a title
					}
					d.setTitle = function(s){} // no-op
					d.getBody = function(){
						return editArea.val()
					}
					d.setBody = function(s){
						editArea.val(s)
					}
					d.flashMe = editContainer.find('.js-editor')
					d.getSummary = function(){
						return summaryBox.val()
					}
					d.setSummary = function(s){
						summaryBox.val(s)
					}
					editContainer.find('.js-editor-btn').last().before(addClick(
						$('<button class="autoEditorButton s-editor-btn js-editor-btn" title="Auto edit Ctrl+E">'),d
					)).before(($('<div class="flex--item w16 is-disabled" data-key=spacer>')))
					recordText(d,"initial")
				}
			})
			$('.js-edit-comment-form, .comment-form').each(function(){
				if (needsButton(this)){
					var d = getDefaultData(),
					postEditor = $(this),
					editArea = postEditor.find('textarea')
					d.getTitle = function(){
						return "" // This style editor only used for comments, so never a title
					}
					d.setTitle = function(s){} // no-op
					d.getBody = function(){
						return editArea.val()
					}
					d.setBody = function(s){
						editArea.val(s)
					}
					d.flashMe = editArea
					d.getSummary = function(){
						return ""
					}
					d.setSummary = function(){} // no-op, no summary for comment edits
					$(this).find('.form-error').before(addClick(
						$('<button class="autoEditorButton s-editor-btn js-editor-btn" title="Auto edit">'),d
					))
					recordText(d,"initial")
				}
			})
		},200)

		function visibleSpace(s){
			s=escHtml(s)
			s=s.replace(/( )/g,"<span class=ws>$1</span>")
			s=s.replace(/(\r)/g,"<span class=wr>$1</span>")
			s=s.replace(/(\n)/g,"<span class=wn>$1</span>")
			s=s.replace(/(\t)/g,"<span class=wt>$1</span>")
			return s
		}
	}

	function escHtml(s) {
		return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
	}

	/*
	 * Javascript Diff Algorithm
	 *	By John Resig (http://ejohn.org/)
	 *	Modified by Chu Alan "sprite"
	 *
	 * Released under the MIT license.
	 *
	 * More Info:
	 *	http://ejohn.org/projects/javascript-diff-algorithm/
	 */
	function diff2html(o, n){
		function diff(o, n){
			var ns = {}, os = {}, i

			for (i = 0; i < n.length; i++){
				if (ns[n[i]] == null) ns[n[i]] = {rows:[], o: null}
				ns[n[i]].rows.push(i)
			}

			for (i = 0; i < o.length; i++){
				if (os[o[i]] == null) os[o[i]] = {rows:[], n: null}
				os[o[i]].rows.push(i)
			}

			for (i in ns){
				if (ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1){
					n[ns[i].rows[0]] = {text: n[ns[i].rows[0]], row: os[i].rows[0]}
					o[os[i].rows[0]] = {text: o[os[i].rows[0]], row: ns[i].rows[0]}
				}
			}

			for (i = 0; i < n.length - 1; i++){
				if (n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[n[i].row + 1].text == null && n[i+1] == o[n[i].row + 1]){
					n[i+1] = {text: n[i+1], row: n[i].row + 1}
					o[n[i].row+1] = {text: o[n[i].row+1], row: i + 1}
				}
			}

			for (i = n.length - 1; i > 0; i--){
				if (n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[n[i].row - 1].text == null &&	 n[i-1] == o[n[i].row - 1]){
					n[i-1] = {text: n[i-1], row: n[i].row - 1}
					o[n[i].row-1] = {text: o[n[i].row-1], row: i - 1}
				}
			}

			return {o: o, n: n}
		}

		o = o.replace(/\s+$/, '')
		n = n.replace(/\s+$/, '')

		var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/)),
		str = "", i,
		oSpace = o.match(/\s+/g) || [],
		nSpace = n.match(/\s+/g) || []
		oSpace.push("\n")
		nSpace.push("\n")

		if (out.n.length == 0){
			for (i = 0; i < out.o.length; i++){
				str += '<del>' + escHtml(out.o[i]) + oSpace[i] + "</del>"
			}
		} else {
			if (out.n[0].text == null){
				for (n = 0; n < out.o.length && out.o[n].text == null; n++){
					str += '<del>' + escHtml(out.o[n]) + oSpace[n] + "</del>"
				}
			}

			for (i = 0; i < out.n.length; i++){
				if (out.n[i].text == null){
					str += '<ins>' + escHtml(out.n[i]) + nSpace[i] + "</ins>"
				} else {
					var pre = ""

					for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++){
						pre += '<del>' + escHtml(out.o[n]) + oSpace[n] + "</del>"
					}
					str += " " + escHtml(out.n[i].text) + nSpace[i] + pre
				}
			}
		}
		return str
	}

	function main(){
		/*eslint-env node*/
		process.argv.shift()
		process.argv.shift()
		var command = process.argv.shift() || "test"
		eval(require('fs').readFileSync(command+'.js')+'')
	}

	function getEnvironment(){
		if (typeof unsafeWindow !== 'undefined'){
			// Running as user script
			return {
				run: ui,
				file: (name,cb)=>{
					var data = GM_getValue(name)
					if (data && data.version == GM_info.script.version) return cb(data.content)
					GM_xmlhttpRequest({
						method: "GET",
						url: "https://raw.githubusercontent.com/AstroCB/Stack-Exchange-Editor-Toolkit/master/" + name,
						onload: function(r){
							GM_setValue(name, {version:GM_info.script.version,content:r.responseText})
							cb(r.responseText)
						},
						onerror: function(){
							alert("Auto Editor could not load " + name)
						}
					})
				}
			}
		}
		if (typeof process !== 'undefined'){
			// Running from node command line
			return {
				run: main,
				file: (name,cb)=>{cb(require('fs').readFileSync(name, 'utf-8'))}
			}
		}
		throw("Unknown environment")
	}

	ENVIRONMENT.run()
})()
