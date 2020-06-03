function initStore() {
  const options = this.$options;
  if (options.store) {
    this.$store = options.store;
  } else {
    if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store;
    }
  }
}

export default function (Vue) {
  Vue.mixin({
    beforeCreate: initStore ,
  })
}