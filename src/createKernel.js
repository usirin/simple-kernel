import invariant from 'invariant'
import {waterfall} from 'async'

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
      // transform bootstrappers so that it can be executed as async-waterfall
      // tasks.
      let asyncified = asyncify(bootstrappers)

      return new Promise((resolve, reject) => {

        // this is gonna run registered bootstrappers sequentially and it will
        // return the result of the last bootstrapper.
        waterfall(asyncified, (err, finalContext) => {
          if (err) {
            reject(err)
          } else {
            resolve(finalContext)
          }
        })
      })
    }
  }
}

/**
 * Helper for turning bootstrappers collection to functions that are compatible
 * with async-waterfall.
 *
 * @private
 * @param {Array<BootstrapperInterface>} bootstrappers
 * @returns {Array<Function>}
 */
function asyncify(bootstrappers) {
  return bootstrappers.map(bootstrapper => {
    return (context, callback) => {
      // async/waterfall doesn't pass initial context
      if ('function' === typeof context) {
        callback = context
        // this way bootstrappers can inject their default values and the first
        // bootstrapper's default context will be used as inital context and
        // the first bootstrapper's default context will be used as inital
        // context.
        context = undefined
      }
      const newContext = bootstrapper.bootstrap(context)

      callback(null, newContext)
    }
  })
}
