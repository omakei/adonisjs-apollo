import { configProvider } from '@adonisjs/core'
import { Container } from '@adonisjs/core/container'
import { ConfigProvider, ContainerBindings } from '@adonisjs/core/types'
import { ApolloServerOptions } from '@apollo/server'
import { ApolloConfig } from './types.js'

export function defineConfig(
  config: ApolloConfig,
  options: {
    ioc: Container<ContainerBindings>
    fallbackUrl?: string
  }
): ConfigProvider<ApolloConfig> {
  return configProvider.create(async () => {
    return {
      ...config,
      apolloServer: {
        ...config.apolloServer,
        formatError:
          typeof config.apolloServer?.formatError === 'string'
            ? makeFormatter(options.ioc, config.apolloServer.formatError)
            : config.apolloServer?.formatError,
      },
    }
  })
}

function makeFormatter(
  ioc: Container<ContainerBindings>,
  formatterPath: string
): ApolloServerOptions<any>['formatError'] {
  const formatter = ioc.make(formatterPath)
  //@ts-ignore
  return formatter?.formatError?.bind(formatter)
}
