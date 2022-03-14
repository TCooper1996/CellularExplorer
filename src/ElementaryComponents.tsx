import React, {SyntheticEvent} from 'react';
import { CellGrid, Create2DArray, GridMap } from './CellTypes';
import { TextField } from '@mui/material';
import { PrefabButton } from './PrefabMenu';

const previewRules = [30, 90, 102, 45]

class Elementary extends React.Component<{}, {rule: string, size: number, stepFunc: (parents: boolean[]) => boolean, error:boolean}>{
  constructor(props: {}){
    super(props)
    const size = 25
    const rule = "18"

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleTextChange = this.handleTextChange.bind(this)

    this.state = {size: size, rule: rule, stepFunc: createStepFunction(parseInt(rule)), error:false}
  }


  handleSubmit(event: SyntheticEvent){
    const intRule = parseInt(this.state.rule)
    if (isNaN(intRule)){
      return
    }

    this.setState({stepFunc: createStepFunction(intRule)})
    event.preventDefault()
  }

  handleTextChange(event: SyntheticEvent){
    const target = event.target as HTMLTextAreaElement

    const intRule = parseInt(target.value)

    if (isNaN(intRule) || intRule > 256){
      this.setState({error: true})
      return
    }

    this.setRule(intRule)
    event.preventDefault()

  }

  setRule(rule:number){
    this.setState({stepFunc: createStepFunction(rule), rule:rule.toString(), error:false})
  }

  RuleToPrefab(rule:number){
    const grid = generateGridByRule(9, 9, createStepFunction(rule))
    const onClick  = () => this.setState({})
    return (
      <li>
        <PrefabButton className={"prefabContainer"} prefabName={"Rule: "+ rule.toString()} 
          grid={grid} fontSize="0.7vw"/>
      </li>)
}


  render(){
    const prefabs = previewRules.map(this.RuleToPrefab)

    return <div id={"ElementaryMainDiv"}>
      <TextField label="Rule" error={this.state.error} onChange={(rule) => this.handleTextChange(rule)} helperText="Enter number between [1-256]" inputProps={{inputMode: 'numeric', pattern:'[0-9]*'}}/>
{/*       <label>
        Enter rule #
        <input type="text" value={this.state.rule} onChange={this.handleTextChange}></input>
      </label>
      <input type="submit" value="Submit"></input> */}
      <ul id={"ElementaryPrefabGroup"}>
        {prefabs}
      </ul>
      <br/>

      <ElementaryBoard stepFunc={this.state.stepFunc}/>
    </div>
  }

}

function ElementaryBoard(props: {stepFunc: (parents: boolean[]) => boolean}){
  const width = 39
  const height = 25
  const board = generateGridByRule(width, height, props.stepFunc)

  return(<div className="boardGrid">
    {board.map((row, rowIndex) => 
      <ul key={rowIndex} className="boardRow">
        {row.map((cell, cellIndex) => 
          <li key={rowIndex*width + cellIndex} className={(cell.isAlive) ? "cell alive" : "cell dead"}>

          </li>
        )}
      </ul>
    )}
    </div>
  )
}



function createStepFunction(rule: number){
  return (parents: boolean[]) => {
    // The parents value is a list of true/false values that must be interpeted as a binary number in order to bitshift the rule
    // The map call turns each true value into a power of two based on it's position, and the reduce sums them up.
    //Then we modulo 2 and compare against 1 in order to return true if the last bit is a 1, and 0 otherwise.
    return (rule >> parents.map((val, ind) => val ? 2**(2-ind) : 0)
                          .reduce((x, y) => x + y)) % 2 === 1
  }

}

function generateGridByRule(width:number, height:number, stepFunc: (parents:boolean[]) => boolean): CellGrid{
  const paddedWidth = width+2
  const parentPos = [-1, 0, 1]

  const firstRow = Array(paddedWidth).fill(null).map((_, index) => index === Math.floor(paddedWidth/2))
  let emptyGrid = Create2DArray(paddedWidth, height-1, false)

  // Reduce here effectively acts as a form of map that allows us to contruct a row while referencing the previous row.
  const grid:boolean[][] = emptyGrid.reduce((previousRows:boolean[][], currentRow) => {
    const previousRow:boolean[] = previousRows.at(-1) as boolean[]
    return [...previousRows, currentRow.map((isAlive, cellInd) => stepFunc(parentPos.map(n => previousRow[cellInd - n] ?? false)))]

  }, [firstRow])

  const gridView = grid.map(row => row.slice(1, -1))
  return GridMap(gridView, (isAlive => {return {isAlive:isAlive}}))

}
export {Elementary}