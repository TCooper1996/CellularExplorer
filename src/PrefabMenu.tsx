import React, {useState, useRef, SyntheticEvent} from 'react';
import {CellGrid, Cell, GridMap, CopyGrid, Create2DArray, UpdateCells} from './CellTypes';
import {patterns} from './cellPatterns';
import { createRenderer } from 'react-dom/test-utils';


interface Automaton{
  left: string,
  top: string,
  grid: CellGrid;
  name: string;
  type: string;
}

interface RenderableAutomaton{
    automaton: Automaton
    renderer: RenderFunction
}

interface PrefabButtonArguments{
    automaton: Automaton,
    callbacks?: MouseCallbacks,
}

interface MouseCallbacks{
    onMouseEnter: () => void
    onMouseLeave: () => void
}

interface PrefabGrid{
    // The entire grid that is used by UpdateCells
    totalGrid: CellGrid,
    // A smaller 
    viewableGrid: CellGrid
}

type ButtonClickCallback = (grid: CellGrid, name: string) => void
type RenderFunction = () => JSX.Element
type IsSelectedFunction = (name: string) => boolean

type Action = () => void

const buttonXDistance = 20
const buttonYDistance = 10
const bottomYAxis = 32
const automata = GetAutomata()
const dummyCallback = () => {}
/* const automataMap: Map<string, Automaton> = new Map(
    GetAutomata().map(a => [a.name, a] as [string, Automaton]) */
//)

class PrefabMenu extends React.Component<{onButtonClick: ButtonClickCallback}, {selectedPrefabName: string, isSelectedFunction: IsSelectedFunction, prefabButtons: RenderableAutomaton[]}>{
    constructor(props: {onButtonClick: ButtonClickCallback}){
        super(props)
    

        const CreateRenderableAutomaton = (a: Automaton):RenderableAutomaton => {
            return {automaton: a, renderer: this.createRenderFunction(a)}
        }

        const isSelected = (name: string) => false 
        
        const prefabs = GetAutomata().map(CreateRenderableAutomaton)
            //{
              //  const callbacks = (a.type === "oscillators") ? this.buttonStateHandler(a.name, a.grid) : null
                //return {callbacks: this.buttonStateHandler(a.name, a.type, a.grid), automaton:a}})
        this.state = {isSelectedFunction: isSelected, selectedPrefabName: "", prefabButtons: prefabs}
        
    }


    // The oscillator prefabs, which are displayed on the bottom row, will animate on hover.
    // This function handles their local state.
    createOscillatorRenderer(a: Automaton, onClick: Action, isSelected: (name:string)=>boolean){

        // To avoid worrying about using a timeout variable that is sometimes undefined, I use a function which, before the mouse hovers over a prefab,
        // does nothing, but afterwards, will clear the timeout variable in the onMouseEnter function.
        let clearTimer = dummyCallback
        let automatonToRender = {...a}

        const onMouseEnter = () =>{
            let animatedPattern = CopyGrid(a.grid)

            const timer = setInterval(() => {
                animatedPattern = UpdateCells(animatedPattern)
                automatonToRender = {...a, grid:animatedPattern}
                this.setState(this.state) //Force re-render.
                
            }, 500)
            clearTimer = () => {clearInterval(timer)}

        }

        // Clear timer and return renderFunction to its orginal function.
        const onMouseLeave = () => {
            clearTimer()
            automatonToRender = a
            this.setState(this.state) //Force re-render
        }

        return () => renderPattern(automatonToRender, onClick, isSelected, {onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave})
    }



    createRenderFunction(a: Automaton): RenderFunction{
        const onClick = () => this.props.onButtonClick(a.grid, a.name)
        const isSelected = (name:string) => this.state.isSelectedFunction(name)
        if (a.type === "oscillators"){
            return this.createOscillatorRenderer(a, onClick, isSelected)
        }else{
            return () => renderPattern(a, onClick, isSelected)
        }

    }



    render(){
        const renderedButtons = this.state.prefabButtons.map(a => a.renderer())

        return(
        <ul id={"prefabMenu"}>
            {renderedButtons}
        </ul>
        )
    }

}



//Renders a single automaton
function renderPattern(automaton:Automaton, onClick: Action, isSelected: (name:string)=>boolean, callbacks?:MouseCallbacks){
    const {onMouseEnter, onMouseLeave} = callbacks ? callbacks : {onMouseEnter: dummyCallback, onMouseLeave: dummyCallback}
    const {left, top, grid, name, type} = automaton
    const fontSize = name.length > 9 ? "0.5vw" : "1vw"
    const className = "prefabContainer" + (isSelected(name) ? " selectedPrefab" : "") 
    
    return (
    <li key={name} className="prefabAnchor" style={{left: left, top: top}}>
        <PrefabButton className={className} prefabName={name} grid={grid} fontSize={fontSize} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}/>
    </li>
    )

}

// Determines the structure of the prefab button and issues callbacks
function PrefabButton(props: {className:string, prefabName:string, grid:CellGrid, fontSize:string, onClick:any, onMouseEnter:Action, onMouseLeave:Action}){
    const {className, prefabName, grid, fontSize, onClick, onMouseEnter, onMouseLeave} = props
    return (
        <div className={className} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                <div className="prefabNameContainer">
                    <p className="prefabName" style={{fontSize:fontSize}}>{prefabName.toLocaleUpperCase()}</p>
                    <div className ="prefabNameOverlay"></div>
                </div>
                <div className="prefabContainerWrapper"><PrefabBoardGrid grid={grid} name={prefabName}/></div>
        </div>
    )
}

// Builds the actual grid out of a 2D grid of list items.
function PrefabBoardGrid(props: {name: string; grid: Cell[][]}){

  const className = "prefabBoardGrid"
  const numOfRows = props.grid.length
  const numOfCols = props.grid[0].length
  const width = Math.min(numOfCols / numOfRows, 1)
  const height = Math.min(numOfRows / numOfCols, 1)
  const paddingTop = height === 1 ? 0 : (1 - height)/2
  const paddingLeft = width === 1 ? 0 : (1 - width)/2
  const fmt = (x:number) => x*100+"%"


  return(
    <div className={className}
    style={{width: fmt(width), height: fmt(height), paddingTop: fmt(paddingTop), paddingLeft:fmt(paddingLeft)}}>{
    props.grid.map((rowArray, rowIndex) => {
      return( 
        <ul key={rowIndex} className={"boardRow"}>{
        rowArray.map((c, cIndex) => {
          let className = c.isAlive ? "alive cell" : "dead cell";
          return(
            <ul key={rowIndex*rowArray.length + cIndex} className={className}/>
          )
        })}
        </ul>
    )})}
      </div>
      )
}


function GetAutomata(){
    return patterns
        .flatMap(group => group.patterns
            .map(pattern => {return {...pattern, groupName: group.groupName}})) // Flatten and add group name to each pattern
        // Convert into Automaton
        // Use GridMap to turn the grid of bools into grid of Cell objects.
        .map((a, ind): Automaton => ({
            ...CalcPos(ind),
            grid: GridMap(a.pattern, (m) => {return {isAlive: m}}),
            name: a.name,
            type: a.groupName
    }))
}



function CalcPos(ind:number): {left:string, top:string}{
    const x = (ind < 3 || ind > 5) ?  -buttonXDistance + Math.floor(ind/3)*buttonXDistance : -12 + (ind%3)*12
    const y = (ind < 3 || ind > 5) ? (ind%3)*buttonYDistance : bottomYAxis
    
    return {left:x.toString() + "vw", 
            top:y.toString() + "vw"}
}



export {PrefabMenu}