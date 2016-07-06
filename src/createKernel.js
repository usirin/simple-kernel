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
        return bootstrapper.bootstrap(context)
      }, {})
    }
  }
}

