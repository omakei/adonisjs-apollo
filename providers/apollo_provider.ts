import { ApplicationService } from '@adonisjs/core/types'
import { ApolloConfig } from '../src/types.js'
import { configProvider } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import ApolloServer from '../src/apollo_server.js'

export default class ApolloProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton(ApolloServer, async () => {
      const apolloConfigProvider = this.app.config.get<ApolloConfig>('apollo')
      const config = await configProvider.resolve<ApolloConfig>(this.app, apolloConfigProvider)

      return new ApolloServer(this.app, config as ApolloConfig, logger)
    })
  }
  async boot() {
    this.app.container.resolving(ApolloServer, (apollo) => apollo.start())
  }

  async shutdown() {
    this.app.container.resolving(ApolloServer, (apollo) => apollo.stop())
  }
}
