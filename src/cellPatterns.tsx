
type booleanGrid = boolean[][]
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
      [false, true, true, false],
      [false, false, false, false]]},
  
  
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
      pattern: [[false, false, false],
                [true, true, true],
                [false,false,false]]},
  
    {name: "toad",
    pattern: [[false, false, false, false],
              [false, true, true, true],
              [true, true, true, false],
              [false, false, false, false]]},
  ]},
  
  {groupName: "spaceships",
  patterns: [
    {name: "glider",
    pattern: [[false, true, false],
              [false, false, true],
              [true, true, true]]}
  ]}]

  export {patterns}