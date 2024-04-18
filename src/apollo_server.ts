import path from 'node:path'

import { ApolloServer as ApolloServerBase, type BaseContext } from '@apollo/server'
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import { makeExecutableSchema } from '@graphql-tools/schema'
import processRequest, { UploadOptions } from 'graphql-upload/processRequest.mjs'
import app from '@adonisjs/core/services/app'

import { graphqlAdonis } from './adonis_graphql.js'
import { getTypeDefsAndResolvers, printWarnings } from './schema.js'
import { Logger } from '@adonisjs/core/logger'
import { HttpContext } from '@adonisjs/core/http'
import { ApolloConfig, ContextFn } from './types.js'

const defaultContextFn: ContextFn = () => ({})

export default class ApolloServer<ContextType extends BaseContext = BaseContext> {
  private $apolloServer: ApolloServerBase<ContextType>
  private $contextFunction: ContextFn<ContextType>

  private $app: typeof app

  private $path: string

  private $enableUploads: boolean
  private $uploadOptions?: UploadOptions

  constructor(application: typeof app, config: ApolloConfig, logger: Logger) {
    const {
      path: graphQLPath = '/graphql',
      schemas: schemasPath = 'app/schemas',
      resolvers: resolversPath = 'app/resolvers',
      apolloServer = {},
      apolloProductionLandingPageOptions,
      apolloLocalLandingPageOptions,
      context = defaultContextFn as ContextFn<ContextType>,
      executableSchema = {},
      enableUploads = false,
      uploadOptions,
    } = config

    this.$app = application

    this.$path = graphQLPath

    this.$enableUploads = enableUploads
    this.$uploadOptions = uploadOptions

    this.$contextFunction = context

    const schemasPaths: string[] = Array.isArray(schemasPath) ? schemasPath : [schemasPath]
    const resolversPaths: string[] = Array.isArray(resolversPath) ? resolversPath : [resolversPath]

    const { typeDefs, resolvers, warnings } = getTypeDefsAndResolvers(
      schemasPaths.map((schemaPath) => path.join(application.makePath(''), schemaPath)),
      resolversPaths.map((resolverPath) => path.join(application.makePath(''), resolverPath)),
      this.$app.container
    )

    if (application.inDev) {
      printWarnings(warnings, logger)
    }

    this.$apolloServer = new ApolloServerBase<ContextType>({
      schema: makeExecutableSchema({
        ...executableSchema,
        typeDefs,
        resolvers,
      }),
      plugins: [
        this.$app.nodeEnvironment === 'production'
          ? // eslint-disable-next-line new-cap
            ApolloServerPluginLandingPageProductionDefault({
              footer: false,
              ...apolloProductionLandingPageOptions,
            })
          : // eslint-disable-next-line new-cap
            ApolloServerPluginLandingPageLocalDefault({
              footer: false,
              ...apolloLocalLandingPageOptions,
            }),
      ],
      ...apolloServer,
    })
  }

  applyMiddleware(): void {
    this.$app.container.resolving('router', (router) => {
      router.get(this.$path, this.getGraphqlHandler())
      const postRoute = router.post(this.$path, this.getGraphqlHandler())
      if (this.$enableUploads) {
        postRoute.middleware(this.getUploadsMiddleware())
      }
    })
  }

  getGraphqlHandler() {
    return async (ctx: HttpContext) => {
      return graphqlAdonis(this.$apolloServer, this.$contextFunction, ctx)
    }
  }

  getUploadsMiddleware() {
    return async (ctx: HttpContext, next: () => void) => {
      if (ctx.request.is(['multipart/form-data'])) {
        const processed = await processRequest(
          ctx.request.request,
          ctx.response.response,
          this.$uploadOptions
        )
        ctx.request.setInitialBody(processed)
      }
      return next()
    }
  }

  start() {
    return this.$apolloServer.start()
  }

  stop() {
    return this.$apolloServer.stop()
  }
}
