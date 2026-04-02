import { useState } from 'react'
import './App.css'
import CytoscapeGraph from './Wordmap'
import NavButtons from './NavButtons'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <>
      <section id="home" className='relative flex content-center h-screen w-4/6 ' >
        <div id='cy' className="w-full h-full">
          <CytoscapeGraph />
        </div>
          <NavButtons />
      </section>
    </>
  )
}

export default App
