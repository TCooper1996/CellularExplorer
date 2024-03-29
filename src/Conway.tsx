
import React, {useState} from 'react';
import './index.css';
import {Create2DArray, GridMap, ShadowableCellGrid, UpdateCells, ShadowableCell, CellGrid, Cell} from './CellTypes'
import Slider from '@mui/material/Slider';
import { PrefabMenu } from './PrefabMenu';


const ConwayBoardMinSize = 15
const ConwayBoardMaxSize = 30



const IndicesInBounds = (x:number, y:number, xMax:number, yMax:number) => 
      x >= 0 && y >= 0
      && x <= xMax && y <= yMax 



export class Conway extends React.Component<{}, {size: number, board: ShadowableCellGrid, running: boolean, timer: NodeJS.Timeout,
   dragBuffer?: CellGrid, currentPatternBuffered: string}>{
  
  constructor(props: {}){
    super(props)
    

    //2d board
    const board = GridMap(Create2DArray(ConwayBoardMinSize, ConwayBoardMinSize), (_:Cell) => {return {isAlive:false, isShadowed:false}})


    const timer = setInterval(() => this.playButtonHandler(), 500)

    this.BoardGrid = this.BoardGrid.bind(this)
    this.MainBoardCell = this.MainBoardCell.bind(this)
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
    this.setState({timer: setInterval(() => this.playButtonHandler(), 500/time)})
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


  //Advance the cells by one iteration 
  stepOnce(){
    const board = UpdateCells(this.state.board)
    
    this.setState({board: board})
  }



  CompactSlider(props:{onChange:any, name:string, minVal:number, maxVal:number, defaultVal:number}){
    return(
    <div className={"SliderContainer"}>
      <Slider className={"SliderControl"} onChange={props.onChange} min={props.minVal} max={props.maxVal} defaultValue={props.defaultVal} aria-label={'Default'} valueLabelDisplay={"auto"}/>
      <div className={"SliderLabel"}>{props.name}</div>
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
    const isSelectedFunc = (name:string) => this.state.currentPatternBuffered === name
    return(
      <>
        <div id={"mainDiv"}>
          <div id={"mainBoardContainer"}>
            <div id={"MainSliderContainer"}>
              <this.CompactSlider onChange={this.adjustSize} name={"Size"} defaultVal={ConwayBoardMinSize} minVal={ConwayBoardMinSize} maxVal={ConwayBoardMaxSize}/>
              <this.CompactSlider onChange={this.adjustTime} name={"Speed"} defaultVal={1} minVal={0.25} maxVal={3}/>
            </div>
            <this.BoardGrid grid={this.state.board}/>
            <PlayButton onClick={() => this.flipRunningState()} text={playButtonText}/>
            <button className={"step"} onClick={() => this.stepOnce()}>Step</button>
          </div>
          <PrefabMenu onButtonClick={(grid, name) => this.clickHandlerPrefabGrid(grid, name)} isSelected = {isSelectedFunc}/>
        </div>
      </>
      )
  }
}



function PlayButton(props: {onClick: () => void, text: string}){
  return <button className={"playButton"} onClick={props.onClick}>{props.text}</button>
}

