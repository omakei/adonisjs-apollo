import { assert } from '@japa/assert'
import { configure, processCLIArgs, run } from '@japa/runner'
import { expect } from '@japa/expect'
import { fileSystem } from '@japa/file-system'
import { BASE_URL } from '../tests_helpers/index.js'

processCLIArgs(process.argv.splice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert(), expect(), fileSystem({ basePath: BASE_URL })],
})

run()
