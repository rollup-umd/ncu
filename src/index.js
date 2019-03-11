const { existsSync } = require('fs');
const { join } = require('path');

function autoconfig(opts, pkg, thisPkg, base) {
  const autoconf = { reject: [] };
  if (!opts.disableAutoConf) {
    // get them dynamically, it must include documentation in the name, and be in devDependencies or dependencies
    [pkg.dependencies || {}, pkg.devDependencies || {}].forEach((o) => {
      Object.keys(o).forEach((dep) => {
        if (!dep.includes(thisPkg.name)) {
          const { keywords, ncurc } = require(join(base, 'node_modules', dep, 'package.json')); // eslint-disable-line
          let ncu = ncurc;
          if (!ncu && dep.includes('ncu') && keywords && keywords.indexOf(thisPkg.name) !== -1) {
            if (existsSync(join(base, 'node_modules', dep))) {
              try {
                ncu = require(join(base, 'node_modules', dep)); // eslint-disable-line global-require
              } catch (e) {
                console.log(`[Warning]: ${dep} cannot find ncu configuration`); // eslint-disable-line no-console
              }
            }
          }
          if (ncu) {
            console.log(`Auto configuration with ${dep}`); // eslint-disable-line no-console
            const { reject: autoconfReject, autoconfRest } = ncu || {}; // eslint-disable-line global-require
            autoconf.reject = [...new Set([
              ...(autoconf.reject || []),
              ...(autoconfReject || []),
            ])];

            Object.assign(autoconf, autoconfRest);
          }
        }
      });
    });
  }
  return autoconf;
}

const defaultOptions = {
  disableAutoConf: false,
};

/**
 * @public
 * @description
 * Create npm check updates configuration
 *
 * Read https://www.npmjs.com/package/npm-check-updates if you don't know what it is.
 *
 * Usually, you run updates as follow:
 *
 * For testing:
 *
 * ```bash
 * $ npx ncu
 * ```
 *
 * Writing to `package.json`:
 *
 * ```bash
 * $ npx ncu -u
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
 * - **Local extension**: In your `package.json` we read `ncurc` within a rollup-umd project to inject ncu configuration per project
 * - **Dependency extension**: Use a dependency extension within a rollup-umd project to manage ncu configuration across a set of projects.
 *
 * ## Local extension
 *
 * Simply add `ncurc` in your `package.json`:
 *
 * ```diff
 * + "ncurc": {
 * +   "reject": [
 * +     "react-styleguidist"
 * +   ]
 * + }
 * ```
 *
 * This will for example add `react-styleguidist` to the ignored package when doing `npx ncu -u` in your project.
 *
 * ## Dependency extension
 *
 * This is a dependency listed in your `package.json`.
 *
 * To create a dependency extension, all you need is to publish a npm package with the following requirements:
 *
 * - A `ncurc` key containing the configuration in the `package.json` (as the previous example)
 *
 * **Or** if it only serve a ncu configuration:
 *
 * - The ncu configuration as default exports **AND** `ncu` in your package name, it will be merge with ours.
 *
 * ```js static
 * export default {
 *   reject: ['react-styleguidist'],
 * };
 * ```
 *
 * These a required **keywords** that **MUST** be set in your `package.json` in order to be detected by the auto configuration:
 *
 * - The `keywords` of your dependency must have: `ncu`.
 * - The `keywords` of your dependency must have this package name: `$PACKAGE_NAME`
 *
 * ```diff
 *  "keywords": [
 * +   "ncu",
 * +   "$PACKAGE_NAME",
 * ],
 * ```
 *
 * Dependency extension will be read by `createConfig` and logging will appear for each detection.
 *
 * @param {object} [config={}] - local ncu configuration, if you want something
 * @param {object} [options={}] - options of create config
 * @param {boolean} [options.disableAutoConfig=false] - Disable auto configuration from extensions modules
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

  // allow config from extension in package.json
  const { reject: userExtReject, ...restUserExtConfig } = pkg.ncurc || {}; // eslint-disable-line global-require

  // just for generating it's own documentation, we need it.
  const thisPkgPath = join(__dirname, '../package.json');
  const thisPkg = existsSync(thisPkgPath) ? require(thisPkgPath) : {}; // eslint-disable-line global-require

  // allow config from extension module
  const { reject: autoConfigReject, ...restAutoConfig } = autoconfig(opts, pkg, thisPkg, base);

  const reject = [...new Set([
    ...(userReject || []),
    ...(userExtReject || []),
    ...(autoConfigReject || []),
  ])];

  if (reject.length) {
    console.log(`Rejected: ${reject.join(', ')} will be ignored by npm-check-updates.`); // eslint-disable-line no-console
  }
  return {
    // upgrade: true, // stop due to https://github.com/tjunnone/npm-check-updates/issues/481#issuecomment-469081174
    reject,
    ...Object.assign(
      {},
      restUserConfig,
      restUserExtConfig,
      restAutoConfig
    ),
  };
}
