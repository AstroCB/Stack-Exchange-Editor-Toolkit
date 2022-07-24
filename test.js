// To run:
// node editor.user.js test

var results = runTests()
console.log(results)
process.exit(results.failures.length)

function runTests() {
	var td = {failures:[],count:0,passed:0}

	function expectEql(method, actual, expected, input, debug){
		td.count++
		if (actual != expected){
			td.failures.push({method:method,actual:actual,expected:expected,input:input,debug:JSON.stringify(debug)})
		} else {
			td.passed++
		}
	}

	function expectNotEql(method, actual, expected, input, debug){
		td.count++
		if (actual == expected){
			td.failures.push({method:method,actual:actual,expected:"!"+expected,input:input,debug:JSON.stringify(debug)})
		} else {
			td.passed++
		}
	}

	function testEdit(input, output, titleOutput){
		if (!titleOutput) titleOutput = output
		var d=getDefaultData(),
		testTitle = !/[\r\n`\*\%]| {4}|~~~/.test(input) // No title tests multi-line or markdown
		if (testTitle) d.title=input
		d.body=input
		edit(d)
		expectEql("error in tokenizeMarkdown", d.bodyTokens.map(o=>o.type=='error'?'error':'').join(''), '', input, d.bodyTokens)
		if (testTitle) expectEql("editTitle", d.title, titleOutput, input, d)
		expectEql("editBody", d.body, output, input, d)
	}

	[
		{i:'    fooexample.org, barexample.org',o:'    foo.example, bar.example'},
		{i:'    server example-stuff.org;\n    more-example-stuff.org',o:'    server stuff.example;\n    more-stuff.example'},
		{i:'127.0.0.1',o:'`127.0.0.1`',t:'127.0.0.1'},
		{i:'1:2:3abc:4de:5f:6:7:8',o:'`1:2:3abc:4de:5f:6:7:8`',t:'1:2:3abc:4de:5f:6:7:8'},
		{i:'1::2',o:'`1::2`',t:'1::2'},
		{i:'::1',o:'`::1`',t:'::1'},
		{i:'**Edit:** Lorum ipsum.',o:'Lorum ipsum.'},
		{i:'Double!  Space?  After:  Any.  Punctuation.',o:"Double! Space? After: Any. Punctuation."},
		{i:'Edit: Lorum ipsum.',o:'Lorum ipsum.'},
		{i:'Lorum git://github.com/foo/bar.git ipsum.',o:'Lorum git://github.com/foo/bar.git ipsum.'},
		{i:'Lorum https : / / stackexchange.com ipsum',o:'Lorum https://stackexchange.com ipsum'},
		{i:'Missing,space,after,comma',o:"Missing, space, after, comma"},
		{i:'Multiple\n\n\nblank\n\n\n\nlines\n\n    even\n\n\n    in\n\n\n\n    code',o:"Multiple\n\nblank\n\nlines\n\n    even\n\n    in\n\n    code"},	{i:'\r\n\n\nStarts with\nnew lines.',o:"Starts with\nnew lines."},
		{i:'NO, NEED, TO+ YELL!',o:'NO, NEED, TO+ YELL!',t:'No, need, to+ yell!'},
		{i:'Trailing \nwhite\t\nspace \t',o:'Trailing \nwhite\t\nspace \t',t:"Trailing\nwhite\nspace"},
		{i:'Trailing white space\t \t',o:"Trailing white space\t \t",t:"Trailing white space"},
		{i:'Vaccuum: beatiful, tomatos! tommorow?',o:'Vacuum: beautiful, tomatoes! tomorrow?'},
		{i:'Visit site.tld',o:'Visit `example.tld`',t:'Visit example.tld'},
		{i:'What ?',o:"What?"},
		{i:'Wierd surprize marshmellow.',o:'Weird surprise marshmallow.'},
		{i:'`foo.org$ examplesite.org`',o:'`foo.example$ site.example`'},
		{i:"`sub\\.other-web\\.app`",o:"`sub\\.example\\.app`"},
		{i:"`1sthack\\.com\\.fr`",o:"`example\\.com\\.fr`"},
		{i:'*.abc.online',o:'`*.example.online`'},
		{i:'%.xxxxx.biz',o:'`%.example.biz`'},
		{i:'`ourHome.net: ourHost.net`',o:'`ourHome.example: ourHost.example`'},
		{i:'`sub.another-example.com.au lorum sub.pages.com.au`',o:'`sub.another.example lorum sub.pages.example`'},
		{i:'`some-example-domain.edu, foo.edu`',o:'`some-domain.example, foo.example`'},
		{i:'`example.co.uk, sub.example2.co.uk`',o:'`example.co.uk, sub.2.example`'},
		{i:'`example.za - sub.someexample1.za`',o:'`example.za - sub.some1.example`'},
		{i:'`bardev.tech sub.sslhack.tech`',o:'`bardev.example sub.sslhack.example`'},
		{i:'`www.website1.net`',o:'`www.example.net`'},
		{i:'`www.webpageA.net`',o:'`www.example.net`'},
		{i:'Lorum ```code``` ipsum',o:'Lorum `code` ipsum'},
		{i:'`my-domain.com:8080`',o:'`example.com:8080`'},
		{i:'On domain-a.com, domain-b.com, and domain-c.com',o:'On `domain-a.example`, `domain-b.example`, and `domain-c.example`',t:'On domain-a.example, domain-b.example, and domain-c.example'},
		{i:'(Found on some-x.com)',o:'(Found on `example.com`)',t:'(Found on example.com)'},
		{i:'`*.site1.jp`',o:'`*.example.jp`'},
		{i:'`site99.ru$path`',o:'`example.ru$path`'},
		{i:'"http://www.testx.net"',o:'`http://www.example.net`',t:'"http://www.example.net"'},
		{i:'*some.client-of-mine.org*',o:'`some.example.org`'},
		{i:'**https://evilcompany.co.pl/path**',o:'`https://example.co.pl/path`'},
		{i:'**https://fourthproxy.kr/path**,',o:'`https://example.kr/path`,'},
		{i:'**https://good-guys.ph/path**.',o:'`https://example.ph/path`.'},
		{i:'**https://yourstuff.com.ir/path**?',o:'`https://example.com.ir/path`?'},
		{i:'user@my.tld',o:'`user@example.tld`',t:'user@example.tld'},
		{i:'testuser@gmail.com',o:'`testuser@gmail.com`',t:'testuser@gmail.com'},
		{i:'"testuser@gmail.com"',o:'`testuser@gmail.com`',t:'"testuser@gmail.com"'},
		{i:"'testuser@gmail.com'",o:'`testuser@gmail.com`',t:"'testuser@gmail.com'"},
		{i:'**testuser@gmail.com**',o:'`testuser@gmail.com`'},
		{i:'*testuser@gmail.com*',o:'`testuser@gmail.com`'},
		{i:'`http://someco.com/`',o:'`http://example.com/`'},
		{i:'http://example.com?query',o:'`http://example.com?query`',t:'http://example.com?query',},
		{i:"http:// example.com:81/",o:'`http://example.com:81/`',t:"http://example.com:81/"},
		{i:"http://localhost:8080/foo",o:'`http://localhost:8080/foo`',t:"http://localhost:8080/foo"},
		{i:"http://a.test/",o:'`http://a.test/`',t:"http://a.test/"},
		{i:"localhost:8080/foo",o:'`localhost:8080/foo`',t:"localhost:8080/foo"},
		{i:'From admin@goodstore.xyz.',o:'From `admin@example.xyz`.',t:'From admin@example.xyz.'},
		{i:'(https://new.oldplace.tld/path?query)',o:'(`https://new.example.tld/path?query`)',t:'(https://new.example.tld/path?query)'},
		{i:'<http://www.test-domain-1.net> `code`',o:'`http://www.example.net` `code`'},
		{i:'<http://stackoverflow.com/>',o:'<http://stackoverflow.com/>'},
		{i:'first letter upper',o:'first letter upper',t:'First letter upper'},
		{i:'http://mydomain.com/',o:'`http://example.com/`',t:'http://example.com/'},
		{i:'.htaccess',o:'`.htaccess`',t:'.htaccess'},
		{i:'/path/file.txt',o:'`/path/file.txt`',t:'/path/file.txt'},
		{i:'foo.html',o:'`foo.html`',t:'foo.html'},
		{i:'new-test.js',o:'`new-test.js`',t:'new-test.js'},
		{i:'in/a/directory/',o:'`in/a/directory/`',t:'in/a/directory/'},
		{i:'/fully/qualified/directory/',o:'`/fully/qualified/directory/`',t:'/fully/qualified/directory/'},
		{i:'/from/root/directory',o:'`/from/root/directory`',t:'/from/root/directory'},
		{i:'win\\file.exe',o:'`win\\file.exe`',t:'win\\file.exe'},
		{i:'C:\\path\\file.ppk',o:'`C:\\path\\file.ppk`',t:'C:\\path\\file.ppk'},
		{i:'<tag>',o:'`<tag>`',t:'<tag>'},
		{i:'<code>email@domain.com</code>', o:'<code>email@example.com</code>'},
		{i:'Lorum:\n    email@domain.com',o:'Lorum:\n    email@example.com'},
		{i:'Edit:\nLorum',o:'Lorum'},
		{i:'Edit1:\nLorum',o:'Lorum'},
		{i:'Edit:Edit:Edit:Edit:Edit:Edit:Edit:Edit:Edit:Edit:Edit:Edit:\nLorum',o:'Lorum'}
	].forEach(io=>{
		testEdit(io.i, io.o, io.t)
	})

	;[
		// These shouldn't get auto-edited
		"IM",
		"Add",
		"It doesn't have any suggestions.",
		"so",
		'12,345',
		'1:3',
		'90% hit rate',
		'A ... b',
		'Edit',
		'I.E.',
		'i.e.',
		'special thanks to',
		'my-example.tld.sub.sub',
		'So you can for example write:',
		'test invalid localhost example',
		'https://serverfault.com/',
		'`example.com`',
		'`sub.example.com`',
		'`example.co.uk`',
		'`ac.uk`',
		'`co.uk`',
		'https://apple.com',
		'lorum-example.net',
		'this/that/other',
		'`^www\\.example\\.com$`',
		'Node.js',
		'Valid words: so, capital, principal, windows, grate, loose, then, oracle, android',
		'<p><STRONG><br/>',
		'<a>`code`',
		'Java SE'
	].forEach(r=>{
		if (/ {4}/.test(r)){
			testEdit(r, r)
		} else {
			testEdit("Lorum ipsum "+r,"Lorum ipsum "+r)
			testEdit("Lorum "+r+" Ipsum","Lorum "+r+" Ipsum")
		}
	})

	// Not auto-edit, even in title
	;[
		'XML',
		'jQuery'
	].forEach(r=>{
		testEdit(r, r)
	})

	;[
		// Removals
		'Any ideas?',
		'Any suggestions?',
		'Any tips?',
		'Any halp?',
		'Any help to fix this is greatly appreciated.',
		'Any help will be appreciated, thank you in advance.',
		'Any suggestions would be highly appreciated, thank you!',
		'All suggestions below have been greatly appreciated, thanks.',
		'Any help would be much appreciated.',
		"Hope that's useful!",
		'Appreciate for any help!',
		'Assistance is appreciated!',
		'Can anybody give me any suggestions, pls?',
		'can I seek some advice on',
		'Can someone help me to solve this problem?',
		'Could anyone give me some hint towards this problem?',
		'Could you illuminate me with some suggestions/tips please?',
		'Does anybody have any suggestions?',
		'Examples are appreciated.',
		'First post over here and I hope someone will be able to give some advice.',
		'Give me some tips, please - How to solve this little problem?',
		'If anyone could point me in the right direction, that would be much appreciated.',
		'If you have any tips, please let me know.',
		'Hello guys , good afternoon.',
		'Hi all!',
		'Hope it halps!',
		'Hope it helps!',
		'Hope someone can give me some tips',
		'Hope this might help.',
		'Hopefully this helps someone!',
		'I am new to this and I hope someone can help me.',
		'I am hoping for some advice/guidance.',
		'I hope this can help you:',
		'I hope this fixes your issue.',
		'I hope this help your problem.',
		'I need some advice regarding',
		'Many thanks.',
		'May I have some tips please?',
		'Need some advice on',
		'Will you provide any suggestions for me, please?',
		'any suggestions?',
		'hope helped you',
		'please help - any ideas would be amazing - been stuck on trying to fix this thing for a week!',
		'please help me about this code! thank you very much!',
		'please help me understand these concepts.',
		'pls help me i have no idea what is the problem',
		'thank you very much for all your help',
		'thx.',
		'Thx for your help :)',
		'Thanks to everyone.',
		'Thanks works for me, good luck!',
		'ty in advance',
	].forEach(r=>{
		testEdit(r,"")
		testEdit("Lorum ipsum. "+r,"Lorum ipsum.")
		testEdit("Lorum. "+r+" Ipsum.","Lorum. Ipsum.")
		testEdit(r+" Lorum ipsum.","Lorum ipsum.")
	})

	;[
		{i:['ajax'],o:'AJAX'},
		{i:['angularjs','Angularjs','angularJs','angularJS','AngularJs','Angular js', 'Angular JS'],o:'AngularJS'},
		{i:['apache','Apache','APACHE'],o:'Apache'},
		{i:['codeigniter','code igniter','codeignitor','CodeIgnitor','Code Ignitor'],o:'CodeIgniter'},
		{i:['c#'],o:'C#'},
		{i:['c+'],o:'C+'},
		{i:['c++'],o:'C++'},
		{i:['css','Css'],o:'CSS'},
		{i:['dont'],o:'don\'t'},
		{i:['Dont'],o:'Don\'t'},
		{i:['git','GIT'],o:'Git'},
		{i:['github','GITHUB','Github','Git Hub'],o:'GitHub'},
		{i:['google','gOOgle','GOOGLE'],o:'Google'},
		{i:['hdd','HDD','harddisk','HARDDISK'],o:'hard disk'},
		{i:['Hdd','Harddisk','HardDisk'],o:'Hard disk'},
		{i:['html','Html'],o:'HTML'},
		{i:['html5','Html5'],o:'HTML5'},
		{i:['i'],o:'I'},
		{i:["i'd"],o:"I'd"},
		{i:['ios','iOs','ioS','IOS','Ios','IoS'],o:'iOS'},
		{i:['ios8','iOs8','ioS8','IOS8','Ios8','IoS8',"ios 8"],o:'iOS 8'},
		{i:['io','i/o','I/o'],o:'I/O'},
		{i:["i'm","im"],o:"I'm"},
		{i:['java'],o:'Java'},
		{i:['javascript','Java script','java script','Javascript','Java Script'],o:'JavaScript'},
		{i:['jquery','Jquery','JQuery','jQuery'],o:'jQuery'},
		{i:['jsfiddle','Jsfiddle','JsFiddle','JSfiddle','jsFiddle','JS Fiddle','js fiddle'],o:'JSFiddle'},
		{i:['json','Json'],o:'JSON'},
		{i:['linux'],o:'Linux'},
		{i:['mysql','mySql','MySql','mySQL','MYSQL'],o:'MySQL'},
		{i:['node.js','Node.JS'],o:'Node.js'},
		{i:['php','Php'],o:'PHP'},
		{i:['restarant','restaraunt'],o:'restaurant'},
		{i:['server fault','Serverfault','Server fault','ServerFault','serverfault'],o:'Server Fault'},
		{i:['sql','Sql'],o:'SQL'},
		{i:['sqlite','Sqlite'],o:'SQLite'},
		{i:['sqlite3','Sqlite3'],o:'SQLite3'},
		{i:['stack exchange','Stackexchange','Stack exchange','StackExchange','stackexchange'],o:'Stack Exchange'},
		{i:['stack overflow','Stackoverflow','Stack overflow','StackOverflow','stackoverflow'],o:'Stack Overflow'},
		{i:['ubunto','ubunut','ubunutu','ubunu','ubntu','ubutnu','ubantoo','unbuntu','ubunt','ubutu'],o:'Ubuntu'},
		{i:['url','Url'],o:'URL'},
		{i:['urls','Urls',"url's"],o:'URLs'},
		{i:['uri','Uri'],o:'URI'},
		{i:['uris','Uris',"uri's"],o:'URIs'},
		{i:['utf8','Utf-8',"utf-8","UTF8","UTF 8","UTF - 8"],o:'UTF-8'},
		{i:['win 7','WIN 7','windows 7','WINDOWS 7'],o:'Windows 7'},
		{i:['win 95','windows 95','WIN 95','WINDOWS 95'],o:'Windows 95'},
		{i:['win vista','WIN VISTA','windows vista','windows VISTA'],o:'Windows Vista'},
		{i:['win xp','WIN XP','windows xp','windows XP'],o:'Windows XP'},
		{i:['wordpress','Wordpress','word press','Word Press','word-press'],o:'WordPress'},
		{i:["your's"],o:"yours"},
		{i:['youve'],o:"you've"}
	].forEach(io=>{
		io.i.push(io.o)
		io.i.forEach(i=>{
			testEdit('Lorum ' + i + ' ipsum.', 'Lorum ' + io.o + ' ipsum.')
			testEdit('Lorum ipsum ' + i, 'Lorum ipsum ' + io.o)
			testEdit('Lorum ipsum ' + i + '.', 'Lorum ipsum ' + io.o + '.')
			testEdit('Lorum ipsum (' + i + ')', 'Lorum ipsum (' + io.o + ')')
			testEdit('Lorum ipsum (' + i + '.)', 'Lorum ipsum (' + io.o + '.)')
			testEdit('Lorum ipsum (' + i + ').', 'Lorum ipsum (' + io.o + ').')
		})
	})

	;[
		{i:['.htacess','.htacces','.htacess','htaccess','htacess','htacces','htaces','.HTACCESS','HTACCESS'],o:'.htaccess'},
	].forEach(io=>{
		io.i.push(io.o)
		io.i.forEach(i=>{
			testEdit('Lorum ' + i + ' ipsum.', 'Lorum `' + io.o + '` ipsum.', 'Lorum ' + io.o + ' ipsum.')
			testEdit('Lorum ipsum ' + i, 'Lorum ipsum `' + io.o + '`', 'Lorum ipsum ' + io.o)
			testEdit('Lorum ipsum ' + i + '.', 'Lorum ipsum `' + io.o + '`.', 'Lorum ipsum ' + io.o + '.')
		})
	})

	function markdownSizes(tokens){
		return tokens.map(t => t.type+t.content.length).join(",")
	}

	[
		{i:"lorum",o:"text5"},
		{i:"<p>",o:"html3"},
		{i:"lorum <p>\n",o:"text6,html3,text1"},
		{i:"    indented    ~~~\n    indented\n    indented",o:"code45"},
		{i:"\tindented",o:"code9"},
		{i:"\n    indented",o:"text1,code12"},
		{i:"<code>~~~~~~~~~~~~~</code>",o:"code26"},
		{i:"~~~\ncode\n	a\nfence\nhttps://incode.example/\n~~~",o:"code45"},
		{i:"Https://url.example/",o:"url20"},
		{i:"A **Https://url.example/** B",o:"text2,url24,text2"},
		{i:"A *Https://url.example/* B",o:"text2,url22,text2"},
		{i:"A __Https://url.example/__ B",o:"text2,url24,text2"},
		{i:"A _Https://url.example/_ B",o:"text2,url22,text2"},
		{i:"A \"Https://url.example/\" B",o:"text2,url22,text2"},
		{i:"A 'Https://url.example/' B",o:"text2,url22,text2"},
		{i:"A (Https://url.example/) B",o:"text2,url22,text2"},
		{i:"<https://url.example/>",o:"url22"},
		{i:"<http://www.test-domain-1.net>",o:"url30"},
		{i:"`Https://url.example/`",o:"code22"},
		{i:"[link text](https://link.example/)",o:"text10,link24"},
		{i:"```````fence\    indented\n```\n```````\ntext",o:"code36,text5"},
		{i:"~~~\ncode \n",o:"code10"},
		{i:"`one line` text",o:"code10,text5"},
		{i:"text ```code``` text",o:"text5,code2,code6,code2,text5"},
		{i:"[1]: https://link.example/",o:"link26"},
		{i:"text <tag attribute=value> text",o:"text5,html21,text5"},
		{i:'text `code`, `code` text',o:"text5,code6,text2,code6,text5"},
		{i:'<a>`code`',o:"html3,code6"},,
		{i:'\n    code\n`code`',o:'text1,code8,text1,code6'}
	].forEach(io=>{
		var tokens=tokenizeMarkdown(io.i)
		expectEql("tokenizeMarkdown", markdownSizes(tokens), io.o, io.i, tokens)
	})

	;[
		{u:'example.com',o:'`example.com`'},
		{u:'example.com.',o:'`example.com`.'},
		{s:'(',u:'example.com',e:')',o:'(`example.com`)'},
		{s:'"',u:'example.com',o:'`example.com`'},
		{s:'**',u:'example.com',o:'`example.com`'},
		{s:"'",u:"example.com",o:'`example.com`'},
		{s:"<",u:"example.com",e:'>',o:'`example.com`'}
	].forEach(io=>{
		var s=io.s||'',e=io.e||s
		expectEql("applyCodeFormat", applyCodeFormat('','',s,io.u,e), io.o, s+io.u+e, io)
	})

	;[
		{s:'',r:[],o:""},
		{s:'',r:["one"],o:"one"},
		{s:'',r:["one","one","one"],o:"one"},
		{s:'',r:["one", "two"],o:"one, two"},
		{s:'one',r:[],o:"one"},
		{s:'one',r:["two"],o:"one, two"},
		{s:'one, two',r:["one", "two"],o:"one, two"}

	].forEach(io=>{
		expectEql("buildSummary", buildSummary(io.s,io.r), io.o, io.s + ", " + JSON.stringify(io.r), io)
	})

	;[
		{i:" Lorum ipsum ",o:" "},
		{i:" Lorum ipsum",o:""},
		{i:"Lorum ipsum ",o:""},
		{i:"Lorum ipsum",o:""},
		{i:"\tLorum ipsum",o:""},
		{i:"Lorum ipsum\t",o:""},
		{i:"\nLorum ipsum",o:""},
		{i:"Lorum ipsum\n",o:""},
		{i:"\n\nLorum ipsum",o:""},
		{i:"Lorum ipsum\n\n",o:""},
		{i:"\tLorum ipsum\t",o:" "},
		{i:"\n\nLorum ipsum\t",o:"\n\n"},
		{i:"\nLorum ipsum\t",o:"\n"},
		{i:"\tLorum ipsum",o:""},
		{i:"Lorum ipsum\t",o:""},
		{i:" Lorum ipsum\t",o:" "},
		{i:"\tLorum ipsum ",o:" "},
		{i:"? Lorum ipsum ",o:"? "},
		{i:"! Lorum ipsum",o:"!"},
		{i:".Lorum ipsum ",o:"."},
		{i:".Lorum ipsum",o:"."},
		{i:".\tLorum ipsum",o:"."},
		{i:".Lorum ipsum\t",o:"."},
		{i:".\nLorum ipsum",o:"."},
		{i:".Lorum ipsum\n",o:"."},
		{i:".\n\nLorum ipsum",o:"."},
		{i:".Lorum ipsum\n\n",o:"."},
		{i:".\tLorum ipsum\t",o:". "},
		{i:".\n\nLorum ipsum\t",o:".\n\n"},
		{i:".\nLorum ipsum\t",o:".\n"},
		{i:".\tLorum ipsum",o:"."},
		{i:".Lorum ipsum\t",o:"."},
		{i:". Lorum ipsum\t",o:". "},
		{i:".\tLorum ipsum ",o:". "},
	].forEach(io=>{
		expectEql("removeLeaveSpace", removeLeaveSpace(io.i), io.o, io.i)
	})

	const fs = require('fs')
	fs.readFileSync('stack-exchange-words.txt', 'utf-8').split(/\r?\n/).forEach(w=>{
		var d=getDefaultData()
		if(w) expectEql("Correctly spelled", applyRules(d, w, "text"), w, w, d)
	})
	fs.readFileSync('stack-exchange-misspellings.txt', 'utf-8').split(/\r?\n/).forEach(w=>{
		var d=getDefaultData()
		if(w) expectNotEql("Spelling error", applyRules(d, w, "text"), w, w, d)
	})

	return td
}
