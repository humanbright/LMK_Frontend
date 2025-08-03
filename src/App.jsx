import { useState } from 'react'
import TokenPriceChart from "./TokenPriceChart";
import Chart from "./tradingview"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h2>My Token Price Chart</h2>
        <TokenPriceChart />
        <Chart stock={"Stock"} interval="1" width="100%" height="100%" tokenId={addr} symbol={tokenInfo?.ticker + "/Pump"} />
      </div>
    </>
  )
}

export default App
