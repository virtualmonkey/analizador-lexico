import uniq from 'lodash/uniq.js';
import { constants } from './constants.js';
import { CHR } from '../LexicalAnalizer/LexicalAnalizer.js'

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
      initialState: "s"+transition[0],
      symbol: transition[1],
      finalState: "s"+transition[2]
    }
  });

  const acceptanceStates = uniq(startEndNodes.map(startEndNode => "s"+startEndNode[1]));

  return {
    automata,
    acceptanceStates
  }
}

function convertAddedStrings(tokenValue){
  let newTokenValue = tokenValue.replaceAll(CHR(34), constants.POSITIVE_CLOSURE);
  return newTokenValue;
}

function convertOr(tokenValue){
  let newTokenvalue = tokenValue.replaceAll(constants.OR, constants.OR_s);
  return newTokenvalue;
}

function convertConcat(tokenValue){
  let newTokenvalue = tokenValue.replaceAll(constants.CONCAT, constants.CONCAT_s);
  return newTokenvalue;
}

function convertParenthesis(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll(constants.OPEN_PARENTHESIS, constants.OPEN_PARENTHESIS_s);
  newTokenValue = newTokenValue.replaceAll(constants.CLOSING_PARENTHESIS, constants.CLOSING_PARENTHESIS_s);
  return newTokenValue;
}

function convertKleenClosure(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll(constants.OPEN_CURLY, constants.KLEEN_CLOSURE_OPEN_s);
  newTokenValue = newTokenValue.replaceAll(constants.CLOSING_CURLY, constants.KLEEN_CLOSURE_CLOSE_s);
  return newTokenValue;
}

function clearDuplicatedOperators(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll(CHR(43)+CHR(43)+CHR(43), `&+`);
  newTokenValue = newTokenValue.replaceAll(CHR(43)+CHR(43), `&+`);
  newTokenValue = newTokenValue.replaceAll(CHR(40)+CHR(40), `&((`)
  return newTokenValue;
}

function cleanFinalString(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll(CHR(34)+CHR(40)+CHR(34), `"&("`);
  newTokenValue = newTokenValue.replaceAll(CHR(38)+CHR(43), constants.POSITIVE_CLOSURE);
  return newTokenValue;
}

function handleForwardSlash(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll("/", `+"&"+`);
  newTokenValue = newTokenValue.replaceAll(`"&"++`, ``);
  newTokenValue = newTokenValue.replaceAll(`+`, ` + `);
  return newTokenValue;
}

function addConcatBetweenGroupedTerms(tokenValue){
  let newTokenValue = "";
  newTokenValue = tokenValue.replaceAll(CHR(41)+CHR(42)+CHR(41), ")*)&");
  return newTokenValue;
}

export const functions = {
  simplifyArray,
  prepareAutomatForGraphic,
  convertAddedStrings,
  convertOr,
  convertConcat,
  convertParenthesis,
  convertKleenClosure,
  clearDuplicatedOperators,
  cleanFinalString,
  handleForwardSlash,
  addConcatBetweenGroupedTerms,
}