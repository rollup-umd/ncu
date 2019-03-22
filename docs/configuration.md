Create at the root of your project `.ncurc.js`:

```js static
const { createConfig } = require('$PACKAGE_NAME');
module.exports = createConfig();
```

Add to `.npmignore`:

```diff
+ .ncurc.js
```

## Run dependencies upgrade within a project

**Test**

```bash
$ npx ncu
```

**Write to `package.json` the upgrade of `dependencies` and `devDependencies`**

```bash
$ npx ncu --dep prod,dev
```

**Write to `package.json` the upgrade of `dependencies`, `devDependencies`, `peerDependencies` and `optionalDependencies`**

```bash
$ npx ncu -u
```
