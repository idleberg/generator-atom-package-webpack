const Generator = require('yeoman-generator');
const pkg = require('../../package.json');

const fs = require('fs');
const mkdirp = require('mkdirp');
const slugify = require('@sindresorhus/slugify');
const spdxLicenseList = require('spdx-license-list/full');
const updateNotifier = require('update-notifier');

// Create array of license choices
const spdxCodes = Object.getOwnPropertyNames(spdxLicenseList).sort();
const licenseChoices = spdxCodes.map(obj =>{
   const licenses = {};
   licenses['value'] = obj;

   return licenses;
})

// Is there a newer version of this generator?
updateNotifier({ pkg: pkg }).notify();

module.exports = class extends Generator {
  inquirer() {
    return this.prompt([
      {
        name: 'name',
        message: 'What do you want to name your package?',
        default: slugify(this.appname),
        store: true,
        validate: (str) => {
          return !str.startsWith('atom-') ? true : 'Your package name shouldn\'t be prefixed with "atom-"' ;
        }
      },
      {
        name: 'description',
        message: 'What is your package description?',
        default: '',
        store: true,
        validate: (str) => {
          return str.length > 0 ? true : 'Please provide a short description for your package' ;
        }
      },
      {
        name: 'author',
        message: 'What\'s your GitHub username?',
        store: true,
        validate: x => x.length > 0 ? true : 'You have to provide a username',
        when: () => !this.options.org
      },
      {
        type: 'list',
        name: 'license',
        message: 'Choose license',
        default: 'MIT',
        choices: licenseChoices,
        store: true
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Package Features',
        store: true,
        choices: [
          {
            name: 'Grammars',
            value: 'grammars',
            checked: false
          },
          {
            name: 'Keymaps',
            value: 'keymaps',
            checked: false
          },
          {
            name: 'Menus',
            value: 'menus',
            checked: false
          },
          {
            name: 'Snippets',
            value: 'snippets',
            checked: false
          },
          {
            name: 'Styles',
            value: 'styles',
            checked: false
          }
        ]
      },
      {
        type: 'confirm',
        name: 'activationCmd',
        message: 'Add activation command?',
        default: true,
        store: true
      },
      {
        type: 'list',
        name: 'buildScript',
        message: 'Build Script',
        default: 'prepublishOnly',
        store: true,
        choices: [
          {
            name: 'postinstall',
            value: 'postinstall',
          },
          {
            name: 'prepublishOnly',
            value: 'prepublishOnly',
          }
        ]
      },
      {
        type: 'list',
        name: 'linterHook',
        message: 'Linter Hook',
        default: 'precommit',
        store: true,
        choices: [
          {
            name: 'precommit',
            value: 'precommit',
          },
          {
            name: 'prepush',
            value: 'prepush',
          },
          {
            name: 'prepublishOnly',
            value: 'prepublishOnly'
          }
        ]
      },
      {
        type: 'checkbox',
        name: 'addConfig',
        message: 'Add configuration',
        store: true,
        choices: [
          {
            name: 'Circle CI',
            value: 'circleCI',
            checked: false
          },
          {
            name: 'Travis CI',
            value: 'travisCI',
            checked: false
          }
        ]
      },
      {
        type: 'list',
        name: 'eslintConfig',
        message: 'ESLint style guide',
        store: true,
        choices: [
          {
            name: 'Airbnb',
            value: 'airbnb',
          },
          {
            name: 'ESLint',
            value: 'eslint',
          },
          {
            name: 'Google',
            value: 'google',
          },
          {
            name: 'Idiomatic',
            value: 'idiomatic',
          },
          {
            name: 'Prettier',
            value: 'prettier',
          },
          {
            name: 'Standard',
            value: 'standard',
          }
        ]
      },
      {
        type: 'checkbox',
        name: 'babelPresets',
        message: 'Babel Presets',
        store: true,
        choices: [
          {
            name: 'Flow',
            value: 'flow'
          },
          {
            name: 'React',
            value: 'react',
          },
          {
            name: 'Stage-0',
            value: 'stage-0',
          },
          {
            name: 'Stage-1',
            value: 'stage-1',
          },
          {
            name: 'Stage-2',
            value: 'stage-2',
          },
          {
            name: 'Stage-3',
            value: 'stage-3',
          },
          {
            name: 'Stage-4',
            value: 'stage-4',
          }
        ]
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize Git repository?',
        default: fs.existsSync('.git/') ? false : true
      }
    ]).then(props => {

      props.licenseURL = spdxLicenseList[props.license].url;
      props.licenseName = spdxLicenseList[props.license].name;
      props.licenseText = spdxLicenseList[props.license].licenseText.replace(/\n/g, '\n\n');

      // Copying files
      props.features.forEach( feature => {
        mkdirp(feature);
      });

      if (props.features.indexOf('keymaps') !== -1) {
        this.fs.copyTpl(
          this.templatePath('keymaps/keymap.json.ejs'),
          this.destinationPath(`keymaps/${props.name}.json`),
          {
            pkg: props
          }
        );
      }

      if (props.features.indexOf('menus') !== -1) {
        this.fs.copyTpl(
          this.templatePath('menus/menu.json.ejs'),
          this.destinationPath(`menus/${props.name}.json`),
          {
            pkg: props
          }
        );
      }

      if (props.features.indexOf('styles') !== -1) {
        this.fs.copyTpl(
          this.templatePath('styles/style.less.ejs'),
          this.destinationPath(`styles/${props.name}.less`),
          {
            pkg: props
          }
        );
      }

      mkdirp('src');
      this.fs.copyTpl(
        this.templatePath('src/main.ejs'),
        this.destinationPath(`src/${props.name}.js`),
        {
          pkg: props
        }
      );

     this.fs.copyTpl(
        this.templatePath('README.md.ejs'),
        this.destinationPath('README.md'),
        {
          pkg: props
        }
      );

      this.fs.copyTpl(
        this.templatePath('LICENSE.ejs'),
        this.destinationPath('LICENSE'),
        {
          licenseText: props.licenseText
        }
      );

      if (props.buildScript === props.linterHook) {
        props.scripts = [
          '"prepublishOnly": "npm run lint && npm run build"'
        ];
      } else {
        props.scripts = [
          `"${props.buildScript}": "npm run build"`,
          `"${props.linterHook}": "npm run lint"`
        ];
      }

      this.fs.copyTpl(
        this.templatePath('package.json.ejs'),
        this.destinationPath('package.json'),
        {
          pkg: props
        }
      );

      if (props.addConfig.indexOf('circleCI') !== -1) {
        mkdirp('.circleci');
        this.fs.copyTpl(
          this.templatePath('_circleci/config.yml'),
          this.destinationPath('.circleci/config.yml')
        );
      }

      if (props.addConfig.indexOf('travisCI') !== -1) {
        this.fs.copyTpl(
          this.templatePath('_travis.yml'),
          this.destinationPath('.travis.yml')
        );
      }

      this.fs.copyTpl(
        this.templatePath('_editorconfig'),
        this.destinationPath('.editorconfig')
      );

      this.fs.copyTpl(
        this.templatePath('_gitignore'),
        this.destinationPath('.gitignore')
      );

      this.fs.copyTpl(
        this.templatePath('webpack.config.ejs'),
        this.destinationPath(`webpack.config.js`),
        {
          pkg: props
        }
      );

      this.fs.copyTpl(
        this.templatePath('_eslintrc.ejs'),
        this.destinationPath(`.eslintrc`),
        {
          pkg: props
        }
      );

      this.fs.copyTpl(
        this.templatePath('_babelrc.ejs'),
        this.destinationPath(`.babelrc`),
        {
          pkg: props
        }
      );

      // Install latest versions of dependencies
      const dependencies = ['babel-core', 'babel-loader', 'babel-preset-env', 'webpack', 'webpack-cli'];
      let devDependencies = [ 'babel-eslint', 'eslint', `eslint-config-${props.eslintConfig}`, 'eslint-plugin-node', 'husky'];

      props.babelPresets.forEach( preset => {
        dependencies.push(`babel-preset-${preset}`);
      });

      if (props.buildScript === 'prepublishOnly') {
        devDependencies = devDependencies.concat(dependencies)
      } else {
        this.yarnInstall(dependencies, { ignoreScripts: true });
      }
      this.yarnInstall(devDependencies, { 'dev': true });

      // Initialize git repository
      if (props.initGit) {
        this.spawnCommandSync('git', ['init']);
      }
    });
  }
};
