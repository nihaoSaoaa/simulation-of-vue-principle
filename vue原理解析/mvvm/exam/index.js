import { MVVM } from '../src/mvvm.js'

const vm = new MVVM({
  el: '#app',
  data: {
    msg: 'hello MVVM !',
  },
  methods: {
    handleClick(e) {
      this.msg = 'hello MVVM !'
    }
  }
})

console.log(vm);