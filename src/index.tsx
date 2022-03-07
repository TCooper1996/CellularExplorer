import React, {useState, SyntheticEvent} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {patterns} from './cellPatterns'
import { isExternalModuleNameRelative, isPropertySignature, isThisTypeNode } from 'typescript';
import Slider from '@mui/material/Slider';

const prefabContainerWidth = 9
const ConwayBoardMinSize = 15
const ConwayBoardMaxSize = 30
const getPrefabContainerPaddedWidth = () => (prefabContainerWidth-1)
const floatToVW= (num:number):string => num + "vw"

type BooleanGrid = boolean[][]
type CellGrid = Cell[][]

function App(props:{}){
  //const apps = [{component:Conway}, {component:Wolfram}]
const apps = [{name: "Conway", component: <Conway></Conway>}, {name: "Elementary", component: <Elementary></Elementary>}]

  const [appIndex, setAppIndex] = useState(0)

  return(
    <div id={"App"}>
      <div id={"menuBar"}>
        {apps.map((app, ind) => {
          const onClick = () => {setAppIndex(ind)}
        return <button key={app.name} onClick={onClick}>{apps[ind].name}</button>
        })}
      </div>

      <div>
        {apps[appIndex].component}
      </div>
    </div>
  )
}

interface Cell{
  isAlive:boolean
  isShadowed: boolean
}

const Create2DArray = (width:number, height?:number, val?:any) => {
  const h = height === undefined ? width : height
  return Array.from(Array(h), () =>
      new Array(width).fill(val === undefined ? null : val)
)}

const GridMap = (grid:CellGrid, func: (cell:Cell, row:number, col:number) => Cell) => { 
  return grid.map((row, rowInd) => row.map((cell, colInd) => func(cell, rowInd, colInd)))
}



class Conway extends React.Component<{}, {size: number, board: CellGrid, running: boolean, timer: NodeJS.Timeout, dragBuffer?: BooleanGrid, currentPatternBuffered: string}>{
  
  constructor(props: {}){
    super(props)
    

    //2d board
    const board: CellGrid = GridMap(Create2DArray(ConwayBoardMinSize, ConwayBoardMinSize), (_:Cell) => {return {isAlive:false, isShadowed:false}})


    const timer = setInterval(() => this.playButtonHandler(), 500)

    this.BoardGrid = this.BoardGrid.bind(this)
    this.PrefabBoardGrid = this.PrefabBoardGrid.bind(this)
    this.PrefabsMenu = this.PrefabsMenu.bind(this)
    this.adjustSize = this.adjustSize.bind(this)

    this.state = {currentPatternBuffered: "", size: ConwayBoardMinSize, board: board, running: false,
     timer: timer, dragBuffer: undefined}
  }

