import promptSync from 'prompt-sync';
import NDFA from './NDFA/NDFA.js';
import NDFAToDFA from './NDFAToDFA/NDFAToDFA.js'

const prompt = promptSync();

while (true){
  console.log("\n-------------------------------------------");
  console.log("+++ Analizador de expresiones regulares +++");
  console.log("-------------------------------------------");
  console.log("\nIngrese una opción del menú: \n");
  console.log("1. Construir un AFD a partir de un AFN construido a través de una expresión regular \n2. Salir\n");
  const menuSelection = prompt(">> ");

  if(menuSelection === "1"){
    const r = prompt("Ingrese la expresión regular r >> ");

    const rClean = r.replace(/\s+/g, '')
    
    const ndfaInstance = new NDFA();
    const ndfa = ndfaInstance.getNDFA(rClean);

    const dfaInstance = new NDFAToDFA();

    const dfa = dfaInstance.getDFA(ndfa.automata, ndfa.startEndNodes)

    console.log("dfaFinalAutomata ", dfa.dfaFinalAutomata);
    console.log("dfaStartEndNodes ", dfa.dfaStartEndNodes)

    const w = prompt("Ingrese la cadena a validar >> ");

    const result = dfaInstance.validateString(w);

    if (!!result){
      console.log("\nLa cadena w si pertenece al lenguaje generado por el AF(L(r))!")
    } else {
      console.log("\nLa cadena w no pertenece al lenguaje generado por el AF(L(r))!")
    }
  }

  else if (menuSelection == "2"){
    console.log("Hasta luego!");
    break;
  }
  else {
    console.log("Porfavor ingrese un número del menú");
  }
}
