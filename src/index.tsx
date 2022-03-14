import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Elementary} from './ElementaryComponents'
import {Conway} from './Conway'


const ConwayBoardMinSize = 15
const ConwayBoardMaxSize = 30


function App(props:{}){
  const apps = [{name: "Elementary", component: <Elementary></Elementary>}, {name: "Conway", component: <Conway></Conway>}]

  const [appIndex, setAppIndex] = useState(0)

  return(
    <div id={"App"}>
      <div id={"menuBar"}>
        {apps.map((app, ind) => {
          const onClick = () => {setAppIndex(ind)}
        return <button key={app.name} onClick={onClick}>{apps[ind].name}</button>
        })}
      </div>

      <div>
        {apps[appIndex].component}
      </div>
    </div>
  )
}



ReactDOM.render(
  <App></App>,
  document.getElementById('root')
)



