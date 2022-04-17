import first from 'lodash/first.js';
import { constants } from '../utils/constants.js';

export default class NDFAToDFA {
  constructor(){
    this.automata = null;
    this.startEndNodes = null;
    this.dfaFinalAutomata = null;
    this.dfaStartEndNodes = null;
    this.stringToValidate = null;
  }

  getSymbols(automata){
    const symbols = [];
  
    for (let transition of automata){
      if (transition[1] !== constants.EPSILON){
        if (!symbols.includes(transition[1])){
          symbols.push(transition[1]);
        }
      }
    }
  
    return symbols;
  }
  
  getPossibleMoves(initialState, symbol, automata){
    const possibleMoves = [];
  
    for (let state of automata){
      if (state[0] === initialState && state[1] === symbol) possibleMoves.push(state);
    }

    return possibleMoves;
  }
  
  eClosureSorT(sOrT, automata){
    let listOfStates = [];
  
    if (typeof sOrT === "number") listOfStates.push(sOrT);
    else listOfStates = [...sOrT];

    if (listOfStates instanceof Array){

      for (let state of listOfStates){
        const possibleMoves = this.getPossibleMoves(state, constants.EPSILON, automata);
        for (let possibleMove of possibleMoves){
          if(!listOfStates.includes(possibleMove[2])) listOfStates.push(possibleMove[2]);
        };
      }
    }

    listOfStates.filter((item, index) => listOfStates.indexOf(item) === index);
  
    return new Set(listOfStates);
  }
  
  move(initalStates, expresion, automata){
    const listOfStates = [...initalStates];
    const possibleMoves = [];
  
    for (let state of listOfStates){
      const moves = this.getPossibleMoves(state, expresion, automata);
      for (let possibleMove of moves) possibleMoves.push(possibleMove[2])
    }
  
    possibleMoves.filter((item, index) => possibleMoves.indexOf(item) === index);
    
    return new Set(possibleMoves);
  }

  nfaLabelsToDfaLabels(automata, DstatesStrings){
    for(let i = 0; i < automata.length; i++){
      automata[i][0] = constants.LETTERS[DstatesStrings.indexOf(Array.from(automata[i][0]).join(' '))];

      automata[i][2] = constants.LETTERS[DstatesStrings.indexOf(Array.from(automata[i][2]).join(' '))];
    }

    return automata;
  }

  nfaLabelsToDfaLabelsStartEndNodes(startEndNodes, DstatesStrings){
    for(let i = 0; i < startEndNodes.length; i++){
      startEndNodes[i] = constants.LETTERS[DstatesStrings.indexOf(Array.from(startEndNodes[i]).join(' '))];
    }
    return startEndNodes;
  }

  subsetsAlgorithm(automata, startEndNodes){
    const symbols = this.getSymbols(automata)

    const Dstates = [];
    let finalAutomata = [];
    Dstates.push(this.eClosureSorT(startEndNodes[0][0], automata));

    let newStartEndNodes = [...Dstates];
  
    let currentState = 0;

    while (currentState < Dstates.length){
      for (let symbol of symbols){
  
        const U = this.eClosureSorT(this.move(Dstates[currentState], symbol, automata), automata);
  
        if (Dstates[currentState].size !== 0 && U.size !== 0){
          finalAutomata.push([Dstates[currentState], symbol, U]);
        }
  
        for (let startEndNode of startEndNodes) if (U.has(startEndNode[1])) newStartEndNodes.push(U);
  
        let _Dstates = [];
        let _U = Array.from(U).join(" ");
  
        for (let Dstate of Dstates) {
          _Dstates.push(Array.from(Dstate).join(" "));
        }
  
        if (!_Dstates.includes(_U) && U !== null){
          Dstates.push(U);
        }
  
      }
      currentState++;
    }
  
    const DstatesStrings = Dstates.map((singleState) => Array.from(singleState).join(' '));
  
    const dfaFinalAutomata = this.nfaLabelsToDfaLabels(finalAutomata, DstatesStrings);
  
    newStartEndNodes = this.nfaLabelsToDfaLabelsStartEndNodes(newStartEndNodes, DstatesStrings)
  
    const dfaStartEndNodes = [];
  
    for(let i = 0; i < newStartEndNodes.length; i++){
      if(newStartEndNodes[0] !== newStartEndNodes[i]) dfaStartEndNodes.push([newStartEndNodes[0], newStartEndNodes[i]]);
    }
  
    return {
      dfaFinalAutomata,
      dfaStartEndNodes
    };
  }

  getDFA(automata, startEndNodes){
    this.automata = automata;
    this.startEndNodes = startEndNodes;

    const { dfaFinalAutomata, dfaStartEndNodes } = this.subsetsAlgorithm(this.automata, this.startEndNodes);

    this.dfaFinalAutomata = dfaFinalAutomata;
    this.dfaStartEndNodes = dfaStartEndNodes;

    return { dfaFinalAutomata, dfaStartEndNodes }
  }

  validateString(string){
    this.stringToValidate = string;

    let start = first(first(this.dfaStartEndNodes));

    for (let character of this.stringToValidate.split("")){
      let possibleMovements = [];
      try {
        possibleMovements = this.move(start, character, this.dfaFinalAutomata);
        start = first([...possibleMovements]);
      } catch(err){
        return false;
      }
    }
    
    for (let startEndNode of this.dfaStartEndNodes){
      if (start == startEndNode[1]){
        return true;
      }
    }

    return false;
  }
}
