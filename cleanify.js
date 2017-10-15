const acorn = require('acorn')

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

  // change comments with white space first
  if (comments.length === 0) {
    result = source
  } else {
    let idx = 0
    while (idx < source.length && comments.length > 0) {
      while (idx < comments[0]) {
        result += source[idx]
        idx++
      }
      comments.shift()
      while (idx < comments[0]) {
        result += ' '
        idx++
      }
      comments.shift()
    }
    while (idx < source.length) {
      result += source[idx]
      idx++
    }
  }

  source = result
  result = ''

  let skipWhiteSpace = 2 // 0: don't skip, 1: but don't skip new lines, 2: also skip new lines
  let char = null
  let idx = 0

  while (idx < source.length) {
    char = source[idx]

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
      const includeNewLine = skipWhiteSpace === 2
        && char.charCodeAt(0) < 33
      const spacesOnly = skipWhiteSpace === 1
        && char.charCodeAt(0) < 33
        && char !== '\r'
        && char !== '\n'
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
        while (idx < source.length
          && char.charCodeAt(0) < 33
          && char !== '\r'
          && char !== '\n'
        ) {
          idx++
          char = source[idx]
        }
        if (idx < source.length) {
          if (!isSymbol(char)) {
            result += ' ' + char
            idx++
          }
        }
        continue

      // if see semicolon, skip if next is new line or right brace
      case ';':
        idx++
        char = source[idx]
        while (idx < source.length
          && char.charCodeAt(0) < 33
          && char !== '\r'
          && char !== '\n'
          && char !== ';'
        ) {
          idx++
          char = source[idx]
        }
        if (idx < source.length) {
          if (char !== '\r' && char !== '\n' && char !== '}') {
            result += ';' + char
            idx++
          } else {
            if (char === '\r' || char === '\n') {
              // wait, is it followed with self invoking function?
              localIdx = idx + 1
              char = source[localIdx]
              while (localIdx < source.length && char.charCodeAt(0) < 33) {
                localIdx++
                char = source[localIdx]
              }
              if (char === '(') {
                result += ';\n' + char
                idx = localIdx + 1
                skipWhiteSpace = 1
              }
            }
          }
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

module.exports = cleanify
