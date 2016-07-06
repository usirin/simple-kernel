import expect from 'expect'
import assign from 'lodash.assign'

import { createKernel, Interface } from '../src'
import SimpleKernelInterface from '../src/interfaces/SimpleKernelInterface'

describe('simple-kernel', () => {
  afterEach(() => expect.restoreSpies())

  it('requires bootstrappers', () => {
    expect(() => createKernel()).toThrow(/Expected bootstrappers to be an Array/)
  })

  it('should be an instance of SimpleKernelInterface', () => {
    let kernel = createKernel({bootstrappers: []})

    expect(SimpleKernelInterface.isInstance(kernel)).toBe(true)
  })

  it('should export its interface', () => {
    expect(Interface).toBe(SimpleKernelInterface)
  })

  it('returns registered bootstrappers', () => {
    let foo = { bootstrap() {return 'foo'} }
    let bar = { bootstrap() {return 'bar'} }

    let kernel = createKernel({bootstrappers: [foo, bar]})

    expect(kernel.getBootstrappers()).toEqual([foo, bar])
  })

  it('runs each registered bootstrapper', (done) => {
    let foo = {
      bootstrap(context = {}) {
        return Object.assign({}, context, {
          foo: true
        })
      }
    }
    let bar = {
      bootstrap(context = {}) {
        return Object.assign({}, context, {
          bar: true
        })
      }
    }

    let kernel = createKernel({
      bootstrappers: [
        foo, bar
      ]
    })

    kernel.boot().then(res => {
      expect(res).toEqual({
        foo: true,
        bar: true
      })
      done()
    }).catch(console.error.bind(console))
  })

  it('carries over a context', (done) => {
    let foo = {
      bootstrap(context) {
        return assign(context, {foo: true})
      }
    }

    let bar = {
      bootstrap(context) {
        return assign(context, {bar: true})
      }
    }

    let kernel = createKernel({bootstrappers: [foo, bar]})

    kernel.boot().then(result => {
      expect(result).toEqual({
        foo: true,
        bar: true
      })
      done()
    }).catch(done)
  })

  it('can have bootstrapper with default context', (done) => {
    let foo = {
      bootstrap(context = {first: true}) {
        return assign(context, {foo: true})
      }
    }

    let bar = {
      bootstrap(context = {second: true}) {
        return assign(context, {bar: true})
      }
    }

    let kernel = createKernel({bootstrappers: [foo, bar]})

    kernel.boot().then(result => {
      expect(result).toEqual({
        first: true,
        foo: true,
        bar: true
      })
    }).catch(done)

    // each time the first bootstrapper's default context
    // will be injected. order is important.
    kernel = createKernel({bootstrappers: [bar, foo]})

    kernel.boot().then(result => {
      expect(result).toEqual({
        second: true,
        foo: true,
        bar: true
      })
      done()
    })
  })

  it('should handle errors', (done) => {
    let bootstrapper = {
      bootstrap(context = {}) {
        throw new Error('error happened')
      }
    }

    const kernel = createKernel({
      bootstrappers: [bootstrapper]
    })

    kernel.boot().catch(error => {
      expect(error).toBeA(Error)
      expect(error.message).toBe('error happened')
      done()
    })
  })

  describe('async bootstrappers', (done) => {
    it('waits for promise to resolve before switching to next bootstrapper', (done) => {
      const asyncBootstrapper = {
        bootstrap(context = {}) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(Object.assign({}, context, {async: true}))
            }, 10)
          })
        }
      }

      const syncBootstrapper = {
        bootstrap(context = {}) {
          return Object.assign({}, context, {sync: true})
        }
      }

      const kernel = createKernel({
        bootstrappers: [
          syncBootstrapper,
          asyncBootstrapper
        ]
      })

      kernel.boot().then(res => {
        expect(res).toEqual({
          async: true,
          sync: true
        })
        done()
      })
    })

    it('stops execution of bootstrappers when rejected', (done) => {
      const syncBootstrapper = {
        bootstrap(context = {}) {
          return Object.assign({}, context, {sync: true})
        }
      }
      const errorAsync = {
        bootstrap(context = {}) {
          return new Promise((resolve, reject) => {
            reject(new Error(':('))
          })
        }
      }

      const kernel = createKernel({
        bootstrappers: [
          errorAsync,
          syncBootstrapper
        ]
      })

      kernel.boot().catch(err => {
        expect(err.message).toBe(':(')
        done()
      })
    })

    it('works with default contexts', () => {

      const first = {
        bootstrap(context = {firstDefault: true}) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(Object.assign({}, context, {first: true}))
            }, 10)
          })
        }
      }

      const second = {
        bootstrap(context = {secondDefault: true}) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(Object.assign({}, context, {second: true}))
            }, 10)
          })
        }
      }

      const kernel = createKernel({
        bootstrappers: [first, second]
      })

      kernel.boot().then(res => {
        expect(res).toEqual({
          firstDefault: true, // initial bootsrapper called with undefined
          first: true, // regular bootstrap call
          second: true, // regular bootstrap call
        })
      })
    })
  })

  describe('middleware support', () => {

    it('has middleware support for extending functionality of bootstrap methods', (done) => {
      const logger = bootstrapper => next => context => {
        console.info(`running bootstrapper(${bootstrapper.name})`)
        const newContext = next(context)
        console.info(`final context: ${JSON.stringify(newContext)}`)
        return newContext
      }

      const bootstrapper = {
        name: 'foo',
        bootstrap(context = {}) {
          return Object.assign({}, context, {foo: true})
        }
      }

      let spy = expect.spyOn(console, 'info')

      createKernel({
        middlewares: [logger],
        bootstrappers: [bootstrapper]
      }).boot().then(context => {
        const args = extractArgs(spy)
        expect(args).toInclude(`running bootstrapper(foo)`)
        expect(args).toInclude(`final context: {"foo":true}`)
        expect(context).toEqual({ foo: true })
        done()
      })
    })

  })
})

const extractArgs = spy => spy.calls.map(c => c.arguments).reduce((args, arg) => args.concat(arg))
