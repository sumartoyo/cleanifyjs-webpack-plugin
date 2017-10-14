process.env.NODE_ENV = 'test'

const fs = require('fs')
const path = require('path')
const cleanify = require('../cleanify')

const cases = [
  'webpack'
]

/* run tests */

let success = true

cases.forEach((folder) => {
  try {
    const source = fs.readFileSync(
      path.resolve(__dirname, folder, 'source.js'),
      { encoding: 'utf-8' }
    )
    const result = fs.readFileSync(
      path.resolve(__dirname, folder, 'result.js'),
      { encoding: 'utf-8' }
    )

    if (cleanify(source) === result) {
      console.log(`SUCCESS test "${folder}"`)
    } else {
      throw new Error('different result')
    }
  } catch (err) {
    success = false
    console.log(
      `FAIL test "${folder}":`,
      err.message ? err.message : err
    )
  }
})

if (!success) {
  process.exit(1)
}
