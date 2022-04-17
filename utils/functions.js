function simplifyArray (expression, array){
  const simplifiedArray = [];

  for (const node of expression) {
    if (node instanceof Array) {
      simplifyArray(node, array);
    } else {
      array.push(node);
    }
  }

  for (let i = 0; i < array.length; i+=3) {
    if (i !== array.length) {
      simplifiedArray.push([array[i], array[i + 1], array[i + 2]]);
    }
  }

  return simplifiedArray;
}

export const functions = {
  simplifyArray,
}