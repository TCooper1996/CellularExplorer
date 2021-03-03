import React, {useState, SyntheticEvent} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {patterns} from './cellPatterns'

type booleanGrid = boolean[][]
type patternObj = {name: string, pattern: booleanGrid}
enum GridType {MainGrid, Minigrid}

function App(props:{}){
  //const apps = [{component:Conway}, {component:Wolfram}]
const apps = [{name: "Conway", component: <Conway></Conway>}, {name: "Elementary", component: <Elementary></Elementary>}]

  const [appIndex, setAppIndex] = useState(0)

  return(
    <div id={"App"}>
      <div id={"menuBar"}>
        {apps.map((app, ind) => {
          const onClick = () => {setAppIndex(ind)}
        return <button onClick={onClick}>{apps[ind].name}</button>
        })}
      </div>

      <div>
        {apps[appIndex].component}
      </div>
    </div>
  )
}


class Conway extends React.Component<{}, {size: number, board: booleanGrid, shadowBuffer: booleanGrid, running: boolean, timer: NodeJS.Timeout, dragBuffer?: booleanGrid, currentPatternBuffered?: string}>{
  
  constructor(props: {}){
    super(props)
    const size = 15

    //2d board
    const board: booleanGrid = Array(size).fill(null).map(_ => {
      return Array(size).fill(false)
    })

    const shadowBoard = board

    const timer = setInterval(() => this.playButtonHandler(), 500)

    this.BoardGrid = this.BoardGrid.bind(this)
    this.PrefabsMenu = this.PrefabsMenu.bind(this)
    this.PrefabColumn = this.PrefabColumn.bind(this)
    this.PrefabPreview = this.PrefabPreview.bind(this)

    this.state = {currentPatternBuffered: undefined, size: size, board: board, running: false, timer: timer, dragBuffer: undefined, shadowBuffer: shadowBoard}
  }


  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column] = !board[row][column]
    this.setState({board: board})
  }

  clickHandlerPrefabGrid(grid: booleanGrid, name: string){
    if (!this.state.currentPatternBuffered || this.state.currentPatternBuffered !== name){
      this.setState({dragBuffer: grid, currentPatternBuffered: name})

    }else if (this.state.currentPatternBuffered === name){
      this.clearBufferAndShadow()

    }
  }

  clearBufferAndShadow(){
    const emptyBoard = this.state.shadowBuffer.map(row => {
      return row.map(_ => false)
    })
    this.setState({dragBuffer: undefined, currentPatternBuffered: undefined, shadowBuffer: emptyBoard})
  }

  // Write the contents of the shadow buffer to the main grid.
  // Maintain existing data
  copyShadowBuffer(){
    const sBoard = this.state.shadowBuffer
    const board = this.state.board.map((row, rInd) => 
      row.map((cell, cInd) => cell || sBoard[rInd][cInd])
    )
    this.setState({board: board})
  }


  // This function is called when cells on the main board have a prefab dragged over them
  // This function takes the cell that the mouse is currently on, in the form if its row and column, 
  // and maps the cell pattern currently in the drag buffer onto the main grid, with the top-left most 
  // alive cell in the dragBuffer being mapped onto the cell that the mouse is on.
  cellHoverHandler(mouse_row: number, mouse_col: number){
    if (this.state.dragBuffer){
      const size = this.state.size
      const dSize = this.state.dragBuffer.length
      const dBuffer = this.state.dragBuffer

      // Identify top-left most living cell in the dragBuffer
      let offset = 0;
      for (let i = 0; i < dSize; i ++){
        if (dBuffer[i][i]){
          offset = i;
          break;
        }
      }

      // Get copy of 2d board.
      const board = Array(size).fill(null).map(_ => Array(size).fill(false))

      for (let row = 0; row < dSize; row ++){
        for (let col = 0; col < dSize; col ++){
          let finalRow = row + mouse_row - offset
          let finalCol = col + mouse_col - offset
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
        return judge(cell, neighbors)
      })
    })
    this.setState({board: newBoard})
  }

  renderBoard(){
    return <this.BoardGrid grid={this.state.board} gridType={GridType.MainGrid}/>
  }

  PrefabsMenu(){
  return(
      <div id={"prefabMenu"}>
        <div id={"prefabMenuHeaders"}>
        {patterns.map((patternGroup) => {
          return <span>{patternGroup.groupName}</span>
        })}
        </div>
      <div id={"prefabScrollableArea"}>
        {patterns.map((patternGroup) => {
          
          return <this.PrefabColumn groupName={patternGroup.groupName} pattern={patternGroup.patterns}/>
        })}
        </div>
      </div>
  )
}

PrefabColumn(props: {groupName: string, pattern: patternObj[]}){
  return (
    <div className={"prefabColumn"}>
      <ul>
        {props.pattern.map((val, index) => {
          const highlightedTag = (this.state.currentPatternBuffered === val.name) ? "highlightedPrefabPreview" : ""
          return <li className={"prefabPreview"} id={highlightedTag} key={val.name} onClick={() => this.clickHandlerPrefabGrid(val.pattern, val.name)}>
            <this.PrefabPreview name={val.name} pattern={val.pattern}/>
            </li>
        })}
      </ul>
    </div>
  )
}

PrefabPreview(props: {name: string, pattern: booleanGrid}){
  return (
    <>
    <div className={"miniBoardGridContainer"}>
    <this.BoardGrid grid={props.pattern}  gridType={GridType.Minigrid}/>
    </div>
    <p>{props.name}</p>
    </>
  )
}

  BoardGrid(props: {grid: booleanGrid, gridType: GridType}){

    const isMainBoard = props.gridType === GridType.MainGrid
    const className = (isMainBoard) ? "boardGrid" : "miniBoard boardGrid"
    const shadowBoard = this.state.shadowBuffer
    const id = (isMainBoard) ? "mainBoard" : undefined


    return(
      <div className={className} id={id}>{
      props.grid.map((rowArray, rowIndex) => {
        return( 
          <ul className={"boardRow"}>{
          rowArray.map((c, cIndex) => {
            let className = c ? "alive cell" : "dead cell";
            if (isMainBoard && shadowBoard[rowIndex][cIndex]){
              className = className + " shadow"
            }

            let onMouseEnter = undefined
            let onClickMain = undefined
            // Only the main board has an event attatched to the <li> element.
            if (isMainBoard){
              if (this.state.currentPatternBuffered){
                onMouseEnter = () => this.cellHoverHandler(rowIndex, cIndex)
                onClickMain = () => this.copyShadowBuffer()
              }else{
                onClickMain = () => this.clickHandler(rowIndex, cIndex)
              }
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


  render(){
    let running = this.state.running;
    let buttonText = (running) ? "Pause": "Play"
    return(
      <>
        <div id={"mainDiv"}>
          <div id={"mainBoardContainer"}>
          {this.renderBoard()}
          <PlayButton onClick={() => this.flipRunningState()} text={buttonText}></PlayButton>
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