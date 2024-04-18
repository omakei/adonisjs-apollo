import { HttpContext, Router } from '@adonisjs/core/http'
import { StoreRouteMiddleware } from '@adonisjs/core/types/http'
import { ApolloServerOptions, BaseContext } from '@apollo/server'
import {
  ApolloServerPluginLandingPageLocalDefaultOptions,
  ApolloServerPluginLandingPageProductionDefaultOptions,
} from '@apollo/server/plugin/landingPage/default'
import { FileUpload } from 'graphql-upload/GraphQLUpload.mjs'
import { UploadOptions } from 'graphql-upload/processRequest.mjs'
import type { IExecutableSchemaDefinition } from '@graphql-tools/schema'

export type Upload = Promise<FileUpload>

export interface ApolloExceptionFormatter {
  formatError: Exclude<ApolloServerOptions<any>['formatError'], undefined>
}

interface ApolloServer {
  applyMiddleware(): void
  getGraphqlHandler(): Router
  getUploadsMiddleware(): StoreRouteMiddleware
  start(): Promise<void>
  stop(): Promise<void>
}

export type { ApolloServer }
export type { BaseContext } from '@apollo/server'

export interface ContextFnArgs {
  ctx: HttpContext
}

export type ContextFn<ContextType extends BaseContext = BaseContext> = (
  args: ContextFnArgs
) => ContextType | Promise<ContextType>

export interface ApolloConfig {
  /**
   * Path to the directory containing resolvers
   * @default `'app/resolvers'`
   */
  resolvers?: string | string[]

  /**
   * Path to the directory containing schemas
   * @default `'app/schemas'`
   */
  schemas?: string | string[]

  /**
   * Path on which the GraphQL API and playground will be exposed.
   * @default `'/graphql'`
   */
  path?: string

  /**
   * A prefix path or full URL used to construct the graphql endpoint
   * If APP_URL env variable is set, it will be used instead of this value.
   */
  appUrl?: string

  /**
   * Additional config passed to the Apollo Server library.
   */
  apolloServer?: Omit<
    ApolloServerOptions<BaseContext>,
    'schema' | 'resolvers' | 'typeDefs' | 'gateway'
  >

  /**
   * Options passed to the Apollo Server production landing page plugin.
   */
  apolloProductionLandingPageOptions?: ApolloServerPluginLandingPageProductionDefaultOptions

  /**
   * Options passed to the Apollo Server local landing page plugin.
   */
  apolloLocalLandingPageOptions?: ApolloServerPluginLandingPageLocalDefaultOptions
  //@ts-ignore
  context?: ContextFn<any>

  /**
   * Whether file upload processing is enabled.
   * @default true
   */
  enableUploads?: boolean

  /**
   * If file upload is enabled, options passed to `graphql-upload`.
   */
  uploadOptions?: UploadOptions

  /**
   * Additional config passed to the `makeExecutableSchema` function from `@graphql-tools/schema`.
   */
  executableSchema?: Omit<IExecutableSchemaDefinition, 'typeDefs' | 'resolvers'>
}

export type ApolloServerUserOptions<ContextType extends BaseContext> = Omit<
  ApolloServerOptions<ContextType>,
  'formatError'
> & {
  formatError?: ApolloServerOptions<ContextType>['formatError'] | string
}
export type ApolloUserConfig<ContextType extends BaseContext> = Omit<
  ApolloConfig,
  'apolloServer'
> & {
  apolloServer: ApolloServerUserOptions<ContextType>
}
