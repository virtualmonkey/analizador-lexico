import { v4 as uuidv4 } from 'uuid';
import last from 'lodash/last.js';
import first from 'lodash/first.js';
import countBy from 'lodash/countBy.js';
import isEqual from 'lodash/isEqual.js';
import isEmpty from 'lodash/isEmpty.js';
import { constants } from '../utils/constants.js'
import Tree from './Tree.js'

export default class DFA {
  constructor() {
    this.r = null;
    this.directDFA = null;
    this.directDFAStartEndNodes = null;
  }

  buildTree(expression) {
    let opStack = [];
    let trees = [];
    let currentCharacter = 0;

    while (currentCharacter < expression.length) {
      let wholeExpression = "";
      if (
        expression[currentCharacter] !== constants.OR &&
        expression[currentCharacter] !== constants.KLEEN_CLOSURE &&
        expression[currentCharacter] !== constants.POSITIVE_CLOSURE &&
        expression[currentCharacter] !== constants.ZERO_OR_ONE &&
        expression[currentCharacter] !== constants.NEW_CONCAT &&
        expression[currentCharacter] !== constants.OPEN_PARENTHESIS &&
        expression[currentCharacter] !== constants.CLOSING_PARENTHESIS
      ) {
        while (
          currentCharacter < expression.length &&
          expression[currentCharacter] !== constants.OR &&
          expression[currentCharacter] !== constants.KLEEN_CLOSURE &&
          expression[currentCharacter] !== constants.POSITIVE_CLOSURE &&
          expression[currentCharacter] !== constants.ZERO_OR_ONE &&
          expression[currentCharacter] !== constants.NEW_CONCAT &&
          expression[currentCharacter] !== constants.OPEN_PARENTHESIS &&
          expression[currentCharacter] !== constants.CLOSING_PARENTHESIS
        ) {
          wholeExpression += expression[currentCharacter];
          currentCharacter++;
        }

        const tree = new Tree(uuidv4(), wholeExpression, null, null);
        trees.push(tree);

        currentCharacter--;
      }

      else if (expression[currentCharacter] === constants.OPEN_PARENTHESIS) opStack.push(expression[currentCharacter]);

      else if (expression[currentCharacter] === constants.CLOSING_PARENTHESIS) {
        while (!isEmpty(opStack) && last(opStack) !== constants.OPEN_PARENTHESIS) {
          const tree = new Tree(uuidv4(), opStack.pop(), trees.pop(), trees.pop());
          trees.push(tree);
        }
        opStack.pop();
      }

      else {
        if (
          expression[currentCharacter] === constants.KLEEN_CLOSURE ||
          expression[currentCharacter] === constants.POSITIVE_CLOSURE ||
          expression[currentCharacter] === constants.ZERO_OR_ONE
        ) {
          const tree = new Tree(uuidv4(), expression[currentCharacter], trees.pop(), null);
          trees.push(tree);
        } else {
          while (!isEmpty(opStack) && last(opStack) !== constants.OPEN_PARENTHESIS) {
            const tree = new Tree(uuidv4(), opStack.pop());
            tree.right = trees.pop();
            tree.left = trees.pop();

            trees.push(tree);
          }

          opStack.push(expression[currentCharacter])
        }
      }

      currentCharacter++;
    }

    let singleTree = new Tree();

    while (!isEmpty(opStack)) {
      const tree = new Tree(uuidv4, opStack.pop());
      tree.right = trees.pop();
      tree.left = trees.pop();

      trees.push(tree);

      if (trees.length === 1) singleTree = last(trees);
    }

    singleTree = last(trees);

    const extra = new Tree(uuidv4(), constants.EXTRA, null, null);

    const expandedTree = new Tree(uuidv4(), constants.NEW_CONCAT, singleTree, extra);

    return expandedTree;
  }

