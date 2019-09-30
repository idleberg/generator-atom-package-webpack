const Generator = require('yeoman-generator');
const meta = require('../../package.json');

const axios = require('axios');
const mkdirp = require('mkdirp');
const slugify = require('@sindresorhus/slugify');
const spdxLicenseList = require('spdx-license-list/full');
const terminalLink = require('terminal-link');
const updateNotifier = require('update-notifier');
const yosay = require('yosay');
const { join } = require('path');

// Create array of license choices
const spdxCodes = Object.getOwnPropertyNames(spdxLicenseList).sort();
const licenseChoices = spdxCodes.map(obj => {
  const licenses = {};
  licenses['name'] = terminalLink(obj, `https://spdx.org/licenses/${obj}.html`, {
    fallback() {
      return obj;
    }
  });
  licenses['value'] = obj;

  return licenses;
});

// Is there a newer version of this generator?
updateNotifier({ pkg: meta }).notify();

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    // Use long flags to discourage usage
   this.option(
      'allow-atom-prefix',
      {
        desc: `Allows naming the package with "atom-" prefix`,
        default: false,
        type: Boolean
      }
    );
    this.option(
      'allow-empty-description',
      {
        desc: `Allows empty packag description`,
        default: false,
        type: Boolean
      }
    );
    this.option(
      'clear',
      {
        desc: `Doesn't clear the console on startup`,
        default: true,
        type: Boolean
      }
    );

    this.allowAtomPrefix = (this.options.allowAtomPrefix ? true : false);
    this.allowEmptyDescription = (this.options.allowEmptyDescription ? true : false);
    this.clear = (this.options.clear ? true : false);
  }

  inquirer() {
    if (this.clear) console.clear();
    console.log(yosay('Let me help you build an Atom package'));

    return this.prompt([
      {
        name: 'name',
        message: 'What do you want to name your package?',
        default: slugify(this.appname),
        store: true,
        validate: (str) => {
          if (str.startsWith('atom-') && this.allowAtomPrefix === false) {
            return 'Your package name shouldn\'t be prefixed with "atom-"';
          } else if (str.length > 214) {
            return 'The name must be less than or equal to 214 characters';
          }

          return true;
        }
      },
      {
        name: 'description',
        message: 'What is your package description?',
        default: '',
        store: true,
        validate: (str) => {
          return (str.length === 0 && this.allowEmptyDescription === false) ? 'Please provide a short description for your package' : true;
        }
      },
      {
        name: 'author',
        message: 'What\'s your GitHub username?',
        default: async () => await this.user.github.username(),
        store: true,
        validate: x => x.length > 0 ? true : 'You have to provide a username',
        when: () => !this.options.org
      },
      {
        type: 'list',
        name: 'license',
        message: 'Choose a license',
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
        type: 'confirm',
        name: 'atomDependenciesQuestion',
        message: 'Depend on other Atom packages?',
        default: false,
        store: true
      },
      {
        name: 'atomDependencies',
        message: 'Specify Atom packages (comma-separated)',
        store: true,
        when: answers => (answers.atomDependenciesQuestion) ? true : false,
        validate: async str => {
          if (str.trim().length === 0) {
            return 'You need to specify at least one package';
          }

          const packages = str.split(',');
          const promises = [];

          for (var pkg of packages) {
            promises.push(axios.get(`https://atom.io/api/packages/${pkg}`));
          }

          try {
            await Promise.all(promises); // responses will be an array
          } catch (err) {
            return `The package '${pkg}' could not be found`;
          }

          return true;
        }
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
        default: 'pre-commit',
        store: true,
        choices: [
          {
            name: 'pre-commit',
            value: 'pre-commit',
          },
          {
            name: 'pre-push',
            value: 'pre-push',
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
            name: terminalLink('Circle CI', 'https://circleci.com/', {
              fallback() {
                return 'Circle CI';
              }
            }),
            value: 'circleCI',
            checked: false
          },
          {
            name: terminalLink('Travis CI', 'https://travis-ci.org/', {
              fallback() {
                return 'Travis CI';
              }
            }),
            value: 'travisCI',
            checked: false
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
            name: terminalLink('Flow', 'https://www.npmjs.com/package/@babel/preset-flow', {
              fallback() {
                return 'Flow';
              }
            }),
            value: 'flow'
          },
          {
            name: terminalLink('React', 'https://www.npmjs.com/package/@babel/preset-react', {
              fallback() {
                return 'React';
              }
            }),
            value: 'react',
          },
          {
            name: terminalLink('Stage-0', 'https://www.npmjs.com/package/@babel/preset-stage-0', {
              fallback() {
                return 'Stage-0';
              }
            }),
            value: 'stage-0',
          },
          {
            name: terminalLink('Stage-1', 'https://www.npmjs.com/package/@babel/preset-stage-1', {
              fallback() {
                return 'Stage-1';
              }
            }),
            value: 'stage-1',
          },
          {
            name: terminalLink('Stage-2', 'https://www.npmjs.com/package/@babel/preset-stage-2', {
              fallback() {
                return 'Stage-2';
              }
            }),
            value: 'stage-2',
          },
          {
            name: terminalLink('Stage-3', 'https://www.npmjs.com/package/@babel/preset-stage-3', {
              fallback() {
                return 'Stage-3';
              }
            }),
            value: 'stage-3',
          },
          {
            name: terminalLink('Stage-4', 'https://www.npmjs.com/package/@babel/preset-stage-4', {
              fallback() {
                return 'Stage-4';
              }
            }),
            value: 'stage-4',
          }
        ]
      },
      {
        type: 'list',
        name: 'eslintConfig',
        message: 'ESLint Configuration',
        store: true,
        choices: [
          {
            name: terminalLink('Airbnb', 'https://www.npmjs.com/package/eslint-config-airbnb', {
              fallback() {
                return 'Airbnb';
              }
            }),
            value: 'airbnb',
          },
          {
            name: terminalLink('ESLint', 'https://www.npmjs.com/package/eslint-config-eslint', {
              fallback() {
                return 'ESLint';
              }
            }),
            value: 'eslint',
          },
          {
            name: terminalLink('Google', 'https://www.npmjs.com/package/eslint-config-google', {
              fallback() {
                return 'Google';
              }
            }),
            value: 'google',
          },
          {
            name: terminalLink('Idiomatic', 'https://www.npmjs.com/package/eslint-config-idiomatic', {
              fallback() {
                return 'Idiomatic';
              }
            }),
            value: 'idiomatic',
          },
          {
            name: terminalLink('Prettier', 'https://www.npmjs.com/package/eslint-config-prettier', {
              fallback() {
                return 'Prettier';
              }
            }),
            value: 'prettier',
          },
          {
            name: terminalLink('Semistandard', 'https://www.npmjs.com/package/eslint-config-semistandard', {
              fallback() {
                return 'Semistandard';
              }
            }),
            value: 'semistandard',
          },
          {
            name: terminalLink('Shopify', 'https://www.npmjs.com/package/eslint-config-shopify', {
              fallback() {
                return 'Shopify';
              }
            }),
            value: 'shopify',
          },
          {
            name: terminalLink('Standard', 'https://www.npmjs.com/package/eslint-config-standard', {
              fallback() {
                return 'Standard';
              }
            }),
            value: 'standard',
          },
          {
            name: terminalLink('Vue', 'https://www.npmjs.com/package/eslint-config-vue', {
              fallback() {
                return 'Vue';
              }
            }),
            value: 'vue',
          },
          {
            name: terminalLink('WordPress', 'https://www.npmjs.com/package/eslint-config-wordpress', {
              fallback() {
                return 'WordPress';
              }
            }),
            value: 'wordpress',
          },
          {
            name: terminalLink('XO', 'https://www.npmjs.com/package/eslint-config-xo', {
              fallback() {
                return 'XO';
              }
            }),
            value: 'xo',
          }
        ]
      },
      {
        type: 'list',
        name: 'stylelintConfig',
        message: 'Stylelint Configuration',
        store: true,
        choices: [
          {
            name: terminalLink('Airbnb', 'https://www.npmjs.com/package/stylelint-config-airbnb', {
              fallback() {
                return 'Airbnb';
              }
            }),
            value: 'airbnb',
          },
          {
            name: terminalLink('Idiomatic', 'https://www.npmjs.com/package/stylelint-config-idiomatic', {
              fallback() {
                return 'Idiomatic';
              }
            }),
            value: 'idiomatic',
          },
          {
            name: terminalLink('Prettier', 'https://www.npmjs.com/package/stylelint-config-prettier', {
              fallback() {
                return 'Prettier';
              }
            }),
            value: 'prettier',
          },
          {
            name: terminalLink('Primer', 'https://www.npmjs.com/package/stylelint-config-primer', {
              fallback() {
                return 'Primer';
              }
            }),
            value: 'primer',
          },
          {
            name: terminalLink('Recommended', 'https://www.npmjs.com/package/stylelint-config-recommended', {
              fallback() {
                return 'Recommended';
              }
            }),
            value: 'recommended',
          },
          {
            name: terminalLink('Shopify', 'https://www.npmjs.com/package/stylelint-config-shopify', {
              fallback() {
                return 'Shopify';
              }
            }),
            value: 'shopify',
          },
          {
            name: terminalLink('Standard', 'https://www.npmjs.com/package/stylelint-config-standard', {
              fallback() {
                return 'Standard';
              }
            }),
            value: 'standard',
          },
          {
            name: terminalLink('WordPress', 'https://www.npmjs.com/package/stylelint-config-wordpress', {
              fallback() {
                return 'WordPress';
              }
            }),
            value: 'wordpress',
          },
          {
            name: terminalLink('XO', 'https://www.npmjs.com/package/stylelint-config-xo', {
              fallback() {
                return 'XO';
              }
            }),
            value: 'xo',
          }
        ]
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize Git repository?',
        default: this.fs.exists(join(process.cwd(), '.git', 'config')) ? false : true
      },
      {
        type: 'confirm',
        name: 'linkDevPackage',
        message: 'Link as developer package?',
        default: 'true',
        store: true
      },
      {
        type: 'confirm',
        name: 'openInEditor',
        message: 'Open in default editor?',
        default: 'true',
        store: true,
        when: () => {
          return (process.env.EDITOR) ? true : false;
        }
      }
    ]).then(props => {

      props.licenseURL = spdxLicenseList[props.license].url;
      props.licenseName = spdxLicenseList[props.license].name;
      props.licenseText = spdxLicenseList[props.license].licenseText.replace(/\n{3,}/g, '\n\n');
      props.repositoryName = (props.name.startsWith('atom-')) ? props.name : `atom-${props.name}`;

      if (typeof props.atomDependencies !== 'undefined') {
        props.atomDependencies = props.atomDependencies.split(',');
        props.atomDependencies.map(dependency => dependency.trim());
      }

      switch (props.eslintConfig) {
        case 'eslint':
          props.indent_style = 'space';
          props.indent_size = 4;
          props.ws = '    ';
          break;
        case 'wordpress':
        case 'xo':
          props.indent_style = 'tab';
          props.ws = '\t';
          break;
        default:
          props.indent_style = 'space';
          props.indent_size = 2;
          props.ws = '  ';
          break;
      }

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

      this.fs.copyTpl(
        this.templatePath('package.json.ejs'),
        this.destinationPath('package.json'),
        {
          pkg: props
        }
      );

      if (props.addConfig.indexOf('circleCI') !== -1) {
        mkdirp('.circleci');
        this.fs.copy(
          this.templatePath('_circleci/config.yml'),
          this.destinationPath('.circleci/config.yml')
        );
      }

      if (props.addConfig.indexOf('travisCI') !== -1) {
        this.fs.copy(
          this.templatePath('_travis.yml'),
          this.destinationPath('.travis.yml')
        );
      }

      this.fs.copyTpl(
        this.templatePath('_editorconfig.ejs'),
        this.destinationPath('.editorconfig'),
        {
          pkg: props
        }
      );

      this.fs.copy(
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
        this.templatePath('_stylelintrc.ejs'),
        this.destinationPath(`.stylelintrc`),
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
      const dependencies = ['@babel/core', '@babel/preset-env', 'babel-loader', 'webpack', 'webpack-cli'];
      let devDependencies = [
        'babel-eslint',
        'eslint',
        `eslint-config-${props.eslintConfig}`,
        'eslint-plugin-node',
        'husky',
        'stylelint',
        `stylelint-config-${props.stylelintConfig}`
      ];

      props.babelPresets.forEach( preset => {
        dependencies.push(`@babel/preset-${preset}`);
      });

      if (props.buildScript === 'prepublishOnly') {
        devDependencies = devDependencies.concat(dependencies)
        if (typeof props.atomDependencies !== 'undefined' && props.atomDependencies.length > 0) {
          this.yarnInstall(['atom-package-deps'], { ignoreScripts: true });
        }
      } else {
        if (typeof props.atomDependencies !== 'undefined' && props.atomDependencies.length > 0) {
          dependencies.push('atom-package-deps');
        }
        this.yarnInstall(dependencies, { ignoreScripts: true });
      }
      this.yarnInstall(devDependencies, { 'dev': true });

      // Initialize git repository
      if (props.initGit) {
        this.spawnCommandSync('git', ['init']);
      }

      // Link to ~/.atom/dev/packages
      if (props.linkDevPackage === true) {
        this.spawnCommand('apm', ['link', '--dev']);
      }

      // Open in Editor
      if (props.openInEditor === true) {
        this.spawnCommand(process.env.EDITOR, [ '.' ]);
      }
    });
  }
};
