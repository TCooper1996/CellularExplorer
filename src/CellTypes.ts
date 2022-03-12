
export type CellGrid = Cell[][]
export type ShadowableCellGrid = ShadowableCell[][]

export interface Cell{
  isAlive: boolean
}

export interface ShadowableCell extends Cell{
  isShadowed: boolean
}


export const Create2DArray = (width:number, height?:number, val?:any) => {
  const h = height === undefined ? width : height
  return Array.from(Array(h), () =>
      new Array(width).fill(val === undefined ? null : val)
)}

export function GridMap<T, R>(grid:T[][], func: (cell:T, row:number, col:number) => R): R[][]{ 
  return grid.map((row, rowInd) => row.map((cell, colInd) => func(cell, rowInd, colInd)))
}

export function CopyGrid(g:CellGrid){
  return GridMap(g, CopyCell)
}

export function CopyCell(cell:Cell){
  return Object.assign({}, cell)
}

export function Judge(isAlive: boolean, neighbors: number){
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


export function UpdateCells<CellType extends Cell>(grid: CellType[][]):CellType[][]{

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
        return {...cell,  isAlive: Judge(cell.isAlive, neighbors)}
  }

  return GridMap(grid, judgeCell)

}
const IndicesInBounds = (x:number, y:number, xMax:number, yMax:number) => 
      x >= 0 && y >= 0
      && x <= xMax && y <= yMax 
