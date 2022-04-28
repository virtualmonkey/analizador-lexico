from graphviz import Digraph
import json

jsonFile = open("./directDFA.json")

data = json.load(jsonFile)

automata = data["automata"]
acceptanceStates = data["acceptanceStates"]

dot = Digraph(name="DFA by direct method")
dot.attr(rankdir="LR", size="10")
dot.attr("node", shape="circle", style="filled", fillcolor="#26C485")

for currentState in range(len(acceptanceStates)):
    dot.node(str(acceptanceStates[currentState]))
    
dot.attr("node", shape="circle", style="filled", fillcolor="#f64747")

for transition in range(len(automata)):
    dot.edge(str(automata[transition]["initialState"]), str(automata[transition]["finalState"]), label= str(automata[transition]["symbol"]))

dot.render("graphs/directDFA.gv", view=True)