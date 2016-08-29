'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');

var baseUrl = 'https://api.github.com/repos/Microsoft/iot-hub-node-c-starterkits/contents';

module.exports = yeoman.Base.extend({

  prompting: function () {

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to ' + chalk.red('az-iot scaffolding 0.1.3') + ' generator!'
    ));

    // initialize settings -- empty initially
    this.board = "";
    this.language = "";
    this.example = "";

    // check if values were passed as parameters
    this.args.forEach(function(element) {
        if (element.startsWith("board=")) {
            this.board = element.split("=")[1];
        }
        else if (element.startsWith("language=")) {
            this.language = element.split("=")[1];
        }
        else if (element.startsWith("example")) {
            this.example = element.split("=")[1];
        }
    }, this);

    // get list of boards
    var done = this.async();
    var url = baseUrl;
    var file = require('url').parse(url).path.split('/').pop();
    var _this = this;
    this.fetch(url, this.destinationPath("."), function(err) {
      
      var list = JSON.parse(_this.read(_this.destinationPath(file)));
      var board_list = [];

      // delete temporary file
      require('fs').unlinkSync(_this.destinationPath(file));
      
      list.forEach(function(element) {
        if (element.type == 'dir') board_list.push(element.name);
      }, _this);        

      if (_this.board == "")
      {
        var prompts = [{
            type: 'list',
            choices: board_list,
            name: 'board',
            message: 'Please select board:',
          }];

        _this.prompt(prompts).then(function (props) {
          _this.board = props.board;
          done();
        });
      }
      else
      {
        if (board_list.indexOf(_this.board) >= 0)
        {
          done();
        }
        else
        {
          done(new Error("Invalid Parameter: " + _this.board));
        }
      }
    });
  },

  prompting_2: function() {
    // get list of examples
    var done = this.async();
    var url = baseUrl + '/' + this.board;
    var file = require('url').parse(url).path.split('/').pop();
    var _this = this;
    this.fetch(url, this.destinationPath("."), function(err) {
      
      var list = JSON.parse(_this.read(_this.destinationPath(file)));
      var example_list = [];

      // delete temporary file
      require('fs').unlinkSync(_this.destinationPath(file));
      
      list.forEach(function(element) {
        if (element.type == 'dir') example_list.push(element.name);
      }, _this);        

      if (_this.example == "")
      {
        var prompts = [{
            type: 'list',
            choices: example_list,
            name: 'example',
            message: 'Please select example:',
          }];

        _this.prompt(prompts).then(function (props) {
            _this.example = props.example;
            done();
        }.bind(_this));
      }
      else
      {
        if (example_list.indexOf(_this.example) >= 0)
        {
          done();
        }
        else
        {
          done(new Error("Invalid Parameter: " + _this.example));
        }
      }
    });
  },

  prompting_3: function() {
    // get list of languages
    var done = this.async();
    var url = baseUrl + '/' + this.board + '/' + this.example;
    var file = require('url').parse(url).path.split('/').pop();
    var _this = this;
    this.fetch(url, this.destinationPath("."), function(err) {
      
      var list = JSON.parse(_this.read(_this.destinationPath(file)));
      var language_list = [];

      // delete temporary file
      require('fs').unlinkSync(_this.destinationPath(file));
      
      list.forEach(function(element) {
        if (element.type == 'dir') language_list.push(element.name);
      }, _this);        

      if (_this.language == "")
      {
        var prompts = [{
            type: 'list',
            choices: language_list,
            name: 'language',
            message: 'Please select language:',
          }];

        _this.prompt(prompts).then(function (props) {
            _this.language = props.language;
            done();
        });
      }
      else
      {
        if (language_list.indexOf(_this.language) >= 0)
        {
          done();
        }
        else
        {
          done(new Error("Invalid Parameter: " + _this.language));
        }
      }
    });
  },

  writing: function () {
    var _this = this;
    var done = this.async();

    var url = baseUrl + '/' + this.board + '/' + this.example + '/' + this.language;
    var file = require('url').parse(url).path.split('/').pop();
      this.fetch(url, _this.destinationPath("."), function(err) {
        
        var list = JSON.parse(_this.read(_this.destinationPath(file)));
        var fetchCount = list.length;

        require('fs').unlinkSync(_this.destinationPath(file));
        
        _this.sampleFolderName = _this.board + '-' + _this.example + '-' + _this.language + '-sample';

        list.forEach(function(element) {
          _this.fetch(element.download_url, _this.sampleFolderName, function(err) {
            fetchCount--;

            if (fetchCount == 0)
            {
              var configFile = './' + _this.sampleFolderName + '/config.json';
              fs.exists(configFile, function(exists) {
                if (exists) {
                  fs.readFile(configFile, 'utf8', function(err, data) {
                    if(err)
                    {
                      done(err)
                    }
                    else
                    {
                      var config = JSON.parse(data);
                      var prompts = [];
                      for( var row in config ) {
                        var item = {type:'input', 
                                    name:row,
                                    message:'Please input the value for ' + row,
                                    default:config[row]};
                      
                        prompts.push(item);
                      }
                      
                      _this.prompt(prompts).then(function (answers){
                        var newConfig = {};
                        for(var prop in answers)
                        {
                          newConfig[prop] = answers[prop];  
                        }
                        
                        fs.writeFile(configFile, JSON.stringify(newConfig), function(err) {
                          done(err);
                        });
                      })
                    }
                  });
                }
                else
                {
                  done();
                }
              });
            }
          });
        }, this);        
      });
  },

  install: function () {
    process.chdir(this.sampleFolderName);
    this.installDependencies();
  }
});
