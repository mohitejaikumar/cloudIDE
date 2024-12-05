
import { Route, Routes } from 'react-router'
import './App.css'
import CloudIDE from './components/CloudIDE'
import LandingPage from './components/LandingPage'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/ide/:id" element={<CloudIDE />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
