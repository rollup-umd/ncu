const { existsSync } = require('fs');
const { join } = require('path');

function autoconfig(opts, pkg, thisPkg, base) {
  const autoconf = { reject: [] };
  if (!opts.disableAutoConf) {
    // get them dynamically, it must include documentation in the name, and be in devDependencies or dependencies
    const found = false;
    [pkg.dependencies || {}, pkg.devDependencies || {}].forEach((o) => {
      Object.keys(o).forEach((dep) => {
        if (dep.includes('ncu') && !dep.includes(thisPkg.name)) {
          const { keywords } = require(join(base, 'node_modules', dep, 'package.json')); // eslint-disable-line
          if (keywords && keywords.indexOf(thisPkg.name) !== -1) {
            if (existsSync(join(base, 'node_modules', dep))) {
              try {
                const { reject: autoconfReject, autoconfRest } = require(join(base, 'node_modules', dep)); // eslint-disable-line global-require
                autoconf.reject = [...new Set(
                  ...(autoconf.reject || []),
                  ...(autoconfReject || []),
                )];
                Object.assign(autoconf, autoconfRest);
              } catch (e) {
                console.log(`[Warning]: ${dep} cannot require ncu configuration`);
              }
            }
          }
        }
      });
      if (found) {
        console.log(`Auto configuration with ${found}`); // eslint-disable-line no-console
      }
    });
  }
  return autoconf;
}

const defaultOptions = {
  disableAutoConf: false,
  extensionFile: '.ncurc.ext.json',
};

/**
 * @public
 * @description
 * Create npm check updates configuration
 *
 * Read https://www.npmjs.com/package/npm-check-updates if you don't know what it is.
 *
 * Usually, you run updates as follow
 *
 * ```bash
 * $ npx npm-check-updates -a
 * // or install globally
 * $ npm install -g npm-check-updates
 * // then run it from global
 * $ ncu -a
 * ```
 *
 * By default, it will try to read it's configuration from `.ncurc.js`, this is where we hook this configuration:
 *
 * ```js static
 * const { createConfig } = require('$PACKAGE_NAME');
 * module.exports = createConfig();
 * ```
 *
 * This configuration will allow you to use:
 *
 * - **local extension**: Use a new file within a rollup-umd project that will be used to inject ncu configuration per project/
 * - **dependency extension**: Use a dependency extension within a rollup-umd project to manage ncu configuration across a set of projects.
 *
 *
 * To create a dependency extension, all you need is to publish a npm package with:
 *
 * - The ncu configuration as default exports, it will be merge with ours.
 * - Set in the `name` and add in `keywords` of your dependency the string: `ncu`.
 *
 * @param {object} [config={}] - ncu configuration
 * @param {object} [options={}] - options of create config
 * @param {boolean} [options.disableAutoConfig=false] - Disable auto configuration from extensions modules
 * @param {string} [options.extensionFile=.ncurrc.ext.json] - Location of the local extension file
 * @return {object} npm check updates configuration object
 */
export function createConfig(config = {}, options = {}) {
  // allow configuration from config
  const { reject: userReject, ...restUserConfig } = config;
  // general options
  const opts = { ...defaultOptions, ...options };

  const cwd = process.cwd();

  // user pkg
  const base = existsSync(join(cwd, 'package.json')) ? join(cwd) : join(__dirname, '..');
  const pkg = require(join(base, 'package.json')); // eslint-disable-line global-require

  // allow config from extension file
  const { reject: userExtReject, ...restUserExtConfig } = existsSync(join(base, opts.extensionFile)) ? require(join(base, opts.extensionFile)) : {}; // eslint-disable-line global-require

  // just for generating it's own documentation, we need it.
  const thisPkgPath = join(__dirname, '../package.json');
  const thisPkg = existsSync(thisPkgPath) ? require(thisPkgPath) : {}; // eslint-disable-line global-require

  // allow config from extension module
  const { reject: autoConfigReject, ...restAutoConfig } = autoconfig(opts, pkg, thisPkg, base);

  return {
    upgrade: true,
    reject: [...new Set([
      ...(userReject || []),
      ...(userExtReject || []),
      ...(autoConfigReject || []),
    ])],
    ...Object.assign(
      {},
      restUserConfig,
      restUserExtConfig,
      restAutoConfig
    ),
  };
}