  getStates(tree) {
    const states = [];

    if (tree !== null) {
      if (tree.right !== null) {
        for (let state of this.getStates(tree.right)) states.push(state);
      }

      if (tree.left !== null) {
        for (let state of this.getStates(tree.left)) states.push(state);
      }

      if (tree.left === null && tree.right === null) {
        if (
          tree.head !== constants.EPSILON &&
          tree.head !== constants.OR &&
          tree.head !== constants.KLEEN_CLOSURE &&
          tree.head !== constants.POSITIVE_CLOSURE &&
          tree.head !== constants.ZERO_OR_ONE &&
          tree.head !== constants.NEW_CONCAT &&
          tree.head !== constants.OPEN_PARENTHESIS &&
          tree.head !== constants.CLOSING_PARENTHESIS
        ) {
          states.push(tree);
        }
      }
    }

    return states;
  }

  calculateNullableFunction(tree) {
    const n = tree.head;
    const c1 = tree.left;
    const c2 = tree.right;
    let nullableResult = false;

    if (tree !== null) {
      // n = c1|c2
      if (n === constants.OR) {
        // nullable(c1) || nullable(c2)
        (this.calculateNullableFunction(c1) || this.calculateNullableFunction(c2)) ? nullableResult = true : nullableResult = false;
      }

      // n = c1.c2
      else if (n === constants.NEW_CONCAT) {
        // nullable(c1) && nullable(c2)
        (this.calculateNullableFunction(c1) && this.calculateNullableFunction(c2)) ? nullableResult = true : nullableResult = false;
      }

      // n+
      else if (n === constants.POSITIVE_CLOSURE) {
        // nullable(c1)
        (this.calculateNullableFunction(c1)) ? nullableResult = true : nullableResult = false;
      }

      else if (n === constants.ZERO_OR_ONE || n === constants.EPSILON || n === constants.KLEEN_CLOSURE) {
        return true;
      }
      return nullableResult;
    }
  }

  calculateFirstPosition(tree) {
    const n = tree.head;
    const c1 = tree.left;
    const c2 = tree.right;
    const states = [];

    if (tree !== null) {
      if (
        n === constants.OR ||
        n === constants.KLEEN_CLOSURE ||
        n === constants.POSITIVE_CLOSURE ||
        n === constants.ZERO_OR_ONE ||
        n === constants.NEW_CONCAT ||
        n === constants.OPEN_PARENTHESIS ||
        n === constants.CLOSING_PARENTHESIS
      ) {
        // n = c1|c2
        if (n === constants.OR) {
          // firstPos(c1) U firstPos(c2)
          const union = [...this.calculateFirstPosition(c1), ...this.calculateFirstPosition(c2)];
          states.push(...union)
        }

        // n = c1.c2
        else if (n === constants.NEW_CONCAT) {
          const union = []
          // firstPos(c1)
          union.push(...this.calculateFirstPosition(c1))

          if (this.calculateNullableFunction(c1)) {
            // firstPos(c1) U firstPos(c2)
            union.push(...this.calculateFirstPosition(c2))
          }

          states.push(...union)
        }

        // n = c1* or n = c1? or n = c1+
        else if (n === constants.KLEEN_CLOSURE || n === constants.POSITIVE_CLOSURE || n === constants.ZERO_OR_ONE) {
          // firstPos(c1)
          states.push(...this.calculateFirstPosition(c1))
        }

        // n = i
      } else if (n !== constants.EPSILON) states.push(tree);

      return states;
    }
  }
 
