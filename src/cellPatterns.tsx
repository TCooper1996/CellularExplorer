
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
      ]},
  
  
    //Tub
    {name: "tub",
    pattern:
    [ [false, true, false],
      [true, false, true],
    [false, true, false]]}
  ]},
  
  {groupName: "oscillators",
  patterns: [
    {name: "blinker",
      pattern: [[true],
                [true],
                [true]]},
  
    {name: "toad",
    pattern: [
              [false, true, true, true],
              [true, true, true, false],
              ]},
    {name: "beacon",
    pattern: [[true, true, false, false],
              [true, true, false, false],
              [false, false, true, true],
              [false, false, true, true]]}
  ]},
  
  {groupName: "spaceships",
  patterns: [
    {name: "glider",
    pattern: [[false, true, false],
              [false, false, true],
              [true, true, true]]},

    {name: "lightweight spaceship",
    pattern: [[false,true,true,true,true],
              [true,false,false,false,true],
              [false, false,false,false,true],
              [true,false,false,true,false],
              ]},

    {name: "middleweight spaceship",
    pattern: [[false,true,true,true,true,true],
              [true,false,false,false,false,true],
              [false,false,false,false,false,true],
              [true,false,false,false,true,false],
              [false,false,true,false,false,false]]},
  ]}]

  export {patterns}