import React, {SyntheticEvent} from 'react';
import ReactDOM from 'react-dom';

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
      return
    }

    this.setState({stepFunc: this.createStepFunction(intRule)})
    event.preventDefault()
  }

  handleTextChange2(event: SyntheticEvent){
    const target = event.target as HTMLTextAreaElement

    const intRule = parseInt(target.value)
    if (isNaN(intRule)){
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
export {Elementary}