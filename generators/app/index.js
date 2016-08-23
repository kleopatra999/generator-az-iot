'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var fs = require('fs');

module.exports = yeoman.Base.extend({

  prompting: function () {

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to ' + chalk.red('scaffolding') + ' generator!'
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
    var url = 'https://api.github.com/repos/zikalino/iot-samples/contents';
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
    var url = 'https://api.github.com/repos/zikalino/iot-samples/contents/' + this.board;
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
    var url = 'https://api.github.com/repos/zikalino/iot-samples/contents/' + this.board + '/' + this.example;
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

    var url = 'https://api.github.com/repos/zikalino/iot-samples/contents/' + this.board + '/' + this.example + '/' + this.language;
    var file = require('url').parse(url).path.split('/').pop();
      this.fetch(url, _this.destinationPath("."), function(err) {
        
        var list = JSON.parse(_this.read(_this.destinationPath(file)));
        var fetchCount = list.length;

        require('fs').unlinkSync(_this.destinationPath(file));
        
        var sampleFolderName = _this.board + '-' + _this.example + '-' + _this.language + '-sample';
        list.forEach(function(element) {
          _this.fetch(element.download_url, sampleFolderName, function(err) {
            fetchCount--;

            if (fetchCount == 0)
            {
              var configFile = './' + sampleFolderName + '/config.json';
              fs.exists(configFile, function(exists) {
                if (exists) {
                  fs.readFile(configFile, 'utf8', (err, data) => {
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
    if(!fs.existsSync("package.json"))
    {
      fs.writeFile("package.json", "{}"); 
    }
    
    // TODO:
    // check the dependency of each sample's gulp script and install them on demand,
    // instead of installing all the dependencies here.
    this.npmInstall(['simple-ssh'], { 'saveDev': true });
    this.npmInstall(['az-iot-helper-test'], { 'saveDev': true });
    this.npmInstall(['request'], { 'saveDev': true });
    this.npmInstall(['vinyl-source-stream'], { 'saveDev': true });
    this.npmInstall(['gulp-unzip'], { 'saveDev': true });
  }
});
