import { useState } from 'react'
import TokenPriceChart from "./TokenPriceChart";
import Chart from "./tradingview"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div style={{ padding: 2 + 'em', minWidth: 800 }}>
        <h2>My Token Price Chart</h2>
        <Chart stock={"Stock"} interval="1" width="100%" height="100%" symbol={"lmkt"} />
      </div>
    </>
  )
}

export default App