  calculateLastPosition(tree) {
    const n = tree.head;
    const c1 = tree.left;
    const c2 = tree.right;
    const states = [];

    if (tree !== null) {
      if (
        n === constants.OR ||
        n === constants.KLEEN_CLOSURE ||
        n === constants.POSITIVE_CLOSURE ||
        n === constants.ZERO_OR_ONE ||
        n === constants.NEW_CONCAT ||
        n === constants.OPEN_PARENTHESIS ||
        n === constants.CLOSING_PARENTHESIS
      ) {
        // n = c1|c2
        if (n === constants.OR) {
          // lastPos(c1) U lastPos(c2)
          const union = [...this.calculateFirstPosition(c1), ...this.calculateFirstPosition(c2)];
          states.push(...union);
        }
        // n = c1.c2
        else if (n === constants.NEW_CONCAT) {
          const union = [];
          // lastPos(c1)
          if (this.calculateNullableFunction(c2)) {
            union.push(...this.calculateLastPosition(c1));
          }

          // lastPos(c1) U lastPos(c2)
          union.push(...this.calculateLastPosition(c2));
          states.push(...union);
        }
        // n = c1* or n = c1? or n = c1+
        else if (n === constants.KLEEN_CLOSURE || n === constants.POSITIVE_CLOSURE || n === constants.ZERO_OR_ONE) {
          // lastPos(c1)
          states.push(...this.calculateLastPosition(c1))
        }
        // n = i
      } else if (n !== constants.EPSILON) states.push(tree);

      return states;
    }
  }

  calculateNextPosition(tree, table) {
    const n = tree.head;
    const c1 = tree.left;
    const c2 = tree.right;

    if (tree !== null) {
      if (c1 !== null) this.calculateNextPosition(c1, table);
      if (c2 !== null) this.calculateNextPosition(c2, table);

      if (n === constants.NEW_CONCAT) {
        for (let lastPositionsLeftTree of this.calculateLastPosition(c1)) {
          for (let firstPosistionRightTree of this.calculateFirstPosition(c2)) {
            table[lastPositionsLeftTree.getUniqueTree()].push(firstPosistionRightTree);
          }
        }
      }

      else if (n === constants.KLEEN_CLOSURE) {
        for (let lastPositionsTree of this.calculateLastPosition(tree)) {
          for (let firstPositionsTree of this.calculateFirstPosition(tree)) {
            table[lastPositionsTree.getUniqueTree()].push(firstPositionsTree);
          }
        }
      }

      else if (n === constants.POSITIVE_CLOSURE) {
        for (let lastPositionsLeftTree of this.calculateLastPosition(c1)) {
          for (let firstPositionsLeftTree of this.calculateFirstPosition(c1)) {
            table[lastPositionsLeftTree.getUniqueTree()].push(firstPositionsLeftTree);
          }
        }
      }

      return table;
    }
  }

  getSymbols(expression) {
    const symbols = [];

    for (let symbol of expression) {
      if (
        symbols !== constants.OR &&
        symbols !== constants.KLEEN_CLOSURE &&
        symbols !== constants.POSITIVE_CLOSURE &&
        symbols !== constants.ZERO_OR_ONE &&
        symbols !== constants.NEW_CONCAT &&
        symbols !== constants.OPEN_PARENTHESIS &&
        symbols !== constants.CLOSING_PARENTHESIS && 
        symbols !== constants.EPSILON &&
        !symbols.includes(symbol)
        ) {
        symbols.push(symbol);
        
      }
    }

    return symbols;
  }

  calculateMovement(automata, state, isNew) {
    let stateAlreadyInAutomata = true;
    const listOfStates = state.map(tree => tree.getUniqueTree());
    for (let state of automata) {
      const stateValue = state.value.map(tree => tree.getUniqueTree());
      if (isEqual(countBy(stateValue), countBy(listOfStates))) {
        (isNew) ? stateAlreadyInAutomata = state : stateAlreadyInAutomata = false;
      }
    }

    return stateAlreadyInAutomata;
  }

