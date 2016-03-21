import expect from 'expect'
import assign from 'lodash.assign'

import { createKernel } from '../src'
import SimpleKernelInterface from '../src/interfaces/SimpleKernelInterface'

describe('simple-kernel', () => {
  it('requires bootstrappers', () => {
    expect(() => createKernel()).toThrow(/Expected bootstrappers to be an Array/)
  })

  it('should be an instance of SimpleKernelInterface', () => {
    let kernel = createKernel({bootstrappers: []})

    expect(SimpleKernelInterface.isInstance(kernel)).toBe(true)
  })

  it('returns registered bootstrappers', () => {
    let foo = { bootstrap() {return 'foo'} }
    let bar = { bootstrap() {return 'bar'} }

    let kernel = createKernel({bootstrappers: [foo, bar]})

    expect(kernel.getBootstrappers()).toEqual([foo, bar])
  })

  it('runs each registered bootstrapper', (done) => {
    let flags = {}
    let foo = {
      bootstrap() {
        flags.foo = true
      }
    }
    let bar = {
      bootstrap() {
        flags.bar = true
      }
    }

    let kernel = createKernel({
      bootstrappers: [
        foo, bar
      ]
    })

    kernel.boot().then(() => {
      expect(flags).toEqual({
        foo: true,
        bar: true
      })
      done()
    })
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
    }).catch(console.log.bind(console))
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
    })

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
})
