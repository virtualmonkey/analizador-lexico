import uniq from 'lodash/uniq.js';

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

function prepareAutomatForGraphic(transitions, startEndNodes){
  const automata = transitions.map((transition) => {
    return {
      initialState: transition[0],
      symbol: transition[1],
      finalState: transition[2]
    }
  });

  const acceptanceStates = uniq(startEndNodes.map(startEndNode => startEndNode[1]));

  return {
    automata,
    acceptanceStates
  }
}

export const functions = {
  simplifyArray,
  prepareAutomatForGraphic
}