  directAlgorithm(firstPosition, lastPosition, table) {
    const automata = [{
      value: firstPosition,
      id: 0,
      transitions: [],
      isAcceptanceState: false
    }];

    const initialValueUUIDs = automata[0].value.map(tree => tree.getUniqueTree());

    if (initialValueUUIDs.includes(last(lastPosition).getUniqueTree())) automata[0].isAcceptanceState = true;

    const symbols = this.getSymbols(this.r);

    for (let state of automata) {
      for (let symbol of symbols) {
        const valueTrees = [];
        const valueTreesUUIDs = [];

        for (let singleValue of state.value) {
          if (singleValue.head === symbol) {
            const TreesRelatedToSingleValue = table[singleValue.getUniqueTree()];

            for (let tree of TreesRelatedToSingleValue) {
              if (!valueTreesUUIDs.includes(tree.getUniqueTree())) {
                valueTrees.push(tree);
                valueTreesUUIDs.push(tree.getUniqueTree());
              }
            }
          }
        }

        // Calcular si me puedo mover a algún estado en el automata con los valueTrees actuales
        // Si no hay un estado al que me pueda mover, añadir el nuevo estado al autómata
        // a las transiciones del estado actual añadir una transición de dicho estado al nuevo estado
        if (this.calculateMovement(automata, valueTrees, false) && !isEmpty(valueTrees)) {
          const newState = {
            value: valueTrees,
            id: automata.length,
            transitions: [],
            isAcceptanceState: false
          }
          if (valueTreesUUIDs.includes(last(lastPosition).getUniqueTree())) newState.isAcceptanceState = true;

          automata.push(newState);
          state.transitions.push({ symbol: symbol, id: last(automata).id });
        }

        // Calcular si me puedo mover a algún estado en el automata con los valueTrees actuales
        // Si si hay un estado al que me pueda mover, añadirlo a las transiciones del estado actual
        else if (!isEmpty(valueTrees)) {
          const endState = this.calculateMovement(automata, valueTrees, true);
          if (endState) state.transitions.push({ symbol: symbol, id: endState.id });
        }
      }
    }
    return automata;
  }

  buildAutomata(rawAutomata) {
    const automata = [];
    const startEndNodes = [];

    for (let state of rawAutomata) {
      for (let transition of state.transitions) {
        automata.push([state.id.toString(), transition.symbol, transition.id.toString()])
      }

      if (state.isAcceptanceState) {
        startEndNodes.push(["0", state.id.toString()])
      }
    }

    return { automata, startEndNodes }
  }

  buildTableWithEmptyValues(states) {
    let table = {};
    for (let singleValue of states) table[singleValue.getUniqueTree()] = []
    return table;
  }

  getDirectDFA(r) {
    this.r = r;
    const syntacticTree = this.buildTree(this.r);

    const states = this.getStates(syntacticTree);

    const firstPositionArray = this.calculateFirstPosition(syntacticTree);
    const lastPositionArray = this.calculateLastPosition(syntacticTree);

    const tableWithEmptyValues = this.buildTableWithEmptyValues(states);
    const tableWithFilledValues = this.calculateNextPosition(syntacticTree, tableWithEmptyValues);

    const rawAutomata = this.directAlgorithm(firstPositionArray, lastPositionArray, tableWithFilledValues);

    const { automata, startEndNodes } = this.buildAutomata(rawAutomata);

    this.directDFA = automata;
    this.directDFAStartEndNodes = startEndNodes;

    return {
      directDFA: this.directDFA,
      directDFAStartEndNodes: this.directDFAStartEndNodes
    }
  }

  getPossibleMoves(initialState, symbol, automata) {
    const possibleMoves = [];

    for (let state of automata) {
      if (state[0] === initialState && state[1] === symbol) possibleMoves.push(state);
    }

    return possibleMoves;
  }

  move(initalStates, expression, automata) {

    const listOfStates = [...initalStates];
    const possibleMoves = [];

    for (let state of listOfStates) {
      const moves = this.getPossibleMoves(state, expression, automata);

      for (let possibleMove of moves) possibleMoves.push(possibleMove[2])
    }

    possibleMoves.filter((item, index) => possibleMoves.indexOf(item) === index);

    return new Set(possibleMoves);
  }

  validateString(string) {
    const stringToValidate = string;

    let start = first(first(this.directDFAStartEndNodes));

    for (let character of stringToValidate.split("")) {
      let possibleMovements = [];
      try {
        possibleMovements = this.move(start, character, this.directDFA);
        start = first([...possibleMovements]);
      } catch (err) {
        return false;
      }
    }

    for (let startEndNode of this.directDFAStartEndNodes) {
      if (start == startEndNode[1]) {
        return true;
      }
    }

    return false;
  }
}
