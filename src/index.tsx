import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {patterns} from './cellPatterns'

type booleanGrid = boolean[][]
type patternObj = {name: string, pattern: booleanGrid}
enum GridType {MainGrid, Minigrid}


class Game extends React.Component<{}, {size: number, board: booleanGrid, shadowBuffer: booleanGrid, running: boolean, timer: NodeJS.Timeout, dragBuffer?: booleanGrid, currentPatternBuffered?: string}>{
  
  constructor(props: {}){
    super(props)
    const size = 14

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
        {patterns.map((patternGroup) => {
          
          return <this.PrefabColumn groupName={patternGroup.groupName} pattern={patternGroup.patterns}/>
        })}
      </div>
  )
}

PrefabColumn(props: {groupName: string, pattern: patternObj[]}){
  return (
    <div className={"prefabColumn"}>
      <p>{props.groupName}</p>
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
    const className = (isMainBoard) ? "mainBoard boardGrid" : "miniBoard boardGrid"
    const shadowBoard = this.state.shadowBuffer


    return(
      <div className={className}>{
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

            //const onClickMain = (isMainBoard) ? () => this.clickHandler(rowIndex, cIndex) : undefined
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
          {this.renderBoard()}
          <this.PrefabsMenu/>
        </div>
          <PlayButton onClick={() => this.flipRunningState()} text={buttonText}></PlayButton>
          <button className={"step"} onClick={() => this.stepOnce()}>Step</button>
      </>
      )
  }
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
  <Game>hello</Game>,
  document.getElementById('root')
)