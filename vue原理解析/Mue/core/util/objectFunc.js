export function getValue(obj, name) {
  const nameList = name.split('.');
  let temp = obj;
  if (obj) {
    nameList.forEach(name => {
      temp = temp[name];
    });
    return temp;
  } else {
    return obj;
  }
}

export function setValue(obj, name, value) {
  if (!obj) return;
  const nameList = name.split('.');
  const len = nameList.length;
  let temp = obj;
  for (let i = 0; i < nameList.length - 1; i++) {
    const name = nameList[i];
    temp = temp[name];
  }
  if (temp[nameList[len - 1]]) {
    temp[nameList[len - 1]] = value;
  }
}