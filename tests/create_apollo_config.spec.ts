import { test } from '@japa/runner'

import { ApolloExceptionFormatter } from '../src/types.js'
import { defineConfig } from '../index.js'
import { setupApp } from '../tests_helpers/index.js'

class Formatter implements ApolloExceptionFormatter {
  formatError() {
    return {
      message: 'error',
    }
  }
}
const { app } = await setupApp()
app.container.singleton(Formatter, () => new Formatter())

test.group('apollo config', () => {
  test('create apollo configuration, formatError is callback', ({ expect }) => {
    const config = defineConfig(
      {
        schemas: 'app/Schemas',
        resolvers: 'app/Resolvers',
        path: '/graphql',
        apolloServer: {
          introspection: true,
          formatError: () => ({ message: 'error' }),
        },
      },
      {
        ioc: app.container,
        fallbackUrl: 'http://localhost:3333',
      }
    )
    expect(config).toEqual({
      schemas: 'app/Schemas',
      resolvers: 'app/Resolvers',
      path: '/graphql',
      apolloServer: {
        introspection: true,
        formatError: expect.any(Function),
      },
    })
  })

  test('create apollo configuration, formatError is an IoC dependency', ({ expect }) => {
    const config = defineConfig(
      {
        schemas: 'app/Schemas',
        resolvers: 'app/Resolvers',
        path: '/graphql',
        apolloServer: {
          introspection: true,
          formatError: () => ({ message: 'error' }),
        },
      },
      {
        ioc: app.container,
        fallbackUrl: 'http://localhost:3333',
      }
    )
    expect(config).toEqual({
      schemas: 'app/Schemas',
      resolvers: 'app/Resolvers',
      path: '/graphql',
      apolloServer: {
        introspection: true,
        formatError: expect.any(Function),
      },
    })
    // @ts-expect-error We don't care about the arguments here.
    expect(config.apolloServer?.formatError()).toEqual({
      message: 'error',
    })
  })
})
