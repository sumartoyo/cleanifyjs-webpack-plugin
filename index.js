// some codes are copied from uglifyjs-webpack-plugin

const ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers')
const RawSource = require('webpack-sources').RawSource
const acorn = require('acorn')

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

const cleanify = (source) => {
  const comments = []
  const strings = []
  const ast = acorn.parse(source, {
    onComment: (block, text, start, end) => {
      comments.push(start)
      comments.push(end)
    },
    onToken: (token) => {
      switch (token.type.label) {
        case 'string':
        case 'regexp':
          strings.push(token.start)
          strings.push(token.end)
          break
        case 'template':
          strings.push(token.start-1)
          strings.push(token.end+1)
          break
      }
    }
  })

  let result = ''
  if (comments.length === 0 && strings.length === 0) {
    result = source
  } else {
    let skipWhiteSpace = 2 // 0: don't skip, 1: but don't skip new lines, 2: also skip new lines
    let char = null
    let idx = 0
    while (idx < source.length) {
      char = source[idx]

      // skip comments
      if (idx === comments[0]) {
        comments.shift()
        idx = comments[0]
        comments.shift()
        continue
      }

      // as-is for strings
      if (idx === strings[0]) {
        strings.shift()
        while (idx < strings[0]) {
          char = source[idx]
          result += char
          idx++
        }
        strings.shift()
        continue
      }

      // skip white spaces
      if (skipWhiteSpace > 0) {
        const includeNewLine = skipWhiteSpace === 2 && char.charCodeAt(0) < 33
        const spacesOnly = skipWhiteSpace === 1 && char.charCodeAt(0) < 33 && char !== '\r' && char !== '\n'
        if (includeNewLine || spacesOnly) {
          idx++
          continue
        } else {
          skipWhiteSpace = 0
        }
      }

      switch (char) {
        // when see new line, skip white spaces next
        case '\r':
        case '\n':
          result += '\n'
          skipWhiteSpace = 2
          idx++
          continue

        // when see space, look forward
        case ' ':
        case '\t':
          idx++
          char = source[idx]
          while (idx < source.length && char.charCodeAt(0) < 33 && char !== '\r' && char !== '\n') {
            idx++
            char = source[idx]
          }
          if (!isSymbol(char)) {
            result += ' ' + char
            idx++
          }
          continue
      }

      // when see a symbol, skip white spaces next
      if (isSymbol(char)) {
        skipWhiteSpace = 1
      }

      // normal case
      result += char
      idx++
    }

    if (skipWhiteSpace < 2) {
      result += '\n' // ensure new line ending
    }
  }

  return result
}

const isSymbol = (char) => {
  switch (char) {
    case '(':
    case ')':
    case '{':
    case '[':
    case ']':
    case '}':
    case '!':
    case '@':
    case '#':
    case '$':
    case '%':
    case '^':
    case '&':
    case '*':
    case '-':
    case '=':
    case '+':
    case '\\':
    case '|':
    case ';':
    case ':':
    case "'":
    case '"':
    case ',':
    case '<':
    case '.':
    case '>':
    case '/':
    case '?':
      return true
  }
  return false
}

if (process.env.NODE_ENV === 'test') {
  CleanifyJsPlugin.cleanify = cleanify
}

module.exports = CleanifyJsPlugin
