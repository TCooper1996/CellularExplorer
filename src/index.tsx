import React, {useState, useRef, useEffect, SyntheticEvent} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Elementary} from './ElementaryComponents'
import {patterns} from './cellPatterns'
import Slider from '@mui/material/Slider';

const ConwayBoardMinSize = 15
const ConwayBoardMaxSize = 30

type CellGrid = Cell[][]
type ShadowableCellGrid = ShadowableCell[][]

function App(props:{}){
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
  isAlive: boolean
}
interface ShadowableCell extends Cell{
  isShadowed: boolean
}

interface Automaton{
  pos: [number, number]
  grid: Cell[][];
  name: string;
}

const Create2DArray = (width:number, height?:number, val?:any) => {
  const h = height === undefined ? width : height
  return Array.from(Array(h), () =>
      new Array(width).fill(val === undefined ? null : val)
)}

function GridMap<T, R>(grid:T[][], func: (cell:T, row:number, col:number) => R): R[][]{ 
  return grid.map((row, rowInd) => row.map((cell, colInd) => func(cell, rowInd, colInd)))
}

function CopyGrid(g:CellGrid){
  return GridMap(g, CopyCell)
}

function CopyCell(cell:Cell){
  return Object.assign({}, cell)
}

const IndicesInBounds = (x:number, y:number, xMax:number, yMax:number) => 
      x >= 0 && y >= 0
      && x <= xMax && y <= yMax 



