Create at the root of your project `.ncurc.js`:

```js static
const { createConfig } = require('$PACKAGE_NAME');
module.exports = createConfig();
```

Add to `.npmignore`:

```diff
+ .ncurc.js
```

Run the upgrade within a project:

```bash
# test
$ npx ncu
# write change
$ npx ncu -a
```
