import { Route, Routes } from "react-router";
import "./App.css";
import CloudIDE from "./components/CloudIDE";
import LandingPage from "./components/LandingPage";
import { BrowserRouter } from "react-router-dom";
import LiveStream from "./components/LiveStream";
import ClientProvider from "./providers/ClientProvider";

function App() {
  return (
    <>
      <ClientProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/ide/:id" element={<CloudIDE />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/stream/:id" element={<LiveStream />} />
          </Routes>
        </BrowserRouter>
      </ClientProvider>
    </>
  );
}

export default App;