  adjustSize(event: Event, value: number|number[]){
    const size = value as number
    if (size == this.state.board.length)
    {
      return
    }
    const oldBoard = this.state.board
    const mapCell = (_:Cell, row: number, col:number) => 
          (row < oldBoard.length && col < oldBoard.length)
          ? oldBoard[row][col]
          : {isAlive:false, isShadowed:false}

    const newBoard = GridMap(Create2DArray(size), mapCell)

    this.setState({board:newBoard})
    
  }


  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column].isAlive = !board[row][column].isAlive
    this.setState({board: board})
  }

  // This function is called when we click on a prefab. Grid is the grid representing the prefabs cells, and name is the automatatons name.
  // We save the grid to a buffer in the state to use later when the mouse hovers over the main board.
  clickHandlerPrefabGrid(grid: boolean[][], name: string){
    if (!this.state.currentPatternBuffered || this.state.currentPatternBuffered !== name){
      
      this.setState({dragBuffer:grid, currentPatternBuffered: name})

    }else if (this.state.currentPatternBuffered === name){
      this.clearBufferAndShadow()

    }
  }

  clearBufferAndShadow(){

    const unshadowedBoard = GridMap(this.state.board, 
      (cell, _, __) => {return {isAlive: cell.isAlive, isShadowed:false}}
      )
    this.setState({dragBuffer:undefined, currentPatternBuffered: "", board: unshadowedBoard})
  }

  // Occurs when the main grid is clicked and a prefab is currently selected.
  // Sets the living state of each cell to its shadowed state, effectively pasting the prefab onto the grid.
  copyShadowBuffer(){
    const board = this.state.board.map((row, rInd) => 
      row.map((cell, cInd) => {return {isAlive: cell.isShadowed, isShadowed: cell.isShadowed}})
    )
    this.setState({board: board})
  }


  // This function is called when cells on the main board have a prefab dragged over them
  // This function should not affect the IsAlive state of each cell; just the isShadowed property. 
  
  cellHoverHandler(mouse_row: number, mouse_col: number){
    if (this.state.dragBuffer){
      const dBuffer = this.state.dragBuffer
      const isWithinGridBounds = (rInd:number, cInd:number) => 
        rInd >= 0 && cInd >= 0
        && rInd < dBuffer.length && cInd < dBuffer[0].length 
      


      const board = GridMap(this.state.board, 
        (cell, row, col) => {
          const bRow = row - mouse_row
          const bCol = col - mouse_col
          return {
            isAlive: cell.isAlive,
            isShadowed: isWithinGridBounds(bRow, bCol) && dBuffer[bRow][bCol]
          }
        }
      )

      this.setState({board: board})
      }

  }

  flipRunningState(){
    this.setState({running: !this.state.running})
  }

  playButtonHandler(){
    if (this.state.running){
      this.stepOnce()
    }
  }

  stepOnce(){
    const board = this.state.board;
    const newBoard = board.map((rowArray, rowIndex) => {
      return rowArray.map((cell, cIndex) => {
        let neighbors = 0;
        for (let r = -1; r < 2; r++ ){
          for (let c = -1; c < 2; c++ ){
            const neighborRow = rowIndex - r
            const neighborCol = cIndex - c
            if (0 <= neighborRow && neighborRow < rowArray.length // Ensure valid row
               && 0 <= neighborCol && neighborCol < rowArray.length // Ensure valid column
               && !(neighborRow === rowIndex && cIndex === neighborCol) // Do not count self as neighbor
               && board[neighborRow][neighborCol]){ //Only alive cells are neighbors
                neighbors += 1
            }
          }
        }
        return {isAlive:judge(cell.isAlive, neighbors), isShadowed:cell.isShadowed}
      })
    })
    this.setState({board: newBoard})
  }


  renderBoard(){
    return <this.BoardGrid grid={this.state.board}/>
  }

  PrefabsMenu(){
    interface Automaton{
      pos: [number, number]
      grid: boolean[][];
      name: string;
    }
    const xDist = 20
    const yDist = 10
    const bottomYAxis = 30

    const CalcPos: (ind:number) => [number, number] = (ind:number) => {
      const x = (ind < 3 || ind > 5) ?  -xDist + Math.floor(ind/3)*xDist : -12 + (ind%3)*12
      const y = (ind < 3 || ind > 5) ? (ind%3)*yDist : bottomYAxis
      
      return [x,y]
    }
    const patternList = patterns.flatMap(p => p.patterns)
    /*const automata = patternList.map((a, ind): Automaton => ({x: Math.cos(Math.PI+angle*ind)*20, y: Math.sin(angle*ind)*25+10, grid: a.pattern, name:a.name}))*/
    const automata = patternList.map((a, ind): Automaton => ({pos:CalcPos(ind), grid: a.pattern, name:a.name}))

    return(
      <div id={"prefabMenu"}>
        {
         automata.map(a => {

          const fontSize = a.name.length > 9 ? "0.5vw" : "1vw"
          const prefabContainerClassName = "prefabContainer" + (this.state.currentPatternBuffered.toUpperCase() === a.name.toUpperCase() ? " selectedPrefab" : "")
           return( 
             <li key={a.name} className="prefabAnchor" style={{left:a.pos[0]+"vw", top:a.pos[1]+"vw"}}>
                <div className={prefabContainerClassName} onClick={() => this.clickHandlerPrefabGrid(a.grid, a.name)}>
                      <div className="prefabNameContainer">
                        <p className="prefabName" style={{fontSize:fontSize}}>{a.name.toLocaleUpperCase()}</p>
                        <div className ="prefabNameOverlay"></div>
                      </div>
                      <div className="prefabContainerWrapper"><this.PrefabBoardGrid grid={a.grid} name={a.name}/></div>
                </div>
            </li>
           )
         })
        }
        </div>
    )
  }



  BoardGrid(props: {grid: CellGrid}){

    const className = "boardGrid"
    const id = "mainBoard"
    const getCellClassName = (cell: Cell) => "cell"
          + (cell.isAlive ? " alive" : " dead")
          + (cell.isShadowed ? " shadow" : "")

    return(
      <div className={className} id={id}>{
      props.grid.map((rowArray, rowIndex) => {
        return( 
          <ul key={rowIndex} className={"boardRow"}>{
          rowArray.map((cell, cIndex) => {
            let className = getCellClassName(cell)

            let onMouseEnter = undefined
            let onClickMain = undefined
              if (this.state.currentPatternBuffered === ""){
                onClickMain = () => this.clickHandler(rowIndex, cIndex)
              }else{
                onMouseEnter = () => this.cellHoverHandler(rowIndex, cIndex)
                onClickMain = () => this.copyShadowBuffer()
              }

            return(
              <li key={rowIndex*rowArray.length + cIndex} className={className} onClick={onClickMain} onMouseEnter={onMouseEnter}>
                {
                }
              </li>
            )
          })}
          </ul>
      )})}
        </div>
        )
  }
  
  PrefabBoardGrid(props: {name: string; grid: boolean[][]}){

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
            let className = c ? "alive cell" : "dead cell";
            return(
              <ul key={rowIndex*rowArray.length + cIndex} className={className}>
                {
                }
              </ul>
            )
          })}
          </ul>
      )})}
        </div>
        )
  }



  render(){
    let running = this.state.running;
    let playButtonText = (running) ? "Pause": "Play"
    const playButtonClass = "playButton" + (running ? " active" : "")
    return(
      <>
        <div id={"mainDiv"}>
          <div id={"mainBoardContainer"}>
            <Slider onChange={this.adjustSize} defaultValue={ConwayBoardMinSize} min={ConwayBoardMinSize} max={ConwayBoardMaxSize} step={1} valueLabelDisplay={"auto"}/>
          {this.renderBoard()}
          <button className={playButtonClass} onClick={() => this.flipRunningState()}>{playButtonText}</button>
          <button className={"step"} onClick={() => this.stepOnce()}>Step</button>
          </div>
          <this.PrefabsMenu/>
        </div>
      </>
      )
  }
}