class Conway extends React.Component<{}, {size: number, board: ShadowableCellGrid, running: boolean, timer: NodeJS.Timeout,
   dragBuffer?: CellGrid, currentPatternBuffered: string}>{
  
  constructor(props: {}){
    super(props)
    

    //2d board
    const board = GridMap(Create2DArray(ConwayBoardMinSize, ConwayBoardMinSize), (_:Cell) => {return {isAlive:false, isShadowed:false}})


    const timer = setInterval(() => this.playButtonHandler(), 500)

    this.BoardGrid = this.BoardGrid.bind(this)
    this.MainBoardCell = this.MainBoardCell.bind(this)
    this.PrefabsMenu = this.PrefabsMenu.bind(this)
    this.adjustSize = this.adjustSize.bind(this)
    this.adjustTime = this.adjustTime.bind(this)

    this.state = {currentPatternBuffered: "", size: ConwayBoardMinSize, board: board, running: false,
     timer: timer, dragBuffer: undefined}
  }

  adjustSize(event: Event, value: number|number[]){
    const size = value as number
    if (size === this.state.board.length)
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

  adjustTime(event: Event, value:number|number[]){
    const time = value as number
    clearTimeout(this.state.timer)
    this.setState({timer: setInterval(() => this.playButtonHandler(), time*1000)})
  }




  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column].isAlive = !board[row][column].isAlive
    this.setState({board: board})
  }

  // This function is called when we click on a prefab. Grid is the grid representing the prefabs cells, and name is the automatatons name.
  // We save the grid to a buffer in the state to use later when the mouse hovers over the main board.
  clickHandlerPrefabGrid(grid: CellGrid, name: string){
    if (!this.state.currentPatternBuffered || this.state.currentPatternBuffered !== name){
      
      this.setState({dragBuffer:grid, currentPatternBuffered: name})

    }else if (this.state.currentPatternBuffered === name){
      this.clearBufferAndShadow()

    }
  }

  // Set shadow state of each cell to false, removing the shadow cast by prefabs when the mouse hovers over the main board.
  unShadowBoard(){
    return GridMap(this.state.board, 
      (cell, _, __) => {return {isAlive: cell.isAlive, isShadowed:false}}
      )

  }

  // Called when the mouse leaves the main board to remove the shadow cast be a selected prefab.
  clearShadowBoard(){
    this.setState({board: this.unShadowBoard()})
  }

  clearBufferAndShadow(){

    this.setState({dragBuffer:undefined, currentPatternBuffered: "", board: this.unShadowBoard()})
  }

  // Occurs when the main grid is clicked and a prefab is currently selected.
  // Sets the living state of each cell to its shadowed state, effectively pasting the prefab onto the grid.
  copyShadowBuffer(){
    const board = GridMap(this.state.board, 
      (cell, _, __) => {
        return {isAlive: cell.isShadowed || cell.isAlive, isShadowed: cell.isShadowed}
      }
      )
    this.setState({board: board})
  }


  // This function is called when cells on the main board have a prefab dragged over them
  // This function should not affect the IsAlive state of each cell; just the isShadowed property. 
  
  cellHoverHandler(mouse_row: number, mouse_col: number){
    if (this.state.dragBuffer === undefined){
      return
    }
      const dBuffer = this.state.dragBuffer
      const board = GridMap(this.state.board, 
        (cell, row, col) => {
          const bRow = row - mouse_row
          const bCol = col - mouse_col
          return {
            isAlive: cell.isAlive,
            isShadowed: IndicesInBounds(bRow, bCol, dBuffer.length-1, dBuffer[0].length-1) && dBuffer[bRow][bCol].isAlive
          }
        }
      )

      this.setState({board: board})
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
/*     const board = this.state.board;
    const size = board.length
    // Get list of all neighboring positions
    const getNeighbors = (centerX:number, centerY:number) => 
      [-1, 0, 1]
      .flatMap((x, _, arr) => 
        arr.map(y => {return {x: x+centerX, y:y+centerY}})) // Get all combinations of [-1, 0, 1]
      .filter(pos => !(pos.x === centerX && pos.y === centerY)) // Remove the position {x:centerX, y:centerY} because it is the center cell, not a neighbor.

    // Returns a new cell from existing cell whose isAlive state is set according to the number of living neighbors
    const judgeCell = (cell:Cell, rowIndex:number, cIndex:number) => {
        const neighbors = getNeighbors(rowIndex, cIndex).reduce((acc, next) => 
        IndicesInBounds(next.x, next.y, size-1, size-1) && board[next.x][next.y].isAlive 
        ? acc+1 
        : acc, 
        0)
        return {isAlive:judge(cell.isAlive, neighbors), isShadowed:cell.isShadowed}

    } */
    const board = updateGridState(this.state.board)

    
    this.setState({board: board})
  }



  CompactSlider(props:{onChange:any, name:string, minVal:number, maxVal:number, defaultVal:number}){
    return(
    <div className={"SliderContainer"}>
      <Slider className={"SliderControl"} onChange={props.onChange} min={props.minVal} max={props.maxVal} defaultValue={props.defaultVal}/>
      <div className={"SliderLabel"}>{props.name}</div>
    </div>
    )
  }

  PrefabsMenu(){
    const xDist = 20
    const yDist = 10
    const bottomYAxis = 32

    const CalcPos: (ind:number) => [number, number] = (ind:number) => {
      const x = (ind < 3 || ind > 5) ?  -xDist + Math.floor(ind/3)*xDist : -12 + (ind%3)*12
      const y = (ind < 3 || ind > 5) ? (ind%3)*yDist : bottomYAxis
      
      return [x,y]
    }
    const patternList = patterns.flatMap(p => p.patterns)
    /*const automata = patternList.map((a, ind): Automaton => ({x: Math.cos(Math.PI+angle*ind)*20, y: Math.sin(angle*ind)*25+10, grid: a.pattern, name:a.name}))*/
    const automata = patternList.map((a, ind): Automaton => ({
      pos:CalcPos(ind), 
      grid: GridMap(a.pattern, (m) => { return {isAlive:m}}), 
      name:a.name}))

    return(
      <div id={"prefabMenu"}>
        {
         automata.map(a => {

          const fontSize = a.name.length > 9 ? "0.5vw" : "1vw"
          const isSelected = this.state.currentPatternBuffered.toUpperCase() === a.name.toUpperCase()
          const onClick = () => this.clickHandlerPrefabGrid(GridMap(a.grid, (c => Object.assign({}, c))), a.name)
          return <PrefabButton isSelected={isSelected} left={a.pos[0]+"vw"} top={a.pos[1]+"vw"} prefabName={a.name} prefabGrid={a.grid} fontSize={fontSize} onClick={onClick}/>
         })
        }
        </div>
    )
  }




  BoardGrid(props: {grid: ShadowableCellGrid}){

    const className = "boardGrid"
    const id = "mainBoard"
    const size = props.grid.length
    

    return(
      <div className={className} id={id} onMouseLeave={() => this.clearShadowBoard()}>{
      props.grid.map((rowArray, rowIndex) => {
        return( 
          <ul key={rowIndex} className={"boardRow"}>{
          rowArray.map((cell, cIndex) => {

            return <this.MainBoardCell cell={cell} rInd={rowIndex} cInd={cIndex} cellKey={rowIndex*size+cIndex}/>
            })}
          </ul>
        )})}
        </div>
        )
  }

  MainBoardCell(props: {cell:ShadowableCell, rInd:number, cInd:number, cellKey:number}){
    const className = "cell"
          + (props.cell.isAlive ? " alive" : " dead")
          + (props.cell.isShadowed ? " shadow" : "")

      let onMouseEnter = undefined
      let onClickMain = undefined
        if (this.state.currentPatternBuffered === ""){
          onClickMain = () => this.clickHandler(props.rInd, props.cInd)
        }else{
          onMouseEnter = () => this.cellHoverHandler(props.rInd, props.cInd)
          onClickMain = () => this.copyShadowBuffer()
        }

      return(
        <li key={props.cellKey} className={className} onClick={onClickMain} onMouseEnter={onMouseEnter}/>
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
            <div id={"MainSliderContainer"}>
              <this.CompactSlider onChange={this.adjustSize} name={"Size"} defaultVal={ConwayBoardMinSize} minVal={ConwayBoardMinSize} maxVal={ConwayBoardMaxSize}/>
              <this.CompactSlider onChange={this.adjustTime} name={"Speed"} defaultVal={1} minVal={0.25} maxVal={3}/>

            </div>
            <this.BoardGrid grid={this.state.board}/>
            <button className={playButtonClass} onClick={() => this.flipRunningState()}>{playButtonText}</button>
            <button className={"step"} onClick={() => this.stepOnce()}>Step</button>
          </div>
          <this.PrefabsMenu/>
        </div>
      </>
      )
  }
}

