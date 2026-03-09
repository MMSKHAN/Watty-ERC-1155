// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar/Navbar'
import Admin from './components/Admin/Admin'
import BurnCredits from './components/BurnCredits/BurnCredits'
import GetMeters from './components/Admin/GetMeters'
import AddMinter from './components/Admin/AddMinter'
import GetMinter from './components/Admin/GetMinter'
import GetCredits from './components/MintCredits/GetCredits'
import MintCreditsHome from './components/MintCredits/MintCreditsHome'
import TransferCredits from './components/MintCredits/TransferCredits'
import ReportEvents from './components/ReportEnergy/ReportEvents'
import ReportEnergyHome from './components/ReportEnergy/ReportEnergyHome'
import FinalizeSettlement from './components/finalizeSettlement/finalizeSettlement'
import GetFinalizeSettlement from './components/FinalizeSettlement/GetFinalizeSettlement'

function App() {

  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Admin />} />
            <Route path="/get-meters" element={<GetMeters />} />
            <Route path="/get-minter" element={<GetMinter />} />
            <Route path="/get-credits" element={<GetCredits />} />
            <Route path="/mint-credits-home" element={<MintCreditsHome />} />
            <Route path="/transfer-credits" element={<TransferCredits />} />
            <Route path="/burn-credits" element={<BurnCredits />} />
            <Route path="/report-energy-home" element={<ReportEnergyHome />} />
            <Route path="/finalize-settlement" element={<FinalizeSettlement />} />
            <Route path="/get-finalize-settlement" element={<GetFinalizeSettlement />} />
            <Route path="/get-report" element={<ReportEvents />} />
            <Route path="/add-minter" element={<AddMinter />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      
      </div>
    </BrowserRouter>
  )
}

export default App