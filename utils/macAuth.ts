// import AxiosURLSearchParams from 'axios/lib/helpers/AxiosURLSearchParams.js'
import buildURL from 'axios/unsafe/helpers/buildURL.js'
const auth = require('js-unif-core/lib/auth')
const storage = require('js-unif-core/lib/storage')
const URL = require('js-unif-core/lib/url')
const comUtils = require('js-unif-core/lib/com-utils')

// const { toString } = Object.prototype

// const kindOf = (cache => (thing: any) => {
//   const str = toString.call(thing)
//   return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase())
// })(Object.create(null))

// const kindOfTest = (type: any) => {
//   type = type.toLowerCase()
//   return thing => kindOf(thing) === type
// }
// const isURLSearchParams = kindOfTest('URLSearchParams')

// function buildURL(url: any, params: any, options: any) {
//   /* eslint no-param-reassign:0 */
//   if (!params)
//     return url

//   const _encode = options && options.encode || encode

//   const serializeFn = options && options.serialize

//   let serializedParams

//   if (serializeFn) {
//     serializedParams = serializeFn(params, options)
//   }
//   else {
//     serializedParams = isURLSearchParams(params)
//       ? params.toString()
//       : new AxiosURLSearchParams(params, options).toString(_encode)
//   }

//   if (serializedParams) {
//     const hashmarkIndex = url.indexOf('#')

//     if (hashmarkIndex !== -1)
//       url = url.slice(0, hashmarkIndex)

//     url += (!url.includes('?') ? '?' : '&') + serializedParams
//   }

//   return url
// }

export function getAuthHeader(config: any) {
  const method = config.method
  // const cookie = storage.getCkToken()

  // if (cookie == null || cookie === undefined) {
  //     storage.removeLsToken()
  //     return null
  // }

  const token = storage.getLsToken()
  if (comUtils.isEmpty(token))
    return null

  const requestUrl = getRequestUrl(config)
  const authorization = auth.getAuthHeader(requestUrl, method, token)

  return authorization
}

export function getRequestUrl(config: any) {
  let baseUrl = config.baseURL
  baseUrl = URL.getRequestUrl(baseUrl)

  let url = config.url
  const params = config.params
  const paramsSerializer = config.paramsSerializer

  if (typeof params === 'object' && params)
    url = buildURL(encodeURI(url), params, paramsSerializer)

  const requestUrl = encodeURI(baseUrl) + url
  return requestUrl
}
