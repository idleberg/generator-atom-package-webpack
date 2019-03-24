# generator-atom-package-webpack

[![npm](https://flat.badgen.net/npm/license/generator-atom-package-webpack)](https://www.npmjs.org/package/generator-atom-package-webpack)
[![npm](https://flat.badgen.net/npm/v/generator-atom-package-webpack)](https://www.npmjs.org/package/generator-atom-package-webpack)
[![CircleCI](https://flat.badgen.net/circleci/github/idleberg/generator-atom-package-webpack)](https://circleci.com/gh/idleberg/generator-atom-package-webpack)
[![David](https://flat.badgen.net/david/dep/idleberg/generator-atom-package-webpack)](https://david-dm.org/idleberg/generator-atom-package-webpack)

## Description

A [Yeoman](http://yeoman.io/authoring/user-interactions.html) generator for Atom packages written in JavaScript and compiled using Webpack. This is meant as an experiment, hoping to [reduce activation time](https://discuss.atom.io/t/package-activatetime/56808/14) of the package. Based on configuration setup by [@jneuendorf](https://github.com/jneuendorf/).

**Features**

- adds any [SPDX](https://spdx.org/licenses/) license
- adds [CircleCI](https://circleci.com/) configuration
- adds [Travis CI](https://travis-ci.org/) configuration
- adds [ESLint](https://eslint.org/) configuration
- adds [Babel](https://babeljs.io/) presets
- adds [Atom package dependencies](https://www.npmjs.com/package/atom-package-deps)

## Installation

Use your preferred [Node](https://nodejs.org/) package manager to install the CLI tool

```sh
npm i generator-atom-package-webpack -g
```

## Usage

Run the generator and follow its instructions. Use `--help`to list available flags.

```sh
yo atom-package-webpack
```

*“That's all Folks!”*

## Related

- [generator-atom-package-coffeescript](https://www.npmjs.org/package/generator-atom-package-coffeescript)
- [generator-atom-package-typescript](https://www.npmjs.org/package/generator-atom-package-typescript)

## License

This work is licensed under the [MIT License](https://opensource.org/licenses/MIT)
