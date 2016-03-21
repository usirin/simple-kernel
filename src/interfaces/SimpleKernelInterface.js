import {createInterface} from 'simple-interface'

export default createInterface('SimpleKernelInterface', {
  getBootstrappers: Function,
  boot: Function
})


