import reverse from 'lodash/reverse.js';
import last from 'lodash/last.js';
import concat from 'lodash/concat.js';
import { constants } from '../utils/constants.js'
import { functions } from '../utils/functions.js'

export default class NDFA {
  constructor(){
    this.r = null;
    this.automata = null;
    this.startEndNodes = null;
  }
 
  operatorHierarchy(operator) {
    return (operator === constants.KLEEN_CLOSURE || operator === constants.OPEN_PARENTHESIS || operator == constants.CLOSING_PARENTHESIS) ? 3 : operator === constants.OR ? 2 : operator === constants.CONCAT ? 1 : 0;
  }
  
  replacePositiveClosureForKleenClosure(string) {
    let pile = [];
    let temp = [];
    let endCharacter = "";
  
    for (let i = 0; i < string.length; i++) {
      if (string[i] === constants.POSITIVE_CLOSURE){
        
        // If current character is a positive closure that affects just one term (no parenthesis)
        if (string[i] === constants.POSITIVE_CLOSURE && last(pile) !== constants.CLOSING_PARENTHESIS){
          let reachedEnd = true;
          let stackFinalIndex = pile.length - 1;

          // loop over pile in descending order until we find a closing parenthesis or a concat
          while (reachedEnd === true && stackFinalIndex !== -1){
            if (pile[stackFinalIndex] === constants.CONCAT || pile[stackFinalIndex] === constants.OR || pile[stackFinalIndex] === constants.OPEN_PARENTHESIS) {
              endCharacter = pile.pop();
              reachedEnd = false;
            } else {
              temp.push(pile.pop());
            }
            stackFinalIndex--;
          }
          
          // Add the replacement of expression+ for expression.expression*
          if (string[i] === constants.POSITIVE_CLOSURE){
            const reversedString = reverse(temp).join("");
            pile.push(
              endCharacter
              + constants.OPEN_PARENTHESIS
              + reversedString
              + constants.CLOSING_PARENTHESIS
              + constants.CONCAT
              + constants.OPEN_PARENTHESIS
              + reversedString
              + constants.KLEEN_CLOSURE
              + constants.CLOSING_PARENTHESIS.toString()
            );
          }
          temp = [];
          
        // If current character is a positive closure that affects a complex term with parenthesis
        } else {
          let reachedEnd = true;
          let stackFinalIndex = pile.length - 1;
  
          // loop overt pile until we find the corresponding open parenthesis
          while (reachedEnd === true){
            if (pile[stackFinalIndex] === constants.OPEN_PARENTHESIS){
              temp.push(constants.OPEN_PARENTHESIS);
              pile.pop();
              reachedEnd = false;
            } else {
              temp.push(pile.pop());
            }
            stackFinalIndex--;
          }

          // Add the replacement of (expression)+ for (expression).(expression)*  
          if (string[i] === constants.POSITIVE_CLOSURE){
            const reversedString = reverse(temp).join("");
            pile.push(
              constants.OPEN_PARENTHESIS
              + reversedString
              + constants.CLOSING_PARENTHESIS
              + constants.CONCAT
              + constants.OPEN_PARENTHESIS
              + reversedString
              + constants.KLEEN_CLOSURE
              .toString()
            );
          }
          temp = [];
        }
      } else if (string[i] !== constants.POSITIVE_CLOSURE){ pile.push(string[i])}
    }
  
    const stringWithoutPositiveClosure = pile.join("");
  
    stringWithoutPositiveClosure[0] === constants.CONCAT ? stringWithoutPositiveClosure.pop(0) : stringWithoutPositiveClosure[0]
  
    return stringWithoutPositiveClosure;
  }
  
