import last from 'lodash/last.js';
import first from 'lodash/first.js';
import join from 'lodash/join.js';
import trim from 'lodash/trim.js';
import reverse from 'lodash/reverse.js';
import { constants } from '../utils/constants.js';
import { functions } from '../utils/functions.js';

export function CHR(index){
  if (index === 9){
    return String.fromCharCode(0x2192);
  }
  return String.fromCharCode(index);
}

export function getAutomataString(charactersString){
  let charactersArray = charactersString.split("");
  let result = [];

  if (charactersArray.includes(constants.OPEN_PARENTHESIS)){
    let stillParsing = false;
    for (let character of charactersArray){
      if(character === constants.OPEN_PARENTHESIS) stillParsing = true;
      else if (character === constants.CLOSING_PARENTHESIS) stillParsing = false;

      if (stillParsing === true){
        if (character !== constants.OPEN_PARENTHESIS && character !== constants.CLOSING_PARENTHESIS) result.push(character);
      }

      else if (stillParsing === false){
        if (character !== constants.CLOSING_PARENTHESIS) result.push(character);
        result.push(constants.OR);
      }
    }

    if(last(result) === constants.OR) result.pop();
    result.push(constants.CLOSING_PARENTHESIS);
    result.splice(0,0,constants.OPEN_PARENTHESIS);
  } else {
    result = join(charactersArray, constants.OR).split("");
    result.push(constants.CLOSING_PARENTHESIS);
    result.splice(0,0,constants.OPEN_PARENTHESIS);
  }

  return result.join("");
}

function getCharacterStatements(charactersArray){
  const characterStatements = [];

  for (let currentCharacter of charactersArray){
    const currentCharacterLine = currentCharacter.replace(".","");
    const currentCharacterArray = currentCharacterLine.split("=");

    const characterName = trim(currentCharacterArray[0]);
    let characterValue = trim(currentCharacterArray[1]);

    (characterValue.toLowerCase().includes("chr(")) ? characterValue = characterValue.toUpperCase() : characterValue = characterValue;

    const characterStatement = {
      characterName: characterName,
      characterValue: characterValue
    }

    characterStatements.push(characterStatement);
  }

  return characterStatements;
}

function getCharacterStatementsWithStrings(characterStatementsArray){
  let newCharacterStatements = [];
  let characterStatementNames = characterStatementsArray.map(characterStatement => characterStatement.characterName);

  for (let characterStatement of characterStatementsArray){
    const arrayOfNames = [];
    const arrayOfValues = [];
    for (let name of characterStatementNames){
      if (characterStatement.characterValue.match(new RegExp("\\b"+name+"\\b", 'g'))) {
        arrayOfNames.push(name)
        arrayOfValues.push(characterStatementsArray[characterStatementNames.indexOf(name)].characterValue)
      }
    }

    if (arrayOfNames.length > 0 && arrayOfValues.length > 0){
      let newCharacterValue = characterStatement.characterValue;
      for (let characterToReplaceName of arrayOfNames){
        newCharacterValue = newCharacterValue.replaceAll(`${characterToReplaceName}`, arrayOfValues[arrayOfNames.indexOf(characterToReplaceName)]);
      }
  
      newCharacterStatements.push({
        characterName: characterStatement.characterName,
        characterValue: newCharacterValue
      })
    }
    newCharacterStatements.push(characterStatement);
  }

  // remove duplicates
  const finalCharacterStatements = newCharacterStatements.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.characterName === value.characterName
    ))
  );

  return finalCharacterStatements;
}

function getKeywordStatements(keywordsArray){
  const keywordStatements = [];

  for (let currentKeyword of keywordsArray){
    const keywordLine = currentKeyword.replace(".","").split("=");

    const keywordName = trim(keywordLine[0]);
    let keywordValue = trim(keywordLine[1]);

    keywordValue = keywordValue.replaceAll(CHR(34), "")

    const keywordStatement = {
      keywordName: keywordName,
      keywordValue: keywordValue
    }

    keywordStatements.push(keywordStatement);
  }

  return keywordStatements;
}

