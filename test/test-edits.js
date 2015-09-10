

describe('Editor Toolkit', function () {
  var App;

  var expect = chai.expect;

  beforeEach(function () {
    App = window.App;
    // TODO Replace with mock
    App.selections = {
      bodyBox: {
        animate: function () {}
      },
      summaryBox: {
        focus: function () {}
      }
    };
    App.init();
    App.globals.reasons = [];
    App.globals.numReasons = 0;
  });

  describe('App', function () {
    it('should have a global App object', function () {
      expect(window.App).to.exist;
    });
    it('should have a local App object', function () {
      expect(App).to.exist;
    });
  });

  describe('Edits', function () {
    var compareEdits = [];

    var compareNoEdits = [
      { input: 'I am using git://github.com/foo/bar.git to work.', expected: 'I am using git://github.com/foo/bar.git to work.', desc: 'git URLs' },
    ];

    // Add additional combinations to test here:
    var combos = [
      { in: ['git', 'GIT'], out: 'Git'},
      { in: ['github', 'GITHUB', 'Github'], out: 'GitHub'},
      { in: ['Stackoverflow', 'Stack overflow', 'stack overflow', 'StackOverflow', 'stackoverflow', 'SO'], out: 'Stack Overflow'},
      { in: ['Stackexchange', 'Stack exchange', 'stack exchange', 'StackExchange', 'stackexchange', 'SE'], out: 'Stack Exchange'},
      { in: ['Javascript', 'Java script', 'java script', 'javascript', 'Java Script'], out: 'JavaScript'},
      { in: ['jsfiddle', 'Jsfiddle', 'JsFiddle', 'JSfiddle', 'jsFiddle', 'JS Fiddle', 'js fiddle'], out: 'JSFiddle'},
      { in: ['jquery', 'Jquery', 'JQuery', 'jQuery'], out: 'jQuery'},
      { in: ['html', 'Html'], out: 'HTML'},
      { in: ['html5', 'Html5'], out: 'HTML5'},
      { in: ['css', 'Css'], out: 'CSS'},
      { in: ['json', 'Json'], out: 'JSON'},
      { in: ['ajax'], out: 'AJAX'},
      { in: ['angularjs', 'Angularjs', 'angularJs', 'angularJS', 'AngularJs'], out: 'AngularJS'},
      { in: ['php', 'Php'], out: 'PHP'},
      { in: ['c#'], out: 'C#'},
      { in: ['c+'], out: 'C+'},
      { in: ['c++'], out: 'C++'},
      { in: ['java'], out: 'Java'},
      { in: ['sql', 'Sql'], out: 'SQL'},
      { in: ['sqlite', 'Sqlite'], out: 'SQLite'},
      { in: ['android'], out: 'Android'},
      { in: ['oracle'], out: 'Oracle'},
      { in: ['win xp', 'WIN XP', 'windows xp', 'windows XP'], out: 'Windows XP'},
      { in: ['win vista', 'WIN VISTA', 'windows vista', 'windows VISTA'], out: 'Windows Vista'},
      { in: ['win 7', 'WIN 7', 'windows 7', 'WINDOWS 7'], out: 'Windows 7'},
      { in: ['win 95', 'windows 95', 'WIN 95', 'WINDOWS 95'], out: 'Windows 95'},
      { in: ['ubunto', 'ubunut', 'ubunutu', 'ubunu', 'ubntu', 'ubutnu', 'ubantoo', 'ubantooo', 'unbuntu', 'ubunt', 'ubutu'], out: 'Ubuntu'},
      { in: ['linux'], out: 'Linux'},
      { in: ['ios', 'iOs', 'ioS', 'IOS', 'Ios', 'IoS'], out: 'iOS'},
      { in: ['ios8', 'iOs8', 'ioS8', 'IOS8', 'Ios8', 'IoS8'], out: 'iOS 8'},
      { in: ['wordpress', 'Wordpress'], out: 'WordPress'},
      { in: ['google', 'gOOgle', 'GOOGLE'], out: 'Google'},
      { in: ['mysql', 'mySql', 'MySql', 'mySQL', 'MYSQL'], out: 'MySQL'},
      { in: ['apache', 'Apache', 'APACHE'], out: 'Apache'},
      { in: ['hdd', 'Hdd', 'HDD', 'harddisk', 'Harddisk', 'HardDisk', 'HARDDISK'], out: 'hard disk'},
    ];

    function addOneComparison(collection, item, word, desc) {
      collection.push({
        input: 'I am using ' + word + ' to work.',
        expected: 'I am using ' + item.out + ' to work.',
        desc: desc + item.out
       });

      collection.push({
        input: 'I am using ' + word + '.',
        expected: 'I am using ' + item.out + '.',
        desc: desc + item.out + ' at the end of a sentence'
       });
    }

    function addComparisons (item) {
      item.in.forEach(function (word) {
        addOneComparison(compareEdits, item, word, word + '/');
      });

      addOneComparison(compareNoEdits, item, item.out, 'false positive for ');

      if (item.exclude) {
        item.exclude.forEach(function (word) {
          addOneComparison(compareNoEdits, item, word, word + '/');
        });
      }
    }

    combos.forEach(function (item) {
      addComparisons(item);
    });

    function compareOne (item, attribute) {
      var data = [{
        body: '',
        title: '',
        summary: ''
      }];

      data[0][attribute] = item.input;

      App.globals.pipeMods.edit(data);

      expect(data[0][attribute]).to.eql(item.expected);
    }

    function compareOneExclusion (item, attribute) {
      var data = [{
        body: '',
        title: '',
        summary: ''
      }];

      data[0][attribute] = item.input;

      App.globals.pipeMods.edit(data);

      expect(data[0][attribute]).to.eql(item.expected);
      expect(data[0].summary).to.eql('');
    }

    compareEdits.forEach(function (item) {
      it('should handle ' + item.desc + ' in the body', function () {
        compareOne(item, 'body');
      });

      it('should handle ' + item.desc + ' in the title', function () {
        compareOne(item, 'title');
      });
    });

    compareNoEdits.forEach(function (item) {
      it('should not change ' + item.desc + ' in the body', function () {
        compareOneExclusion(item, 'body');
      });

      it('should not change ' + item.desc + ' in the title', function () {
        compareOneExclusion(item, 'title');
      });
    });
  });
});
