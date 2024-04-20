import { test } from '@japa/runner'

import { ApolloConfig, ApolloExceptionFormatter } from '../src/types.js'
import { defineConfig } from '../index.js'
import { setupApp } from '../tests_helpers/index.js'
import { configProvider } from '@adonisjs/core'

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
  test('create apollo configuration, formatError is callback', async ({ expect }) => {
    const config = defineConfig(
      {
        schemas: 'app/schemas',
        resolvers: 'app/resolvers',
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
    const apolloConfig = await configProvider.resolve<ApolloConfig>(app, config)

    expect(apolloConfig).toEqual({
      schemas: 'app/schemas',
      resolvers: 'app/resolvers',
      path: '/graphql',
      apolloServer: {
        introspection: true,
        formatError: expect.any(Function),
      },
    })
  })

  test('create apollo configuration, formatError is an IoC dependency', async ({ expect }) => {
    const config = defineConfig(
      {
        schemas: 'app/schemas',
        resolvers: 'app/resolvers',
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
    const apolloConfig = await configProvider.resolve<ApolloConfig>(app, config)
    expect(apolloConfig).toEqual({
      schemas: 'app/schemas',
      resolvers: 'app/resolvers',
      path: '/graphql',
      apolloServer: {
        introspection: true,
        formatError: expect.any(Function),
      },
    })
    // @ts-expect-error We don't care about the arguments here.
    expect(apolloConfig.apolloServer?.formatError()).toEqual({
      message: 'error',
    })
  })
})
