import * as fs from 'fs';
import trim from 'lodash/trim.js'
import reverse from 'lodash/reverse.js';

import DFA from './DFA/DFA.js';

export function readTestFile(testFileRelativePath){
  const testFileLines = [];

  const readFile = fs.readFileSync(testFileRelativePath, "utf-8");

  readFile.split(/\r?\n/).forEach(line =>  {
    if (trim(line).length !== 0){
      testFileLines.push(trim(line).replaceAll("\t", "→"));
    }
  });

  return testFileLines;
}

export function generateScannerOutput(fileName, specialCharacters, keywords, tokenNames, tokenValues, testFileLines){
  const stringToEvaluate = testFileLines[0];
  const reversedTokenValues = reverse(tokenValues);
  const reversedTokenNames = reverse(tokenNames);

  //console.log("stringToEvaluate -> ", stringToEvaluate)

  const output = [];
  let stringWithIdentifiedSpecialChars = "";

  if (specialCharacters.length !== 0){
    for (let character of stringToEvaluate){
      let temp = "";
      if (specialCharacters.includes(character)){
        temp += `@${character}@`;
        stringWithIdentifiedSpecialChars += temp;
      } else {
        stringWithIdentifiedSpecialChars += character
      }
    }
  }
  //console.log("stringWithIdentifiedSpecialChars BEFORE if-> ", stringWithIdentifiedSpecialChars)

  // If we got a kewyord that's only one value (space, tab, etc)
  if (keywords.map(keyword => keyword.keywordValue.length).includes(1)){
    console.log("Entré")
    let currentStringWithIdentifiedSpecialChars = "";
    if (stringWithIdentifiedSpecialChars !== ""){
      currentStringWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars;
    } else {
      currentStringWithIdentifiedSpecialChars = stringToEvaluate;
    }
    
    stringWithIdentifiedSpecialChars = "";
    for (let character of currentStringWithIdentifiedSpecialChars){
      let temp = "";
      if (keywords.map(keyword => keyword.keywordValue).includes(character)){
        //console.log(`entré con character ->${character}<- `)
        temp += `@${character}@`;
        stringWithIdentifiedSpecialChars += temp;
      } else {
        stringWithIdentifiedSpecialChars += character
      }
    }

    console.log("stringWithIdentifiedSpecialChars AFTER if-> ", stringWithIdentifiedSpecialChars);
  }

  let arrayWithIdentifiedSpecialChars = [];

  //console.log("stringWithIdentifiedSpecialChars -> ", stringWithIdentifiedSpecialChars)

  let spaceNotInSpecialCharacters = false;

  if(!specialCharacters.includes(" ") && stringWithIdentifiedSpecialChars !== "" && !keywords.map(keyword => keyword.keywordValue.length).includes(1)){
    stringWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars.replaceAll(" ", "@ @");
    spaceNotInSpecialCharacters = true;
  }

  if (stringWithIdentifiedSpecialChars === ""){
    arrayWithIdentifiedSpecialChars = stringToEvaluate.split(" ")
  } else {
    arrayWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars.split("@");
  }

  //console.log("arrayWithIdentifiedSpecialChars -> ", arrayWithIdentifiedSpecialChars)

  const arrayWithIdentifiedKeywords = arrayWithIdentifiedSpecialChars.map(current => {
    if (keywords.map((keyword) => {
      if (keyword.keywordValue.length > 1) {
        return keyword.keywordValue
      } else {
        return
      }
    }).includes(current)) {
      return `@${current}@`;
    } else {
      return current
    }
  });

  //console.log("arrayWithIdentifiedKeywords -> ", arrayWithIdentifiedKeywords)

  const stringWithIdentifiedKeywords = arrayWithIdentifiedKeywords.join("@");

  //console.log("stringWithIdentifiedKeywords -> ", stringWithIdentifiedKeywords)

  const arrayToAnalize = stringWithIdentifiedKeywords.split("@").filter((possibleToken) => possibleToken !== '')
  console.log("arrayToAnalize -> ", arrayToAnalize);

  for (let i = 0; i<arrayToAnalize.length; i++){
    let wasAnalized = false;

    // Check for keywords
    for (let keyword of keywords){
      if (keyword.keywordValue === arrayToAnalize[i]){
        output.push(keyword.keywordName);
        wasAnalized = true;
        break;
      }
    }

    // Check for tokens
    if (wasAnalized === false){
      let indexOfSuccessToken = 0;
      for (let token of reversedTokenValues){
        const dfaInstance = new DFA();
        const dfa = dfaInstance.getDirectDFA(token);
        const result = dfaInstance.validateString(arrayToAnalize[i]);

        if (result === true){
          indexOfSuccessToken = reversedTokenValues.indexOf(token);
          wasAnalized = true;
          break
        } else {
          wasAnalized = false;
        }
      }
      
      if(wasAnalized) {
        output.push(reversedTokenNames[indexOfSuccessToken])
      } else {
        if (!spaceNotInSpecialCharacters) output.push("Invalid"); 
      }
    }
  }

  return output;
}