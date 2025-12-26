import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/database';
import { Product, PriceConfig, BoxPricing } from '../models/types';
import { DEFAULT_PRICES } from '../config/prices';
import { formatCurrency } from '../utils/currency';
import './Parametres.css';

export function Parametres() {
  const savedPrices = useLiveQuery(() => db.prices.toArray(), []) || [];
  const [prices, setPrices] = useState<PriceConfig[]>(DEFAULT_PRICES);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (savedPrices.length > 0) {
      setPrices(savedPrices);
    }
  }, [savedPrices]);

  function updatePrice(product: Product, currency: 'eur' | 'fcfa', value: number) {
    const updated = prices.map(p => {
      if (p.product === product) {
        return { ...p, [currency]: value };
      }
      return p;
    });
    setPrices(updated);
    setHasChanges(true);
  }


  async function savePrices() {
    await db.prices.clear();
    await db.prices.bulkAdd(prices);
    setHasChanges(false);
    alert('Prix enregistrés avec succès');
  }

  async function resetPrices() {
    if (confirm('Réinitialiser tous les prix aux valeurs par défaut ?')) {
      setPrices(DEFAULT_PRICES);
      await db.prices.clear();
      await db.prices.bulkAdd(DEFAULT_PRICES);
      setHasChanges(false);
    }
  }

  return (
    <div className="parametres-page">
      <div className="parametres-header">
        <h2>Paramètres - Prix</h2>
        <div className="parametres-actions">
          {hasChanges && (
            <button onClick={savePrices} className="btn btn-primary">
              Enregistrer les modifications
            </button>
          )}
          <button onClick={resetPrices} className="btn btn-secondary">
            Réinitialiser aux valeurs par défaut
          </button>
        </div>
      </div>

      <div className="parametres-info">
        <p>
          Configurez les prix pour chaque produit en EUR et FCFA.
          Les prix sont utilisés automatiquement lors de la création d'une vente selon le mode de paiement :
        </p>
        <ul>
          <li><strong>Revolut</strong> → Prix en EUR</li>
          <li><strong>Mobile Money / Espèces</strong> → Prix en FCFA</li>
        </ul>
      </div>

      <div className="prices-grid">
        {prices.map(price => (
          <div key={price.product} className="price-card">
            <h3>
              {price.product}
              {price.product === Product.Crème && <span className="product-subtitle"> (Leave-in 300 ml)</span>}
              {price.product === Product.Gamme && <span className="product-subtitle"> (Box DATCHÉ)</span>}
            </h3>
            {(
              <div className="price-fields">
                <div className="price-field">
                  <label>
                    Prix en EUR (€)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price.eur}
                      onChange={(e) => updatePrice(price.product, 'eur', parseFloat(e.target.value) || 0)}
                    />
                  </label>
                  <span className="price-preview">
                    {formatCurrency(price.eur, 'EUR')}
                  </span>
                  {(price.product === Product.Serviette || price.product === Product.Vaporisateur || price.product === Product.Masseur) && price.eur === 0 && (
                    <span className="price-note">Prix à définir si vendu seul</span>
                  )}
                </div>
                <div className="price-field">
                  <label>
                    Prix en FCFA
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={price.fcfa}
                      onChange={(e) => updatePrice(price.product, 'fcfa', parseInt(e.target.value) || 0)}
                    />
                  </label>
                  <span className="price-preview">
                    {formatCurrency(price.fcfa, 'FCFA')}
                  </span>
                  {(price.product === Product.Serviette || price.product === Product.Vaporisateur || price.product === Product.Masseur) && price.fcfa === 0 && (
                    <span className="price-note">Prix à définir si vendu seul</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="parametres-warning">
          ⚠️ Vous avez des modifications non enregistrées. N'oubliez pas de cliquer sur "Enregistrer les modifications".
        </div>
      )}
    </div>
  );
}

