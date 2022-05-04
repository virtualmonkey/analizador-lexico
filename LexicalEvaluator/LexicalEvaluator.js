import * as fs from 'fs';
import trim from 'lodash/trim.js'
import DFA from '../DFA/DFA.js';

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

export function generateEvaluatorOutput(fileName, specialCharacters, keywords, tokenNames, tokenValues, testFileLines){
  const output = [];
  let stringWithIdentifiedSpecialChars = "";

  if (specialCharacters.length !== 0){
    for (let character of testFileLines[0]){
      let temp = "";
      if (specialCharacters.includes(character)){
        temp += `@${character}@`;
        stringWithIdentifiedSpecialChars += temp;
      } else {
        stringWithIdentifiedSpecialChars += character
      }
    }
  }

  // If we got a kewyord that's only one value (space, tab, etc)
  if (keywords.map(keyword => keyword.keywordValue.length).includes(1)){
    console.log("Entré")
    let currentStringWithIdentifiedSpecialChars = "";
    if (stringWithIdentifiedSpecialChars !== ""){
      currentStringWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars;
    } else {
      currentStringWithIdentifiedSpecialChars = testFileLines[0];
    }
    
    stringWithIdentifiedSpecialChars = "";
    for (let character of currentStringWithIdentifiedSpecialChars){
      let temp = "";
      if (keywords.map(keyword => keyword.keywordValue).includes(character)){
        temp += `@${character}@`;
        stringWithIdentifiedSpecialChars += temp;
      } else {
        stringWithIdentifiedSpecialChars += character
      }
    }
  }

  let arrayWithIdentifiedSpecialChars = [];

  let spaceNotInSpecialCharacters = false;

  if(!specialCharacters.includes(" ") && stringWithIdentifiedSpecialChars !== "" && !keywords.map(keyword => keyword.keywordValue.length).includes(1)){
    stringWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars.replaceAll(" ", "@ @");
    spaceNotInSpecialCharacters = true;
  }

  if (stringWithIdentifiedSpecialChars === ""){
    arrayWithIdentifiedSpecialChars = testFileLines[0].split(" ")
  } else {
    arrayWithIdentifiedSpecialChars = stringWithIdentifiedSpecialChars.split("@");
  }

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

  const stringWithIdentifiedKeywords = arrayWithIdentifiedKeywords.join("@");

  const arrayToAnalize = stringWithIdentifiedKeywords.split("@").filter((possibleToken) => possibleToken !== '')
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
      for (let token of tokenValues){
        const dfaInstance = new DFA();
        const dfa = dfaInstance.getDirectDFA(token);
        const result = dfaInstance.validateString(arrayToAnalize[i]);

        if (result === true){
          indexOfSuccessToken = tokenValues.indexOf(token);
          wasAnalized = true;
          break
        } else {
          wasAnalized = false;
        }
      }
      
      if(wasAnalized) output.push(tokenNames[indexOfSuccessToken])
      else if (!spaceNotInSpecialCharacters) output.push("Invalid");
    }
  }

  return output;
}