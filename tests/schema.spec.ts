import path from 'node:path'
import { test } from '@japa/runner'
import { Logger } from '@adonisjs/core/logger'
import { Kind } from 'graphql'
import { getTypeDefsAndResolvers, printWarnings } from '../src/schema.js'
import app from '@adonisjs/core/services/app'

import { fileURLToPath } from 'node:url'

test.group('getTypeDefsAndResolvers', () => {
  const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), './helpers')
  const result = getTypeDefsAndResolvers(
    [path.join(fixture, 'schemas')],
    [path.join(fixture, 'resolvers')],
    app.container
  )

  test('should merge schemas', ({ expect }) => {
    // Query, Mutation
    expect(
      result.typeDefs.definitions.filter(
        (def: { kind: Kind }) => def.kind === Kind.OBJECT_TYPE_DEFINITION
      )
    ).toHaveLength(3)

    // URL, Bad, OtherBad
    expect(
      result.typeDefs.definitions.filter(
        (def: { kind: Kind }) => def.kind === Kind.SCALAR_TYPE_DEFINITION
      )
    ).toHaveLength(3)
  })

  test('should merge resolvers', ({ expect }) => {
    expect(Object.keys(result.resolvers)).toStrictEqual(['Query', 'Mutation', 'D', 'URL'])
  })

  test('should warn about missing resolvers', ({ expect }) => {
    expect(result.warnings.missingQuery).toStrictEqual(['queryB', 'queryC'])
    expect(result.warnings.missingMutation).toStrictEqual(['mutationB', 'mutationC'])
    expect(result.warnings.missingScalars).toStrictEqual(['Bad', 'OtherBad'])
  })
})

test.group('printWarnings', () => {
  test('should print warnings using the logger', ({ expect }) => {
    const logger = getFakeLogger()
    printWarnings(
      {
        missingMutation: ['A', 'B'],
        missingQuery: ['X', 'Y'],
        missingScalars: ['S', 'T'],
      },
      logger
    )
    // expect(logger.logs[0].msg).toBe('GraphQL Query resolver missing for fields: X, Y')
    // expect(logger.logs[1].msg).toBe('GraphQL Mutation resolver missing for fields: A, B')
    // expect(logger.logs[2].msg).toBe(
    //   'GraphQL scalar types defined in schema but not in resolvers: S, T'
    // )
  })

  test('should print nothing if there are no warnings', ({ expect }) => {
    const logger = getFakeLogger()
    printWarnings({ missingMutation: [], missingQuery: [], missingScalars: [] }, logger)
    // expect(logger.logs).toHaveLength(0)
  })
})

function getFakeLogger() {
  return new Logger({ enabled: true, level: 'trace', name: 'fake-logger' })
}