function tokenStringToAutomataString(tokenAsString){
  let currentTokenLine = "";
  
  const tokenAsArray = tokenAsString.split("");
  if (last(tokenAsArray) === ".") tokenAsArray.pop();

  currentTokenLine = trim(tokenAsArray.join(""));

  const currentTokenTest = currentTokenLine.split("=");
  const currentTokenName = trim(currentTokenTest[0]);
  let currentTokenValue = trim(currentTokenTest[1]);

  const tokenWithPositiveClosures = functions.convertAddedStrings(currentTokenValue);
  const tokenWithOrs = functions.convertOr(tokenWithPositiveClosures);
  const tokenWithConcats = functions.convertConcat(tokenWithOrs);
  const tokenWithParenthesis = functions.convertParenthesis(tokenWithConcats);
  const tokenWithKleenClosure = functions.convertKleenClosure(tokenWithParenthesis);
  currentTokenValue = tokenWithKleenClosure;

  const addedSubstrings = currentTokenValue.match(/(?![".&"])(?<=\+\+).*?(?=\+)/gs);

  if (addedSubstrings && addedSubstrings.length > 0){
    for (let addedSubstring of addedSubstrings){
      const addedSubstringJoined = join(addedSubstring.split(""),"&");
      currentTokenValue = currentTokenValue.replaceAll(`+${addedSubstring}`, `+&'${addedSubstringJoined}'`);
    }
  }

  const currentTokenAutomataString = `${currentTokenName} = ${currentTokenValue}`

  return currentTokenAutomataString;
}

function tokenHasExceptions(tokenAsArray){
  if (
    tokenAsArray.at(-2) === "EXCEPT" &&
    tokenAsArray.at(-1) === "KEYWORDS"
    ){
    return true;
  }

  return false;
}

function getTokenStatements(tokensArray){
  const tokenNames = [];
  const tokenValues = [];

  if (tokensArray.at(-1).includes("END")) tokensArray.pop();

  const tokenStatements = [];
  for (let currentToken of tokensArray){
    const currentAutomataString = tokenStringToAutomataString(currentToken);
    
    let currentTokenArray = currentAutomataString.split(" ");

    if (tokenHasExceptions(currentTokenArray)){
      currentTokenArray.pop();
      currentTokenArray.pop();
      tokenValues.push(first(currentTokenArray));
    } else tokenValues.push(first(currentTokenArray));

    // This means we have spaces on the value of the current token
    if (currentTokenArray.length > 3){
      let finalValue = "";
      for (let index = 2; index < currentTokenArray.length; index++){
        if (index === 2){
          finalValue += currentTokenArray[index];
        } else {
          finalValue += "/"+currentTokenArray[index];
        }
      }

      currentTokenArray = [currentTokenArray[0], currentTokenArray[1], finalValue]
    }

    const noSpacesCurrentTokenString = currentTokenArray.join("").replaceAll("&", "");

    const clutteredCurrentTokenArray = noSpacesCurrentTokenString.split("=");

    let clutteredTokenName = clutteredCurrentTokenArray[0];
    let clutteredTokenValue = clutteredCurrentTokenArray[1];

    tokenNames.push(clutteredTokenName);

    // start cleaning the clutteredTokenValue
    clutteredTokenValue = functions.addConcatBetweenGroupedTerms(clutteredTokenValue);

    // Remove + sign from start and finish
    if (first(clutteredTokenValue) === "+") clutteredTokenValue = clutteredTokenValue.replace("+","");
    if (last(clutteredTokenValue) === "+") clutteredTokenValue = clutteredTokenValue.slice(0, -1);

    // if penultimate has an empty value then remove it
    let clutteredTokenValueArray = clutteredTokenValue.split("");
    if (clutteredTokenValueArray.at(-2) === "&"){
      let lastCharacter = clutteredTokenValueArray.pop();
      clutteredTokenValueArray.pop();
      clutteredTokenValueArray.push(lastCharacter)
    }

    // Add a concat after a dot (for decimals)
    const newTokenValueArray = [];
    for (let newToken of clutteredTokenValueArray){
      if(newToken === ".") newTokenValueArray.push(...[newToken, "&"]);
      else newTokenValueArray.push(newToken);
    }

    clutteredTokenValue = newTokenValueArray.join("");

    clutteredTokenValue = clutteredTokenValue.replaceAll(`"+/`, `"+`);
    const tokenValueWithoutDuplicatedOps = functions.clearDuplicatedOperators(clutteredTokenValue);
    const tokenValueClean = functions.cleanFinalString(tokenValueWithoutDuplicatedOps);
    const tokenValueWithoutFwdSlash = functions.handleForwardSlash(tokenValueClean);
    clutteredTokenValue = tokenValueWithoutFwdSlash;

    const addedSubstrings = clutteredTokenValue.match(/(?<=').*?(?=')/gs);

    if (addedSubstrings && addedSubstrings.length > 0){
      for (let addedSubstring of addedSubstrings){
        const addedSubstringJoined = join(addedSubstring.split(""),"&");
        clutteredTokenValue = clutteredTokenValue.replaceAll(`+ '${addedSubstring}'`, `+ "${addedSubstringJoined}"`);
      }
    }

    clutteredTokenValue = clutteredTokenValue.replaceAll(`(+)`, ` + `);

    const tokenStatement = {
      tokenName: clutteredTokenName,
      tokenValue: clutteredTokenValue
    }

    tokenStatements.push(tokenStatement);
  }

  return {
    tokenStatements: tokenStatements,
    tokenValues: tokenValues,
    tokenNames: tokenNames,
  }
}

