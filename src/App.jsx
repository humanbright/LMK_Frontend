import { useState } from 'react'
import TokenPriceChart from "./TokenPriceChart";
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h2>My Token Price Chart</h2>
        <TokenPriceChart />
      </div>
    </>
  )
}

export default App
