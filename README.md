This webpack plugin removes comments and unnecessary white spaces from JS codes. It does not add or change anything else. This plugin does not generate source map.

## Usage

```js
const CleanifyJsPlugin = require('cleanifyjs-webpack-plugin')

const myWebpackConfig = {
  entry: [ ... ],
  output: { ... },
  resolve: { ... },
  module: { ... },
  plugins: {
    ...
    new CleanifyJsPlugin(),
    ...
  },
  ...
}
```

### Options

None.

### Test

`npm run test`

## Notes

If you want to reduce the size of your code, [UglifyJS plugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/) is probably what you need. Some notes of this plugin:

* UglifyJS is slower than this plugin and will be much slower if you generate source map. If you really need faster processing time and still want to reduce you code size while maintaining readability without generating source map, this plugin is pretty good for that.

* The produced codes will be larger in size compared to UglifyJS'. It will not differ too much after gzip though.

* New lines are kept but repeating new lines will be removed. Since this plugin does not add anything to your code, it cannot add additional semicolons to concat two lines of codes.
