
import { Route, Routes } from 'react-router'
import './App.css'
import CloudIDE from './components/CloudIDE'
import LandingPage from './components/LandingPage'
import { BrowserRouter } from 'react-router-dom'
import LiveStream from './components/LiveStream'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/ide/:id" element={<CloudIDE />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/stream" element={<LiveStream />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
