import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

type booleanGrid = boolean[][]
type patternObj = {name: string, pattern: booleanGrid}
const patterns: {groupName: string, patterns: {name: string, pattern: booleanGrid}[]}[] = [
  {
  groupName: "still lifes",
  patterns: [
  {name: "block",
  pattern: [[true, true],
  [true, true]]},

  //Beehive
  {name: "beehive",
  pattern: 
  [[false, true, true, false],
    [true, false, false, true],
    [false, true, true, false]]},


  //Tub
  {name: "tub",
  pattern:
  [[false, true, false],
    [true, false, true],
  [false, true, false]]}
]},

{groupName: "oscillators",
patterns: [
  {name: "blinker",
  pattern: [[true, true, true]]},

  {name: "toad",
  pattern: [[false, true, true, true],
            [true, true, true, false]]}
]},

{groupName: "spaceships",
patterns: [
  {name: "glider",
  pattern: [[false, true, false],
            [false, false, true],
            [true, true, true]]}
]}]

class Game extends React.Component<{}, {board: booleanGrid, running: boolean, timer: NodeJS.Timeout}>{
  
  constructor(props: {}){
    super(props)
    const size = 14

    //2d board
    const board: booleanGrid = Array(size).fill(null).map(_ => {
      return Array(size).fill(false)
    })

    const timer = setInterval(() => this.playButtonHandler(), 500)
    this.state = {board: board, running: false, timer: timer}
  }


  clickHandler(row: number, column: number){
    const board = this.state.board
    board[row][column] = !board[row][column]
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
    return(
      <div id={"board"}>{
      this.state.board.map((rowArray, rowIndex) => {
        return( 
          <ul className={"boardRow"}>{
          rowArray.map((c, cIndex) => {
            const className = c ? "alive cell" : "dead cell";
            return(
              <li key={rowIndex*rowArray.length + cIndex}>
                <Cell onClick={() => this.clickHandler(rowIndex, cIndex)} className={className}></Cell>
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
          <PrefabsMenu/>
        </div>
          <PlayButton onClick={() => this.flipRunningState()} text={buttonText}></PlayButton>
          <button className={"step"} onClick={() => this.stepOnce()}>Step</button>
      </>
      )
  }
}

function Cell(props: {onClick: () => void, className: string}){
  return <button onClick={props.onClick} className={props.className}></button>
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

function PrefabsMenu(){
  return(
      <div id={"prefabMenu"}>
        {patterns.map(patternGroup => {
          return <PrefabColumn groupName={patternGroup.groupName} pattern={patternGroup.patterns}/>
        })}
      </div>
  )
}

function PrefabColumn(props: {groupName: string, pattern: patternObj[]}){
  return (
    <div className={"prefabColumn"}>
      <p>{props.groupName}</p>
      <ul>
        {props.pattern.map((val) => {
          return <li className={"prefabPreview"} key={val.name}><PrefabPreview name={val.name} pattern={val.pattern}/></li>
        })}
      </ul>
    </div>
  )
}

function PrefabPreview(props: patternObj){
  return (
    <>
      <PrefabPreviewGrid pattern={props.pattern}/>
      <span>{props.name}</span>
    </>
  )
}

function PrefabPreviewGrid(props: {pattern: booleanGrid}){
    return (
      <div className={"previewGrid"}>{
    props.pattern.map((rowArray, rowIndex) => {
      return( 
        <ul className={"boardRow"}>{
        rowArray.map((c, cIndex) => {
          const className = c ? "alive cell" : "dead cell";
          return(
            <li key={rowIndex*rowArray.length + cIndex} className={className}>
              
            </li>
          )
        })}
        </ul>
      )})
      }</div>)
}


ReactDOM.render(
  <Game>hello</Game>,
  document.getElementById('root')
)