function PrefabButton(props: {isSelected:boolean, left:string, top:string, prefabName:string, prefabGrid:CellGrid, fontSize:string, onClick:any}){
  const [maxExpand, updateMaxSize] = useState(0)
  const GetOriginalState = () => ExpandGrid(CopyGrid(props.prefabGrid), maxExpand)

  
  const [grid, updateGrid] = useState(GetOriginalState)
  const latestGrid = useRef(grid)
  const updateState = (newState?:CellGrid) => {
    updateGrid(prev => {
      const newGrid = newState ? newState : updateGridState(prev)
      latestGrid.current = newGrid
      return newGrid
    })
  }

  const gRows = props.prefabGrid.length
  const gCols = props.prefabGrid[0].length
  // We create a new grid with Expand grid to effectively enlarge the pattern and give it enough space to fully animate.
  const [timer, setTimer] = useState<NodeJS.Timeout|null>(null)
  // I don't want the extra space in the grid to be visible so we create this view below so we only render the size of the original grid.
  // The expanded grid only serves to give the update function, updateGridState, enough room to turn on cells during the animation that might not be included in the props pattern.
  const needsResize = grid.flatMap((row, rowInd) => row.map((c, colInd) => {return {x:colInd, y: rowInd, C:c}})).some(obj => obj.C.isAlive &&  (obj.x === 0 || obj.y === 0 || obj.y === grid.length-1 || obj.x === grid[0].length))
  if (needsResize){
    updateMaxSize(maxExpand+3)
    updateState(ExpandGrid(grid, 3))
  }

  
  const view = grid.slice(maxExpand, gRows+maxExpand).map(row => row.slice(maxExpand, gCols+maxExpand))
  

  if (view.every(r => r.every(c => c.isAlive === false))){
     updateState(GetOriginalState())
  }

  let onHoverEnter = () => {console.log("Setting timer"); setTimer(setInterval(() => updateState(), 500))  } 
  let onHoverExit = () => {clearInterval(timer as NodeJS.Timeout); updateGrid(GetOriginalState());}
  

  const className = "prefabContainer" + (props.isSelected ? " selectedPrefab" : "")
  return (
    <li key={props.prefabName} className="prefabAnchor" style={{left:props.left, top:props.top}}>
      <div className={className} onClick={props.onClick} onMouseEnter={onHoverEnter} onMouseLeave={onHoverExit}>
            <div className="prefabNameContainer">
              <p className="prefabName" style={{fontSize:props.fontSize}}>{props.prefabName.toLocaleUpperCase()}</p>
              <div className ="prefabNameOverlay"></div>
            </div>
            <div className="prefabContainerWrapper"><PrefabBoardGrid grid={view} name={props.prefabName}/></div>
      </div>
  </li>
  )
}

