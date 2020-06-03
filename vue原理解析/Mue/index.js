import Mue from './core/instance/index.js'

window.vm = new Mue({
  el: '#app',
  data: {
    msg: 'hello Mue',
    author: 'Ma',
    a: {
      b: 1,
      c: 2
    },
    arr: [
      1,1,1
    ]
  }
})