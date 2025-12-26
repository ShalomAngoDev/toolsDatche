import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/database';
import { Product } from '../models/types';
import './Stock.css';

export function Stock() {
  const stocks = useLiveQuery(() => db.stock.toArray(), []) || [];
  const [stockInputs, setStockInputs] = useState<Record<Product, number>>({} as Record<Product, number>);

  useEffect(() => {
    // Initialize stock inputs with current values (exclure Gamme, inclure Miroir)
    const initial: Record<Product, number> = {} as Record<Product, number>;
    Object.values(Product)
      .filter(product => product !== Product.Gamme)
      .forEach(product => {
        const stock = stocks.find(s => s.product === product);
        initial[product] = stock?.quantity || 0;
      });
    setStockInputs(initial);
  }, [stocks]);

  async function updateStock(product: Product, quantity: number) {
    if (quantity < 0) {
      alert('La quantité ne peut pas être négative');
      return;
    }

    const existing = await db.stock.get(product);
    if (existing) {
      await db.stock.update(product, { quantity });
    } else {
      await db.stock.add({ product, quantity });
    }
  }

  async function handleSave(product: Product) {
    const quantity = stockInputs[product] || 0;
    await updateStock(product, quantity);
  }

  function handleInputChange(product: Product, value: string) {
    const numValue = parseInt(value) || 0;
    setStockInputs({ ...stockInputs, [product]: numValue });
  }

  async function resetAllStock() {
    if (confirm('Réinitialiser tous les stocks à zéro ?')) {
      // Supprimer uniquement les stocks des produits (pas Gamme, inclure Miroir)
      const productsToReset = Object.values(Product).filter(p => p !== Product.Gamme);
      for (const product of productsToReset) {
        await db.stock.delete(product);
      }
      const reset: Record<Product, number> = {} as Record<Product, number>;
      productsToReset.forEach(product => {
        reset[product] = 0;
      });
      setStockInputs(reset);
    }
  }

  return (
    <div className="stock-page">
      <div className="stock-header">
        <h2>Gestion du Stock</h2>
        <button onClick={resetAllStock} className="btn btn-danger">
          Réinitialiser tous les stocks
        </button>
      </div>

      <div className="stock-grid">
        {Object.values(Product)
          .filter(product => product !== Product.Gamme)
          .map(product => {
            const currentStock = stocks.find(s => s.product === product);
            const currentQuantity = currentStock?.quantity || 0;
            const inputValue = stockInputs[product] !== undefined ? stockInputs[product] : currentQuantity;

            return (
              <div key={product} className="stock-card">
                <h3>{product}</h3>
                <div className="stock-current">
                  <span className="stock-label">Stock actuel:</span>
                  <span className={`stock-value ${currentQuantity === 0 ? 'empty' : currentQuantity < 5 ? 'low' : ''}`}>
                    {currentQuantity}
                  </span>
                </div>
                <div className="stock-edit">
                  <label>
                    Nouvelle quantité:
                    <input
                      type="number"
                      min="0"
                      value={inputValue}
                      onChange={(e) => handleInputChange(product, e.target.value)}
                    />
                  </label>
                  <button
                    onClick={() => handleSave(product)}
                    className="btn btn-primary"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      <div className="stock-info">
        <h3>Information</h3>
        <p>
          Le stock est automatiquement décrémenté lors de chaque vente enregistrée.
          Si le produit "Gamme" (Box) est vendu, un élément de chaque produit (Shampoing, Masque, Crème, Huile, Serviette, Vaporisateur, Masseur, Miroir) est prélevé du stock.
        </p>
        <p className="warning-text">
          ⚠️ Les ventes ne sont pas bloquées si le stock est insuffisant, mais vous pouvez vérifier le stock ici avant de vendre.
        </p>
      </div>
    </div>
  );
}

