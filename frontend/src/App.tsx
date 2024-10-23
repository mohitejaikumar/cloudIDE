
import { Route, Routes } from 'react-router'
import './App.css'
import CloudIDE from './components/CloudIDE'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/ide/:id" element={<CloudIDE />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </>
  )
}

export default App
