import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from 'nuqs/server'

export const deliverableSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  q: parseAsString.withDefault(''),
  status: parseAsString.withDefault('all'),
  type: parseAsString.withDefault('all'),
  client: parseAsString,
}

export const deliverableSearchParamsCache = createSearchParamsCache(deliverableSearchParams)
export const serializeDeliverableSearchParams = createSerializer(deliverableSearchParams)
