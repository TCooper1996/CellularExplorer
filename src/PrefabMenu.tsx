import React, {useState, useRef, SyntheticEvent, useEffect} from 'react';
import {printGrid, CellGrid, Cell, GridMap, CopyGrid, Create2DArray, UpdateCells} from './CellTypes';
import {patterns} from './cellPatterns';


interface Automaton{
  left: string,
  top: string,
  grid: CellGrid;
  name: string;
  type: string;
}


interface MouseCallbacks{
    onMouseEnter: () => void
    onMouseLeave: () => void
}


type ButtonClickCallback = (grid: CellGrid, name: string) => void
type RenderFunction = () => JSX.Element
type IsSelectedFunction = (name: string) => boolean

type Action = () => void

const buttonXDistance = 20
const buttonYDistance = 10
const bottomYAxis = 32
const dummyCallback = () => {}



// The oscillator prefabs, which are displayed on the bottom row, will animate on hover.
// This function handles their local state.
function RenderOscillator(props: {a: Automaton, onClick: Action, isSelected: (name:string)=>boolean}){
    const {a, onClick, isSelected} = props
    const [grid, updateGrid] = useState(CopyGrid(a.grid))
    const ref = useRef(grid)
    
    // To avoid worrying about using a timeout variable that is sometimes undefined, I use a function which, before the mouse hovers over a prefab,
    // does nothing, but afterwards, will clear the timeout variable in the onMouseEnter function.
    const [clearTimer, updateClearTimer] = useState(() => () => {})

    const updateState = (prevGrid?:CellGrid) => {
        updateGrid(prev => {
            ref.current = prevGrid ? prevGrid : UpdateCells(prev)
            return ref.current
        })
    }

    // Replace automatons grid with current animated grid.
    const automatonToRender = {...a, grid:ref.current}

    const onMouseEnter = () =>{

        const timer = setInterval(() => {
            updateState()
            
        }, 500)
        updateClearTimer(() => () => clearInterval(timer))

    }

    // Clear timer and return renderFunction to its orginal function.
    const onMouseLeave = () => {
        clearTimer()
        updateState(a.grid)
    }

    return RenderPattern(automatonToRender, onClick, isSelected, {onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave})
}

function PrefabMenu(props: {onButtonClick:ButtonClickCallback, isSelected:IsSelectedFunction}){
    
        const prefabs = GetAutomata().map(a => {
            const onClick = () => props.onButtonClick(a.grid, a.name)
            const isSelected = (name:string) => props.isSelected(name)
            const isOscillator = a.type === "oscillators"
            return (<div>
                {isOscillator
                ? <RenderOscillator a={a} onClick={onClick} isSelected={isSelected}/>
                : RenderPattern(a, onClick, isSelected)
            }</div>)})
                //return renderPattern(a, props.onButtonClick, props.isSelected}))
        
        return(
        <ul id={"prefabMenu"}>
            {prefabs}
        </ul>
        )

        
}


 //Renders a single automaton
function RenderPattern(automaton:Automaton, onClick: Action, isSelected: (name:string)=>boolean, callbacks?:MouseCallbacks){
    const {left, top, grid, name, type} = automaton
    const fontSize = name.length > 9 ? "0.5vw" : "1vw"
    const className = "prefabContainer" + (isSelected(name) ? " selectedPrefab" : "") 
    
    return (
    <li key={name} className="prefabAnchor" style={{left: left, top: top}}>
        <PrefabButton className={className} prefabName={name} grid={grid} fontSize={fontSize} onClick={onClick} onMouseEnter={callbacks?.onMouseEnter} onMouseLeave={callbacks?.onMouseLeave}/>
    </li>
    )

} 

// Determines the structure of the prefab button and issues callbacks
export function PrefabButton(props: {className:string, prefabName:string, grid:CellGrid, fontSize:string, onClick?:any, onMouseEnter?:Action, onMouseLeave?:Action}){
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