  replaceZeroOrOneForOrEpsilon(string) {
    let pile = [];
    let temp = [];
    let endCharacter = "";
  
    for (let i = 0; i < string.length; i++) {
      if (string[i] === constants.ZERO_OR_ONE){  
        // If current character is a zero or one that affects just one term (no parenthesis)
        if (string[i] === constants.ZERO_OR_ONE && last(pile) !== constants.CLOSING_PARENTHESIS){
          let reachedEnd = true;
          let stackFinalIndex = pile.length - 1;
          
          // loop over pile in descending order until we find a closing parenthesis or a concat
          while (reachedEnd === true && stackFinalIndex !== -1){
            if (pile[stackFinalIndex] === constants.CONCAT || pile[stackFinalIndex] === constants.OR || pile[stackFinalIndex] === constants.OPEN_PARENTHESIS) {
              endCharacter = pile.pop();
              reachedEnd = false;
            } else {
              temp.push(pile.pop());
            }
            stackFinalIndex--;
          }
          
          // Add the replacement of expression? for expression|epsilon*
          if (string[i] === constants.ZERO_OR_ONE){
            const reversedString = reverse(temp).join("");
            pile.push(
              endCharacter
              + constants.OPEN_PARENTHESIS
              + reversedString
              + constants.OR
              + constants.EPSILON
              + constants.CLOSING_PARENTHESIS
              .toString()
            );
            
          }
          temp = [];
        // If current character is a positive closure that affects a complex term with parenthesis
        } else {
          let reachedEnd = true;
          let stackFinalIndex = pile.length - 1;
  
          // loop overt pile until we find the corresponding open parenthesis
          while (reachedEnd === true){
            if (pile[stackFinalIndex] === constants.OPEN_PARENTHESIS){
              temp.push(constants.OPEN_PARENTHESIS);
              pile.pop();
              reachedEnd = false;
            } else {
              temp.push(pile.pop());
            }
            stackFinalIndex--;
          }
          
          // Add the replacement of (expression)? for (expression)|epsilon*
          if (string[i] === constants.ZERO_OR_ONE){
            const reversedString = reverse(temp).join("");
            pile.push(
              constants.OPEN_PARENTHESIS
              + reversedString
              + constants.OR
              + constants.EPSILON
              + constants.CLOSING_PARENTHESIS
              .toString()
            );
            
          }
          temp = [];
        }
      } else if (string[i] !== constants.ZERO_OR_ONE){ pile.push(string[i])}
    }
  
    const stringWithoutZeroOrOne = pile.join("");
  
    stringWithoutZeroOrOne[0] === constants.CONCAT ? stringWithoutZeroOrOne.pop(0) : stringWithoutZeroOrOne[0]
  
    return stringWithoutZeroOrOne;
  }

  generateOrderedRegex(string) {
    let pile = [];
    let orderedRegex = [];
  
    for (let i = 0; i < string.length; i++) {
      if (string[i] === constants.OPEN_PARENTHESIS){
        pile.push(string[i]);
      } else if (string[i] === constants.CLOSING_PARENTHESIS){
        let stackLastIndex = pile.length - 1;
        while (pile[stackLastIndex] !== constants.OPEN_PARENTHESIS){
          orderedRegex.push(pile[stackLastIndex]);
          pile.pop();
          stackLastIndex--;
        }
        pile.pop();
      } else if (
        string[i] === constants.OR
        || string[i] === constants.KLEEN_CLOSURE
        || string[i] === constants.CONCAT
        ) {
          if (pile.length !== 0){
            if (last(pile) !== constants.OPEN_PARENTHESIS){
              if (this.operatorHierarchy(string[i]) >= this.operatorHierarchy(last(pile))){
                pile.push(string[i]);
              } else if (this.operatorHierarchy(string[i]) < this.operatorHierarchy(last(pile))){
                let stackLastIndex = pile.length - 1;
                if (stackLastIndex !== 0){
                  while (pile[stackLastIndex] !== constants.OPEN_PARENTHESIS){
                    orderedRegex.push(last(pile));
                    pile.pop();
                    stackLastIndex--;
                    if (pile.length == 0) break;
                  }
                  pile.push(string[i]);
                } else {
                  orderedRegex.push(last(pile));
                  pile.pop();
                  pile.push(string[i]);
                }
              }
            } else {
              pile.push(string[i]);
            }
          } else {
            pile.push(string[i])
          }
      } else {
        orderedRegex.push(string[i]);
      }
    }
  
    pile.length != 0 ? orderedRegex = concat(orderedRegex, reverse(pile)) : orderedRegex;
    
    const orderedCleanRegex = orderedRegex.filter((char) => char !== "(" && char !== ")");
    return orderedCleanRegex;
  }
  
