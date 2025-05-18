import { useState } from 'react'
import './App.css'
import UploadSQLFile from './components/UploadSQLFile'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <UploadSQLFile/>
       </div>
    </>
  )
}

export default App