export default function getCompilableFile(headerArray, charactersArray, keywordsArray, tokensArray){
  const outputFileLines = [];

  outputFileLines.push(`import promptSync from "prompt-sync";`);
  outputFileLines.push("\n");
  outputFileLines.push(`import { getAutomataString } from "../LexicalAnalizer/LexicalAnalizer.js";`);
  outputFileLines.push("\n");
  outputFileLines.push(`import { generateEvaluatorOutput } from "../LexicalEvaluator/LexicalEvaluator.js";`);
  outputFileLines.push("\n");
  outputFileLines.push(`import { readTestFile } from "../LexicalEvaluator/LexicalEvaluator.js";`);
  outputFileLines.push("\n");
  outputFileLines.push(`import { CHR } from "../LexicalAnalizer/LexicalAnalizer.js";`);
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push(`const prompt = promptSync();`);
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push("// FILENAME");
  outputFileLines.push("\n");
  outputFileLines.push(`let fileName = "${headerArray[0]}";`);
  outputFileLines.push("\n")
  outputFileLines.push("\n");
  outputFileLines.push("// CHARACTERS");
  outputFileLines.push("\n");
  
  // CHARACTERS
  const characterStatements = getCharacterStatements(charactersArray);

  let specialCharacters = [];

  for (let characterStatement of characterStatements){
    const { characterName, characterValue } = characterStatement;

    if(characterValue.includes("CHR(")){
      let separatedCharacters = characterValue.split("+");
      if (separatedCharacters.length > 1){
        for (let separatedCharacter of separatedCharacters){
          if (separatedCharacter.includes("CHR(")){
            specialCharacters.push(trim(separatedCharacter));
          }
        }
      } else {
        specialCharacters.push(trim(separatedCharacters));
      }
    }
  }

  outputFileLines.push(`const specialCharacters = [${specialCharacters}]`);
  outputFileLines.push("\n");

  outputFileLines.push("\n");
  outputFileLines.push("// KEYWORDS");
  outputFileLines.push("\n");

  // KEYWORDS
  const keywordStatements = getKeywordStatements(keywordsArray);
  
  outputFileLines.push(`const keywords = ${JSON.stringify(keywordStatements)};`)
  outputFileLines.push("\n");

  // TOKENS
  outputFileLines.push("\n");
  outputFileLines.push("// TOKENS");
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("Tokens permitidos: ")`);
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("");`);
  outputFileLines.push("\n");

  const { tokenStatements, tokenValues, tokenNames } = getTokenStatements(tokensArray);

  const newCharacterStatements = getCharacterStatementsWithStrings(characterStatements);

  for (let tokenStatement of tokenStatements){
    const {tokenName, tokenValue} =  tokenStatement;

    let newTokenValue = tokenValue;
    for (let characterStatement of newCharacterStatements){
      if (newTokenValue.includes(characterStatement.characterName)){
        newTokenValue = newTokenValue.replaceAll(new RegExp("\\b"+characterStatement.characterName+"\\b", 'g'), `getAutomataString(${characterStatement.characterValue})`)
      }
    }

    outputFileLines.push("\n");
    outputFileLines.push(`const ${tokenName} = ${newTokenValue};`);
    outputFileLines.push("\n")
    outputFileLines.push(`console.log("${tokenName} -> ", ${tokenName});`);
    outputFileLines.push("\n")
  }

  outputFileLines.push("\n")
  outputFileLines.push("// TOKENS ARRAYS")
  outputFileLines.push("\n")
  outputFileLines.push(`const tokenValues = ${JSON.stringify(reverse(tokenValues)).replaceAll(CHR(34), "")};`)
  outputFileLines.push("\n");
  outputFileLines.push(`const tokenNames = ${JSON.stringify(reverse(tokenNames))};`)
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("");`);
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("");`);
  outputFileLines.push("\n");
  outputFileLines.push(`const testFileRelativePath = prompt("Ingrese el path relativo del archivo .txt que desea evaluar (revise la carpeta llamada txts) >> ");`);
  outputFileLines.push("\n");
  outputFileLines.push("\const testFileLines = readTestFile(testFileRelativePath)");
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push("const evaluatorOutput = generateEvaluatorOutput(fileName, specialCharacters, keywords, tokenNames, tokenValues, testFileLines);")
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("El output es -> ", evaluatorOutput);`)

  return outputFileLines;
}