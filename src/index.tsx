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

type booleanGrid = Cell[][]

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


class Conway extends React.Component<{}, {size: number, board: booleanGrid, running: boolean, timer: NodeJS.Timeout, dragBuffer?: booleanGrid, currentPatternBuffered: string}>{
  
  constructor(props: {}){
    super(props)
    

    //2d board
    const board: booleanGrid = Array(ConwayBoardMinSize).fill(null).map(_ => {
      return Array(ConwayBoardMinSize).fill({isAlive:false, isShadowed:false})
    })

    const shadowBoard = board

    const timer = setInterval(() => this.playButtonHandler(), 500)

    this.BoardGrid = this.BoardGrid.bind(this)
    this.PrefabBoardGrid = this.PrefabBoardGrid.bind(this)
    this.PrefabsMenu = this.PrefabsMenu.bind(this)
    this.adjustSize = this.adjustSize.bind(this)
    //this.RenderSizeSlider = this.RenderSizeSlider.bind(this)
    //this.PrefabColumn = this.PrefabColumn.bind(this)
    //this.PrefabPreview = this.PrefabPreview.bind(this)

    this.state = {currentPatternBuffered: "", size: ConwayBoardMinSize, board: board, running: false,
     timer: timer, dragBuffer: undefined}
  }

  adjustSize(event: Event, value: number|number[]){
    const oldBoard = this.state.board

    const newBoard: booleanGrid = Array(value as number).fill(null)
        .map((row,rowInd) => Array(value as number).fill(false)
        .map((col,colInd) => (rowInd < oldBoard.length) ? oldBoard[rowInd][colInd] : {isAlive:false, isShadowed:false}))

    this.setState({board:newBoard})
    
  }


  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column].isAlive = !board[row][column].isAlive
    this.setState({board: board})
  }

  clickHandlerPrefabGrid(grid: boolean[][], name: string){
    if (!this.state.currentPatternBuffered || this.state.currentPatternBuffered !== name){
      const updatedBoard = this.state.board.map((row, rowInd) => row.map((cell, colInd) => {return {isAlive:cell.isAlive, isShadowed:grid[rowInd][colInd]}}))
      this.setState({board: updatedBoard, currentPatternBuffered: name})

    }else if (this.state.currentPatternBuffered === name){
      this.clearBufferAndShadow()

    }
  }

  clearBufferAndShadow(){

    const unshadowedBoard = this.state.board.map(row => {
      return row.map(cell => {return {isAlive:cell.isAlive, isShadowed:false}})
    })
    this.setState({currentPatternBuffered: "", board: unshadowedBoard})
  }

  // Write the contents of the shadow buffer to the main grid.
  // Maintain existing data
  copyShadowBuffer(){
    const board = this.state.board.map((row, rInd) => 
      row.map((cell, cInd) => {return {isAlive: cell.isShadowed, isShadowed: cell.isShadowed}})
    )
    this.setState({board: board})
  }


  // This function is called when cells on the main board have a prefab dragged over them
  // This function effectively pastes the selected prefab onto the board starting at the mouses-position.
  cellHoverHandler(mouse_row: number, mouse_col: number){
    if (this.state.dragBuffer){
      const size = this.state.size
      const rows = this.state.dragBuffer.length
      const cols = this.state.dragBuffer[0].length
      const dBuffer = this.state.dragBuffer

      const updateCell = (cell:Cell, row:number, col:number) => {
        return {isAlive: row+mouse_row,
                isShadowed:     
        }
      }

      // Get copy of 2d board.
      const board = this.state.board.map((row, rowInd) => 
              row.map((col, colInd) => ))

      for (let row = 0; row < rows; row ++){
        for (let col = 0; col < cols; col ++){
          let finalRow = row + mouse_row
          let finalCol = col + mouse_col
          if (dBuffer[row][col] && board.length > finalRow && board[0].length > finalCol){
            board[finalRow][finalCol] = true
          }
        }
      }

      this.setState({shadowBuffer: board})
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

    const CalcPos: (ind:number) => [number, number] = (ind:number) => {
      const x = (ind < 3 || ind > 5) ?  -xDist + Math.floor(ind/3)*xDist : -12 + (ind%3)*12
      const y = (ind < 3 || ind > 5) ? (ind%3)*10 : 30
      
      return [x,y]
    }
    const patternList = patterns.flatMap(p => p.patterns)
    const angle = (Math.PI)/(patternList.length-1)
    /*const automata = patternList.map((a, ind): Automaton => ({x: Math.cos(Math.PI+angle*ind)*20, y: Math.sin(angle*ind)*25+10, grid: a.pattern, name:a.name}))*/
    const automata = patternList.map((a, ind): Automaton => ({pos:CalcPos(ind), grid: a.pattern, name:a.name}))

    return(
      <div id={"prefabMenu"}>
        {
         automata.map(a => {

          const containerWidth = floatToVW(prefabContainerWidth)
          const containerPaddedWidth = floatToVW(getPrefabContainerPaddedWidth())
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



  BoardGrid(props: {grid: booleanGrid}){

    const className = "boardGrid"
    const shadowBoard = this.state.shadowBuffer
    const id = "mainBoard"


    return(
      <div className={className} id={id}>{
      props.grid.map((rowArray, rowIndex) => {
        return( 
          <ul key={rowIndex} className={"boardRow"}>{
          rowArray.map((c, cIndex) => {
            let className = c ? "alive cell" : "dead cell";
            if (shadowBoard[rowIndex][cIndex]){
              className = className + " shadow"
            }

            let onMouseEnter = undefined
            let onClickMain = undefined
              if (this.state.currentPatternBuffered){
                onMouseEnter = () => this.cellHoverHandler(rowIndex, cIndex)
                onClickMain = () => this.copyShadowBuffer()
              }else{
                onClickMain = () => this.clickHandler(rowIndex, cIndex)
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
    const paddingTop = height == 1 ? 0 : (1 - height)/2
    const paddingLeft = width == 1 ? 0 : (1 - width)/2
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