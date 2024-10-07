
import { Route, Routes } from 'react-router'
import './App.css'
import CloudIDE from './components/CloudIDE'

function App() {
  return (
    <>
      <Routes>
        <Route path="/ide/:userId" element={<CloudIDE />} />
      </Routes>
    </>
  )
}

export default App
