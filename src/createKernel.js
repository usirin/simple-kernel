import invariant from 'invariant'
import Promise from 'bluebird'


/**
 * Factory function for creating a kernel.
 *
 * @public
 * @param {Object} options
 * @param {Array<BootstrapperInterface>} options.bootstrappers
 * @returns {SimpleKernelInterface}
 */
export default function createKernel(options = {}) {
  invariant(
    Array.isArray(options.bootstrappers),
    `Expected bootstrappers to be an Array, but got: ${typeof options.bootstrappers}`
  )

  const bootstrappers = [].concat(options.bootstrappers)
  const middlewares = [].concat(options.middlewares || [])

  return {
    /**
     * Returns registered bootstrappers.
     *
     * @public
     * @returns {Array<BootstrapperInterface>}
     */
    getBootstrappers() {
      return bootstrappers
    },

    /**
     * Boots up the kernel by running registered bootstrappers sequentially.
     *
     * @public
     * @returns {Promise}
     */
    boot() {
      return Promise.reduce(bootstrappers, (context, bootstrapper, index) => {
        if (isEmpty(context)) {
          context = undefined
        }

        bootstrapper = applyMiddlewares(bootstrapper, middlewares)

        return bootstrapper.bootstrap(context)
      }, {})
    }
  }
}

/**
 * Apply given middlewares to bootstrapper.
 *
 * @public
 * @param {BootstrapperInterface} bootstrapper
 * @param {Array<MiddlewareInterface>} middlewares
 * @returns {function}
 */
const applyMiddlewares = (bootstrapper, middlewares) => {

  middlewares = middlewares.slice()
  middlewares.reverse()

  let { bootstrap } = bootstrapper

  middlewares.forEach(middleware => {
    bootstrap = middleware(bootstrapper)(bootstrap)
  })

  return Object.assign({}, bootstrapper, { bootstrap })
}

const isEmpty = obj => (
  Object.keys(obj).length === 0 && obj.constructor === Object
)


