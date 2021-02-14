import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {patterns} from './cellPatterns'

type booleanGrid = boolean[][]
type patternObj = {name: string, pattern: booleanGrid}
enum GridType {MainGrid, Minigrid}


class Game extends React.Component<{}, {size: number, board: booleanGrid, shadowBoard: booleanGrid, running: boolean, timer: NodeJS.Timeout, dragBuffer: booleanGrid}>{
  
  constructor(props: {}){
    super(props)
    const size = 14

    //2d board
    const board: booleanGrid = Array(size).fill(null).map(_ => {
      return Array(size).fill(false)
    })

    const timer = setInterval(() => this.playButtonHandler(), 500)
    this.state = {size: size, board: board, running: false, timer: timer, dragBuffer: [[]], shadowBoard: [[]]}
  }


  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column] = !board[row][column]
    this.setState({board: board})
  }

  clickHandlerPatternDrag(grid: booleanGrid){
    this.setState({dragBuffer: grid})
  }

  test(){
    return this.state.shadowBoard
  }

  // This function is called when cells on the main board have a prefab dragged over them
  clickHandlerCellDragEnter(row: number, column: number){
    const size = this.state.size
    const board = Array(size).fill(null).map((_, rowIndex) => {
      return Array(size).fill(false).map((_, cIndex) =>{
        return (rowIndex + row < size && cIndex + column < size && this.state.dragBuffer[rowIndex + row][cIndex + column])
      })

    })

    this.setState({shadowBoard: board})
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
    const contrivedOnClick = () => {}
    return <this.BoardGrid onClick={contrivedOnClick} grid={this.state.board} gridType={GridType.MainGrid}/>
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
        {props.pattern.map((val) => {
          return <li className={"prefabPreview"} key={val.name}><this.PrefabPreview name={val.name} pattern={val.pattern}/></li>
        })}
      </ul>
    </div>
  )
}

PrefabPreview(props: {name: string, pattern: booleanGrid}){
  return (
    <>
    <div className={"miniBoardGridContainer"}>
    <this.BoardGrid grid={props.pattern} gridType={GridType.Minigrid} onClick={() => this.clickHandlerPatternDrag(props.pattern)}/>
    </div>
    <p>{props.name}</p>
    </>
  )
}

    BoardGrid(props: {grid: booleanGrid, gridType: GridType, onClick: () => void}){
                              //onClickMain?: ((rIndex: number, cIndex: number) => void),
                              //onClickMini?: (() => void) }){

      const isMainBoard = props.gridType === GridType.MainGrid
      const className = (isMainBoard) ? "mainBoard boardGrid" : "miniBoard boardGrid"
      const shadowBoard = this.test()
      // Can't figure out how to adjust BoardGrid to take the union of the two required function types.
      // So, this function takes two functions everytime. one of the functions will actually have a body,
      // and the other will be one of the dummy functions below.
      let onClickMini = (isMainBoard) ? () => props.onClick() : undefined
      let onDragEnd = () => this.clickHandlerPatternDrag([[]])



      return(
        <div className={className} onDragStart={onClickMini} onDragEnd={onDragEnd}>{
        props.grid.map((rowArray, rowIndex) => {
          return( 
            <ul className={"boardRow"}>{
            rowArray.map((c, cIndex) => {
              let className = c ? "alive cell" : "dead cell";
              if (shadowBoard[rowIndex][cIndex]){
                className = className + " shadow"
              }
              const onClickMain = (isMainBoard) ? () => this.clickHandler(rowIndex, cIndex) : undefined
              return(
                <li key={rowIndex*rowArray.length + cIndex} className={className} onClick={onClickMain} onDragEnter={() => this.clickHandlerCellDragEnter(rowIndex, cIndex)}>
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