  buildNonDeterministicFiniteAutomata(expression) {
    let nodeNumber = 2;
    let pile = [];
    let startEndNodes = [];
  
    for (let symbol of expression){
      if (
        symbol !== constants.OR 
        && symbol !== constants.CONCAT 
        && symbol !== constants.KLEEN_CLOSURE
      ){
        pile.push([nodeNumber, symbol, nodeNumber + 1]);
        startEndNodes.push([ nodeNumber, nodeNumber + 1 ]);
        nodeNumber += 2;
      } else if (symbol === constants.OR){
        // base automatas
        const node0 = pile.pop();
        const node1 = pile.pop();
  
        // Add new tail of the automata and join it via epsilon to the tails of the base automatas
        const node2 =  [nodeNumber, constants.EPSILON, startEndNodes[startEndNodes.length - 2][0]];
        const node3 = [nodeNumber,constants.EPSILON,startEndNodes[startEndNodes.length - 1][0]];
  
        // Add a new head of the automata by joining the heads of the bese automatas as tails of the new node
        const node4 = [startEndNodes[startEndNodes.length - 2][1], constants.EPSILON, nodeNumber+1];
        const node5 = [startEndNodes[startEndNodes.length - 1][1], constants.EPSILON, nodeNumber+1]
  
        // Add all to the pile
        pile.push([node0, node1, node2, node3, node4, node5]);
  
        let initialNode = nodeNumber;
        let finalNode = nodeNumber + 1;
  
        nodeNumber += 2;
        
        startEndNodes.pop();
        startEndNodes.pop();
        startEndNodes.push([initialNode, finalNode])
        
      } else if (symbol === constants.KLEEN_CLOSURE){
        let initialNode = startEndNodes[startEndNodes.length-1][0];
        let finalNode = startEndNodes[startEndNodes.length-1][1];
  
        // Add the node at the beginning of the new automata and link it to the inital node
        const node0 = [nodeNumber, constants.EPSILON, initialNode];
  
        // Add an epsilon edge between the final node and the initial one
        const node1 = [finalNode, constants.EPSILON, initialNode];
  
        // initial node is now the node of the very beginning we just added
        initialNode = nodeNumber;
        nodeNumber += 1;
  
        // Add an epsilon edge between the finalNode of our automata and a new one (the acceptance node)
        const node2 = [finalNode, constants.EPSILON, nodeNumber];
  
        // Add an epsilon edge from the very beginning to the acceptance node
        const node3 = [initialNode, constants.EPSILON, nodeNumber];
  
        // Our final node is the last node we added
        finalNode = nodeNumber;
  
        // Get our final node from the previous step
        const node4 = pile.pop();
  
        // Add all nodes in order
        pile.push([node4, node0, node1 ,node2, node3]);
  
        // remove previous startEndNodes
        startEndNodes.pop();
  
        // Add new startEndNodes
        startEndNodes.push([initialNode, finalNode]);
        nodeNumber++;
  
      } else if (symbol === constants.CONCAT){
  
        // second node is the expression in the right side of the binary tree from the concat operator
        let secondNode = pile.pop();
  
        // fist node is the expression in the left side of the binary tree from the concat operator
        let firstNode = pile.pop();
  
        // start end nodes second node is the head/tail of first expression
        let startEndNodesSecondNode = startEndNodes.pop();
  
        // start end nodes first node is the head/tail of second expression
        let startEndNodesFirstNode = startEndNodes.pop();
  
        try {
          firstNode = functions.simplifyArray(firstNode, []);
          for (let expression of firstNode){
            for (let i = 0; i < expression.length; i++) {
              if (expression[i] === startEndNodesFirstNode[1]){
                expression[i] = startEndNodesSecondNode[0];
              }
            }
          }
        } catch (error) {
          for (let expression of firstNode){
            if (expression === startEndNodesFirstNode[1]){
              expression = startEndNodesSecondNode[0];
            }
          }
        }
  
        const initialNode = startEndNodesFirstNode[0];
        const finalNode = startEndNodesSecondNode[1];
  
        startEndNodes.push([initialNode, finalNode]);
        pile.push([firstNode, secondNode]);
      }
    }
    const automata = functions.simplifyArray(pile, []);

    const sortedAutomata = automata.sort((a,b) => {
      return a[0] - b[0]
    })

    return {
      "automata": sortedAutomata,
      "startEndNodes": startEndNodes
    };
  }

  getNDFA(r) {

    this.r = r;

    const stringWithoutPositiveClosure = this.replacePositiveClosureForKleenClosure(this.r);
    const stringWithoutZeroOrOne = this.replaceZeroOrOneForOrEpsilon(stringWithoutPositiveClosure);
    const orderedRegex = this.generateOrderedRegex(stringWithoutZeroOrOne);
    const { automata, startEndNodes } = this.buildNonDeterministicFiniteAutomata(orderedRegex);

    this.automata = automata;
    this.startEndNodes = startEndNodes;

    return { automata, startEndNodes }
  }
}