class Elementary extends React.Component<{}, {rule: string, size: number, stepFunc: (parents: boolean[]) => boolean}>{
  constructor(props: {}){
    super(props)
    const size = 25
    const rule = "18"

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleTextChange = this.handleTextChange.bind(this)
    this.handleTextChange2 = this.handleTextChange2.bind(this)

    this.state = {size: size, rule: rule, stepFunc: this.createStepFunction(parseInt(rule))}
  }

  handleTextChange(event: SyntheticEvent){
    const target = event.target as HTMLTextAreaElement
    this.setState({rule: target.value})
  }

  handleSubmit(event: SyntheticEvent){
    const intRule = parseInt(this.state.rule)
    if (isNaN(intRule)){
      alert("String must be numeric")
      return
    }

    this.setState({stepFunc: this.createStepFunction(intRule)})
    event.preventDefault()
  }

  handleTextChange2(event: SyntheticEvent){
    const target = event.target as HTMLTextAreaElement

    const intRule = parseInt(target.value)
    if (isNaN(intRule)){
      alert("String must be numeric")
      return
    }

    this.setState({stepFunc: this.createStepFunction(intRule), rule: target.value})
    event.preventDefault()

  }

  createStepFunction(rule: number){
    return (parents: boolean[]) => {
      // The parents value is a list of true/false values that must be interpeted as a binary number in order to bitshift the rule
      // The map call turns each true value into a power of two based on it's position, and the reduce sums them up.
      //Then we modulo 2 and compare against 1 in order to return true if the last bit is a 1, and 0 otherwise.
      return (rule >> parents.map((val, ind) => val ? 2**(2-ind) : 0)
                            .reduce((x, y) => x + y)) % 2 === 1
    }

  }

  render(){
    return <div id={"ElementaryMainDiv"}>
      <form onSubmit={this.handleSubmit}>
        <label>
          Enter rule #
          <input type="text" value={this.state.rule} onChange={this.handleTextChange2}></input>
        </label>
        <input type="submit" value="Submit"></input>
      </form>
      <br/>
      <ElementaryBoard stepFunc={this.state.stepFunc}/>
    </div>
  }

}

function ElementaryBoard(props: {stepFunc: (parents: boolean[]) => boolean}){
  const width = 39
  const height = 25
  let previousRow = Array(width).fill(null).map((_, index) => index === Math.floor(width/2))
  const board: boolean[][] = Array(height).fill(null).map(_ => Array(width).fill(false))
  board[0] = previousRow.slice()
  for (let r = 1; r < height; r ++){
    for (let c = 0; c < width; c ++){
      let parents = []
      if (c === 0){
        parents = [false].concat(previousRow.slice(0,2))
      }else if (c === width-1){
        parents = previousRow.slice(-2,-1).concat([false])
      }else{
        parents = previousRow.slice(c - 1, c + 2)
      }
      board[r][c] = props.stepFunc(parents)
    }
    previousRow = board[r].slice()
  }

  return(<div className="boardGrid">
    {board.map((row, rowIndex) => 
      <ul key={rowIndex} className="boardRow">
        {row.map((cell, cellIndex) => 
          <li key={rowIndex*width + cellIndex} className={(cell) ? "cell alive" : "cell dead"}>

          </li>
        )}
      </ul>
    )}
    </div>
  )
}


function PlayButton(props: {onClick: () => void, text: string}){
  return <button className={"playButton"} onClick={props.onClick}>{props.text}</button>
}

function judge(isAlive: boolean, neighbors: number){
  // If alive and 2-3 neighbors, survive
  if (isAlive && 2 <= neighbors && neighbors <= 3){
    return true
  }

  //If dead and 3 neighbors, come alive
  if (!isAlive && neighbors === 3){
    return true
  }

  //Otherwise, dead cell
  return false
}



ReactDOM.render(
  <App></App>,
  document.getElementById('root')
)