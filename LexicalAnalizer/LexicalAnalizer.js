import last from 'lodash/last.js';
import first from 'lodash/first.js';
import join from 'lodash/join.js';
import trim from 'lodash/trim.js'

export function CHR(index){
  if (index === 9){
    return String.fromCharCode(0x2192);
  }
  return String.fromCharCode(index);
}

export function getAutomataString(charactersString){
  let charactersArray = charactersString.split("");
  let result = [];

  if (charactersArray.includes("(")){
    let stillParsing = false;
    for (let character of charactersArray){
      if(character === "(") stillParsing = true;
      else if (character === ")") stillParsing = false;

      if (stillParsing === true){
        if (character !== "(" && character !== ")") result.push(character);
      }

      else if (stillParsing === false){
        if (character !== ")") result.push(character);
        result.push("|");
      }
    }

    if(last(result) === "|") result.pop();

    result.push(")");
    result.splice(0,0,"(");
  } else {
    result = join(charactersArray, "|").split("");
    result.push(")");
    result.splice(0,0,"(");
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

function getKeywordStatements(keywordsArray){
  const keywordStatements = [];

  for (let currentKeyword of keywordsArray){
    const keywordLine = currentKeyword.replace(".","").split("=");

    const keywordName = trim(keywordLine[0]);
    const keywordValue = trim(keywordLine[1].replaceAll(CHR(34), ""));

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

  // substitute " -> /+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(34), '+')

  // substitute | -> / + "|"+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(124), `&+&"|"+`)

  // substitute . -> /". "/
  currentTokenValue = currentTokenValue.replaceAll(CHR(46), `".&"`)
  
  // substitute ( -> / + " ("+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(40), `&+&"&("+`)

  // substitute ) -> / + ")"/
  currentTokenValue = currentTokenValue.replaceAll(CHR(42), `&+&")"`)

  // substitute { por / + " (("+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(123), `&+&"&(("+`)

  // substitute } por / + ")*) "+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(125), `&+&")*)&"+`)

  // substitute [ por / + " (("+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(91), `&+&"&(("+`)

  // substitute ] por / + ")*) "+/
  currentTokenValue = currentTokenValue.replaceAll(CHR(93), `&+&")*)&"+`);

  // substitute "+H" por /+ "H"/
  currentTokenValue = currentTokenValue.replaceAll(CHR(43)+CHR(72), `+&"H"`);

  const currentTokenAutomataString = `${currentTokenName} = ${currentTokenValue}`

  return currentTokenAutomataString;
}

function tokenHasExceptions(tokenAsArray){
  if (tokenAsArray.at(-2) === "EXCEPT" && tokenAsArray.at(-1) === "KEYWORDS"){
    return true;
  }

  return false;
}

function getTokenStatements(tokensArray){
  const tokenValuesWithoutKeywords = [];
  const tokenValuesWithKeywords = [];

  const tokenStatements = [];

  for (let currentToken of tokensArray){
    const currentAutomataString = tokenStringToAutomataString(currentToken);
    
    let currentTokenArray = currentAutomataString.split(" ");

    
    if (tokenHasExceptions(currentTokenArray)){
      currentTokenArray.pop();
      currentTokenArray.pop();
      tokenValuesWithKeywords.push(first(currentTokenArray));
    } else tokenValuesWithoutKeywords.push(first(currentTokenArray));

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

    // start cleaning the clutteredTokenValue
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(41)+CHR(42)+CHR(41), ")*)&");

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
    
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(43)+CHR(43)+CHR(43), `&+`);
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(43)+CHR(43), `&+`);
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(40)+CHR(40), `&((`)
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(34)+CHR(40)+CHR(34), `"&("`)
    clutteredTokenValue = clutteredTokenValue.replaceAll(CHR(38)+CHR(43), `+`)
    clutteredTokenValue = clutteredTokenValue.replaceAll("/", `+"&"+`);
    clutteredTokenValue = clutteredTokenValue.replaceAll(`"&"++`, ``);

    const tokenStatement = {
      tokenName: clutteredTokenName,
      tokenValue: clutteredTokenValue
    }

    tokenStatements.push(tokenStatement);
  }

  return {
    tokenStatements: tokenStatements,
    tokenValuesWithKeywords: tokenValuesWithKeywords,
    tokenValuesWithoutKeywords: tokenValuesWithoutKeywords
  }
}

export default function getCompilableFile(headerArray, charactersArray, keywordsArray, tokensArray){
  const outputFileLines = [];

  // TODO change this imports
  outputFileLines.push(`import { getAutomataString } from "../LexicalAnalizer/LexicalAnalizer.js";`);
  outputFileLines.push("\n");
  outputFileLines.push(`import { CHR } from "../LexicalAnalizer/LexicalAnalizer.js";`)
  outputFileLines.push("\n");
  outputFileLines.push("\n");
  outputFileLines.push("// COMPILABLE FILE "+ headerArray[0]+ ".js");
  outputFileLines.push("\n")
  outputFileLines.push("\n");
  outputFileLines.push("// CHARACTERS");
  outputFileLines.push("\n");
  
  // CHARACTERS
  const characterStatements = getCharacterStatements(charactersArray);

  for (let characterStatement of characterStatements){
    const { characterName, characterValue } = characterStatement;

    outputFileLines.push(`let ${characterName} = ${characterValue};`);
    outputFileLines.push("\n")
  }

  outputFileLines.push("\n")

  for (let characterStatement of characterStatements){
    const { characterName, characterValue } = characterStatement;

    outputFileLines.push(`${characterName} = getAutomataString(${characterValue});`);
    outputFileLines.push("\n")
    outputFileLines.push(`console.log("${characterName} -> ", ${characterName});`);
    outputFileLines.push("\n")
    outputFileLines.push("\n")
  }

  outputFileLines.push(`console.log("");`);
  outputFileLines.push("\n");
  outputFileLines.push(`console.log("");`);
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

  const { tokenStatements, tokenValuesWithKeywords, tokenValuesWithoutKeywords} = getTokenStatements(tokensArray)

  for (let tokenStatement of tokenStatements){
    const {tokenName, tokenValue} =  tokenStatement;

    outputFileLines.push("\n");
    outputFileLines.push(`const ${tokenName} = ${tokenValue};`);
    outputFileLines.push("\n")
    outputFileLines.push(`console.log("${tokenName} -> ", ${tokenName});`);
    outputFileLines.push("\n")
  }

  outputFileLines.push("\n")
  outputFileLines.push("// TOKENS ARRAYS")
  outputFileLines.push("\n")
  outputFileLines.push(`const tokenValuesWithKeywords = ${JSON.stringify(tokenValuesWithKeywords).replaceAll(CHR(34), "")};`)
  outputFileLines.push("\n")
  outputFileLines.push("\n")
  outputFileLines.push(`const tokenValuesWithoutKeywords = ${JSON.stringify(tokenValuesWithoutKeywords).replaceAll(CHR(34), "")};`)
  outputFileLines.push("\n")

  return outputFileLines;
}