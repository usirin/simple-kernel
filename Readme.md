# simple-kernel

Simple runtime for your applications.

### What?

Register bootstrappers then boot them.

```js
import { createKernel } from 'simple-kernel'
import assign from 'lodash.assign'

const provideReactor = {
  bootstrap(context = {}) {
    return assign(context, { reactor: new Nuclear.Reactor })
  }
}

const registerConfigModule = {
  bootstrap(context) {
    // assume that you are registering a nuclear-module.
    ConfigModule(context.reactor)

    // you need to explicitly return new context.
    // return values are important.
    return assign(context, { ConfigModule: true })
  }
}

const kernel = createKernel({
  bootstrappers: [
    provideReactor,
    registerConfigModule
  ]
})

// immutability at its heart.
// each operation will return a new kernel instance,
// so that snapshotting is really easy.
kernel = kernel.boot().then(context => {
  console.log('kernel is booted with context: ', context)
  // => kernel is booted with context: {reactor: reactor<Nuclear.Reactor>, ConfigModule: true}
})
```

# install

    npm install simple-kernel


# licence

MIT
