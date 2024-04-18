import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { Kind } from 'graphql'

import { loadResolvers } from './load_resolvers.js'
import { scalarResolvers } from './scalar_resolvers.js'
import { ContainerBindings } from '@adonisjs/core/types'
import { Container } from '@adonisjs/core/container'
import { Logger } from '@adonisjs/core/logger'

interface SchemaWarnings {
  missingQuery: string[]
  missingMutation: string[]
  missingScalars: string[]
}

export function getTypeDefsAndResolvers(
  schemasPaths: string[],
  resolversPaths: string[],
  container: Container<ContainerBindings>
) {
  const typeDefs = mergeTypeDefs(schemasPaths.flatMap((schemasPath) => loadFilesSync(schemasPath)))

  const resolvers = loadResolvers(resolversPaths, container)

  const warnings: SchemaWarnings = {
    missingQuery: [],
    missingMutation: [],
    missingScalars: [],
  }

  for (const definition of typeDefs.definitions) {
    if (definition.kind === Kind.SCALAR_TYPE_DEFINITION) {
      const scalarName = definition.name.value
      // Automatically add resolvers for known scalar types.
      if (scalarResolvers[scalarName] && !resolvers[scalarName]) {
        resolvers[scalarName] = scalarResolvers[scalarName]
      }

      // Warn about scalar types defined in schema for which we have no resolver.
      if (!resolvers[scalarName]) {
        warnings.missingScalars.push(scalarName)
      }
    } else if (definition.kind === Kind.OBJECT_TYPE_DEFINITION) {
      const objectName = definition.name.value

      if (objectName === 'Query' && definition.fields && resolvers.Query) {
        // Warn about missing Query resolvers.
        for (const queryField of definition.fields) {
          const queryName = queryField.name.value
          // @ts-expect-error Using index signature for validation.
          if (!resolvers.Query[queryName]) {
            warnings.missingQuery.push(queryName)
          }
        }
      } else if (objectName === 'Mutation' && definition.fields && resolvers.Mutation) {
        // Warn about missing Mutation resolvers.
        for (const mutationField of definition.fields) {
          const mutationName = mutationField.name.value
          // @ts-expect-error Using index signature for validation.
          if (!resolvers.Mutation[mutationName]) {
            warnings.missingMutation.push(mutationName)
          }
        }
      }
    }
  }

  return {
    typeDefs,
    resolvers,
    warnings,
  }
}

export function printWarnings(warnings: SchemaWarnings, logger: Logger): void {
  if (warnings.missingQuery.length > 0) {
    logger.error(`GraphQL Query resolver missing for fields: ${warnings.missingQuery.join(', ')}`)
  }
  if (warnings.missingMutation.length > 0) {
    logger.error(
      `GraphQL Mutation resolver missing for fields: ${warnings.missingMutation.join(', ')}`
    )
  }
  if (warnings.missingScalars.length > 0) {
    logger.error(
      `GraphQL scalar types defined in schema but not in resolvers: ${warnings.missingScalars.join(
        ', '
      )}`
    )
  }
}
