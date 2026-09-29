import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server'
import { getSortingStateParser } from '@/lib/parsers'
import type { ClientWithStats } from '../api/types'

export const clientSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  q: parseAsString.withDefault(''),
  status: parseAsString.withDefault('all'),
  // Must match the client-side parser so the server prefetch and the client
  // query share one cache key — otherwise the prefetch is thrown away.
  sort: getSortingStateParser<ClientWithStats>(),
}

export const clientSearchParamsCache = createSearchParamsCache(clientSearchParams)
export const serializeClientSearchParams = createSerializer(clientSearchParams)
