import assert from 'node:assert'

import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeResolvers } from '@graphql-tools/merge'
import { ContainerBindings } from '@adonisjs/core/types'
import { Container } from '@adonisjs/core/container'

type UnknownConstructor = new (...args: unknown[]) => unknown

const antiClashSuffix = 'Resolvers'

export function loadResolvers(resolversPaths: string[], container: Container<ContainerBindings>) {
  const resolverModules = resolversPaths.flatMap((resolversPath) =>
    loadFilesSync(resolversPath, { recursive: false })
  )
  const resolversPartials = resolverModules.map((resolverModule) =>
    makeResolversPartial(resolverModule, container)
  )

  return mergeResolvers(resolversPartials)
}

function makeResolversPartial(
  resolverModule: Record<string, unknown>,
  container: Container<ContainerBindings>
) {
  return Object.fromEntries(
    Object.entries(resolverModule)
      .filter(
        ([, value]) => (typeof value === 'object' && value !== null) || typeof value === 'function'
      )
      .map(([key, value]) => {
        if (key.endsWith(antiClashSuffix) && key !== antiClashSuffix) {
          key = key.slice(0, -antiClashSuffix.length)
        }
        if (typeof value === 'object' && value !== null) {
          return [key, value]
        } else {
          assert(typeof value === 'function')
          return [key, mapResolverClass(value as UnknownConstructor, container)]
        }
      })
  )
}

function mapResolverClass(value: UnknownConstructor, container: Container<ContainerBindings>) {
  const instance = container.make(value)
  const prototype = Object.getPrototypeOf(instance)
  return Object.fromEntries(
    Object.entries(Object.getOwnPropertyDescriptors(prototype))
      .filter(([name, desc]) => name !== 'constructor' && typeof desc.value === 'function')
      .map(([name, desc]) => [name, desc.value.bind(instance)])
  )
}
