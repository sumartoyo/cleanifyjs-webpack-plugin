// some codes are copied from uglifyjs-webpack-plugin

const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')
const RawSource = require('webpack-sources').RawSource
const cleanify = require('./cleanify')

class CleanifyJsPlugin {
  constructor(options) {
    if (typeof options !== 'object' || Array.isArray(options)) options = {}
    if (typeof options.compressor !== 'undefined') options.compress = options.compressor
    this.options = options
  }

  apply(compiler) {
    const options = this.options
    options.test = options.test || /\.js($|\?)/i

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        const files = []
        chunks.forEach((chunk) => files.push.apply(files, chunk.files))
        files.push.apply(files, compilation.additionalChunkAssets)
        const filteredFiles = files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options))
        filteredFiles.forEach((file) => {
          try {
            console.log('CleanifyJs', file)
            const asset = compilation.assets[file]
            const result = cleanify(asset.source())
            const outputSource = new RawSource(result)
            compilation.assets[file] = outputSource
          } catch (err) {
            if (err.msg) {
              compilation.errors.push(new Error(file + ' from CleanifyJs\n' + err.msg))
            } else {
              compilation.errors.push(new Error(file + ' from CleanifyJs\n' + err.stack))
            }
          }
        })
        callback()
      })
    })
  }
}

module.exports = CleanifyJsPlugin