function ExpandGrid(g: Cell[][], size:number){
  if (size === 0){
    return g
  }

  const origRows = g.length
  const origCols = g[0].length
  const newRows = origRows+size*2
  const newCols = origCols+size*2
  const startCol = Math.floor((newCols - origCols)/2)


  return Create2DArray(newCols, newRows, {isAlive: false})
        .map((row, rowInd) => (rowInd >= size && rowInd < newRows - size) ? row.slice(0, startCol).concat(g[rowInd-size], row.slice(0,startCol)) : row)
  // Use GridMap with CopyCell to make sure we have a deep copy and can't change the original grid.


}

function printGrid(g: Cell[][]){
  g.forEach(r => {console.log(r.map(x => x.isAlive ? "O" : "_").join()); console.log()})
}

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


function updateGridState<CellType extends Cell>(grid: CellType[][]):CellType[][]{
  console.log("refreshing")
  const rows = grid.length
  const cols = grid[0].length
  // Get list of all neighboring positions
  const getNeighbors = (centerX:number, centerY:number) => 
    [-1, 0, 1]
    .flatMap((x, _, arr) => 
      arr.map(y => {return {x: x+centerX, y:y+centerY}})) // Get all combinations of [-1, 0, 1]
    .filter(pos => !(pos.x === centerX && pos.y === centerY)) // Remove the position {x:centerX, y:centerY} because it is the center cell, not a neighbor.

  // Returns a new cell from existing cell whose isAlive state is set according to the number of living neighbors
  const judgeCell = (cell:CellType, rowIndex:number, cIndex:number):CellType => {
      const neighbors = getNeighbors(rowIndex, cIndex).reduce((acc, next) => 
      IndicesInBounds(next.x, next.y, rows-1, cols-1) && grid[next.x][next.y].isAlive
      ? acc+1 
      : acc, 
      0)
      const newCell = Object.assign({}, cell)
      newCell.isAlive = judge(newCell.isAlive, neighbors)
      return newCell
  }

  return GridMap(grid, judgeCell)


}


function PlayButton(props: {onClick: () => void, text: string}){
  return <button className={"playButton"} onClick={props.onClick}>{props.text}</button>
}

function judge(isAlive: boolean, neighbors: number){
  // If alive and 2-3 neighbors, survive
  if (isAlive && ((2 === neighbors) || (neighbors === 3))){
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



