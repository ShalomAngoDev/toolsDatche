import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Ventes } from './pages/Ventes';
import { Stock } from './pages/Stock';
import { Parametres } from './pages/Parametres';
import { useEffect } from 'react';
import { db } from './storage/database';
import { DEFAULT_PRICES } from './config/prices';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize default prices if not present
    async function initializeData() {
      const existingPrices = await db.prices.count();
      if (existingPrices === 0) {
        await db.prices.bulkAdd(DEFAULT_PRICES);
      }
    }
    initializeData();
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Ventes />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/parametres" element={<Parametres />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

