import { setValue } from '../util/objectFunc.js'

export function vmodel(vm, elm, data) {
  elm.oninput = () => {
    setValue(vm._data, data, elm.value);
  }
}