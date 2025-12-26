import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../storage/database';
import { Vente, Product, PaymentMethod } from '../models/types';
import { createVente, getCurrencyFromPaymentMethod, getUnitPrice, calculateTotal, calculateChange } from '../utils/vente';
import { formatCurrency } from '../utils/currency';
import { calculateStats } from '../utils/stats';
import { exportVentesToPDF, exportTransactionsByPaymentMethod } from '../utils/export';
import { DEFAULT_PRICES } from '../config/prices';
import { PRODUCTS_REQUIRING_PRICE } from '../config/prices';
import './Ventes.css';

interface VenteForm {
  product: Product;
  quantity: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
}

export function Ventes() {
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [venteForms, setVenteForms] = useState<VenteForm[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const ventes = useLiveQuery(() => db.ventes.orderBy('createdAt').reverse().toArray(), []) || [];
  const stats = calculateStats(ventes);

  useEffect(() => {
    loadPrices();
  }, []);

  async function loadPrices() {
    const savedPrices = await db.prices.toArray();
    if (savedPrices.length > 0) {
      setPrices(savedPrices);
    }
  }

  function addVenteForm() {
    setVenteForms([...venteForms, {
      product: Product.Shampoing,
      quantity: 1,
      paymentMethod: PaymentMethod.MobileMoney,
      amountPaid: 0
    }]);
  }

  function updateVenteForm(index: number, field: keyof VenteForm, value: any) {
    setVenteForms(prevForms => {
      const updated = [...prevForms];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear error for this form
    if (errors[index]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[index];
        return newErrors;
      });
    }
  }

  async function saveVente(index: number) {
    try {
      const form = venteForms[index];
      // Pour les modes de paiement autres qu'Espèces, amountPaid = total
      const amountPaid = form.paymentMethod === PaymentMethod.Especes 
        ? form.amountPaid 
        : getFormTotal(form);
      
      const result = createVente(
        form.product,
        form.quantity,
        form.paymentMethod,
        amountPaid,
        prices
      );

      if ('error' in result) {
        setErrors({ ...errors, [index]: result.error });
        return;
      }

      // Enregistrer la vente
      await db.ventes.add(result);
      
      // Update stock
      try {
        if (form.product === Product.Gamme) {
          // Pour Gamme, décrémenter un élément de chaque produit
          const productsInBox = [
            Product.Shampoing,
            Product.Masque,
            Product.Crème,
            Product.Huile,
            Product.Serviette,
            Product.Vaporisateur,
            Product.Masseur,
            Product.Miroir
          ];
          // Pour chaque quantité de Gamme vendue, décrémenter chaque produit
          for (let i = 0; i < form.quantity; i++) {
            for (const product of productsInBox) {
              await updateStock(product, -1);
            }
          }
        } else {
          // Pour les autres produits, décrémenter normalement
          await updateStock(form.product, -form.quantity);
        }
      } catch (stockError) {
        console.error('Erreur lors de la mise à jour du stock:', stockError);
        // On continue même si le stock échoue
      }
      
      // Remove form from list
      const updated = venteForms.filter((_, i) => i !== index);
      setVenteForms(updated);
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      setErrors({ ...errors, [index]: 'Erreur lors de l\'enregistrement. Veuillez réessayer.' });
    }
  }

  async function updateStock(product: Product, delta: number) {
    const stock = await db.stock.get(product);
    if (stock) {
      const newQuantity = Math.max(0, stock.quantity + delta);
      await db.stock.update(product, { quantity: newQuantity });
    } else {
      // Créer le stock s'il n'existe pas (seulement si delta est positif ou si on décrémente)
      const initialQuantity = delta < 0 ? 0 : Math.max(0, delta);
      await db.stock.add({ product, quantity: initialQuantity });
    }
  }

  function duplicateVente(vente: Vente) {
    setVenteForms([...venteForms, {
      product: vente.product,
      quantity: vente.quantity,
      paymentMethod: vente.paymentMethod,
      // Pour Espèces, garder le montant donné, sinon mettre 0 (sera calculé automatiquement)
      amountPaid: vente.paymentMethod === PaymentMethod.Especes ? vente.amountPaid : 0
    }]);
  }

  async function deleteVente(id: string) {
    const vente = await db.ventes.get(id);
    if (vente && confirm('Supprimer cette vente ?')) {
      await db.ventes.delete(id);
      // Restore stock
      if (vente.product === Product.Gamme) {
        // Pour Gamme, restaurer un élément de chaque produit
        const productsInBox = [
          Product.Shampoing,
          Product.Masque,
          Product.Crème,
          Product.Huile,
          Product.Serviette,
          Product.Vaporisateur,
          Product.Masseur,
          Product.Miroir
        ];
        // Pour chaque quantité de Gamme supprimée, restaurer chaque produit
        for (let i = 0; i < vente.quantity; i++) {
          for (const product of productsInBox) {
            await updateStock(product, 1);
          }
        }
      } else {
        // Pour les autres produits, restaurer normalement
        await updateStock(vente.product, vente.quantity);
      }
    }
  }

  function getFormCurrency(form: VenteForm): string {
    return getCurrencyFromPaymentMethod(form.paymentMethod);
  }

  function getFormUnitPrice(form: VenteForm): number | null {
    const currency = getCurrencyFromPaymentMethod(form.paymentMethod) as 'EUR' | 'FCFA';
    return getUnitPrice(form.product, currency, prices);
  }

  function getFormTotal(form: VenteForm): number {
    const unitPrice = getFormUnitPrice(form);
    if (unitPrice === null) return 0;
    return calculateTotal(unitPrice, form.quantity);
  }

  function getFormChange(form: VenteForm): number {
    // Pour Espèces, calculer la monnaie à rendre
    if (form.paymentMethod === PaymentMethod.Especes) {
      return calculateChange(form.amountPaid, getFormTotal(form));
    }
    // Pour les autres modes de paiement, pas de monnaie à rendre
    return 0;
  }


  async function resetJournee() {
    if (confirm('Réinitialiser toutes les ventes de la journée ? Cette action est irréversible.')) {
      await db.ventes.clear();
      setVenteForms([]);
    }
  }

  function handleExportPDF() {
    exportVentesToPDF(ventes, stats);
  }

  function handleExportTransactions(method: PaymentMethod) {
    exportTransactionsByPaymentMethod(ventes, method);
  }

  // Calculer les soldes par mode de paiement
  function getSoldesByPaymentMethod() {
    const soldes: Record<PaymentMethod, { total: number; currency: 'EUR' | 'FCFA' }> = {
      [PaymentMethod.Revolut]: { total: 0, currency: 'EUR' },
      [PaymentMethod.MobileMoney]: { total: 0, currency: 'FCFA' },
      [PaymentMethod.Especes]: { total: 0, currency: 'FCFA' }
    };

    ventes.forEach(vente => {
      soldes[vente.paymentMethod].total += vente.total;
    });

    return soldes;
  }

  return (
    <div className="ventes-page">
      <div className="ventes-header">
        <h2>Ventes</h2>
        <div className="ventes-actions">
          <button onClick={addVenteForm} className="btn btn-primary">
            + Ajouter une vente
          </button>
        </div>
      </div>

      {venteForms.length > 0 && (
        <div className="ventes-forms">
          <h3>Nouvelles ventes</h3>
          {venteForms.map((form, index) => {
            const unitPrice = getFormUnitPrice(form);
            const total = getFormTotal(form);
            const change = getFormChange(form);
            const currency = getFormCurrency(form) as 'EUR' | 'FCFA';
            const error = errors[index];

            return (
              <div key={index} className="vente-form-card">
                {error && <div className="error-message">{error}</div>}
                <div className="vente-form-row">
                  <div className="form-field">
                    <label>Produit</label>
                    <select
                      value={form.product}
                      onChange={(e) => {
                        const newProduct = e.target.value as Product;
                        updateVenteForm(index, 'product', newProduct);
                      }}
                    >
                      {Object.values(Product)
                        .filter(p => p !== Product.Miroir) // Miroir n'est pas vendable
                        .map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => updateVenteForm(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Mode de paiement</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => {
                        const newMethod = e.target.value as PaymentMethod;
                        // Mettre à jour le mode de paiement et réinitialiser amountPaid si nécessaire
                        setVenteForms(prevForms => {
                          const updated = [...prevForms];
                          updated[index] = {
                            ...updated[index],
                            paymentMethod: newMethod,
                            amountPaid: newMethod === PaymentMethod.Especes ? updated[index].amountPaid : 0
                          };
                          return updated;
                        });
                      }}
                    >
                      <option value={PaymentMethod.Revolut}>{PaymentMethod.Revolut}</option>
                      <option value={PaymentMethod.MobileMoney}>{PaymentMethod.MobileMoney}</option>
                      <option value={PaymentMethod.Especes}>{PaymentMethod.Especes}</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Devise</label>
                    <input type="text" value={currency} readOnly />
                  </div>
                  <div className="form-field">
                    <label>Prix unitaire</label>
                    <input
                      type="text"
                      value={
                        unitPrice !== null
                          ? formatCurrency(unitPrice, currency)
                          : PRODUCTS_REQUIRING_PRICE.includes(form.product)
                          ? 'Prix à définir'
                          : 'Prix manquant'
                      }
                      readOnly
                      className={unitPrice === null ? 'error' : ''}
                    />
                  </div>
                  <div className="form-field">
                    <label>Total</label>
                    <input
                      type="text"
                      value={formatCurrency(total, currency)}
                      readOnly
                    />
                  </div>
                  {form.paymentMethod === PaymentMethod.Especes && (
                    <>
                      <div className="form-field">
                        <label>Montant donné</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.amountPaid}
                          onChange={(e) => updateVenteForm(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-field">
                        <label>Monnaie à rendre</label>
                        <input
                          type="text"
                          value={formatCurrency(change, currency)}
                          readOnly
                          className={change < 0 ? 'warning' : ''}
                        />
                        {change < 0 && <span className="warning-text">Reste à payer</span>}
                      </div>
                    </>
                  )}
                  <div className="form-field">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await saveVente(index);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="btn btn-success"
                      disabled={
                        unitPrice === null ||
                        form.quantity < 1
                      }
                      type="button"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const updated = venteForms.filter((_, i) => i !== index);
                        setVenteForms(updated);
                      }}
                      className="btn btn-danger"
                      type="button"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="ventes-table-container">
        <h3>Historique des ventes</h3>
        {ventes.length === 0 ? (
          <p>Aucune vente enregistrée</p>
        ) : (
          <table className="ventes-table">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Mode de paiement</th>
                <th>Devise</th>
                <th>Prix unitaire</th>
                <th>Total</th>
                <th>Montant donné</th>
                <th>Monnaie à rendre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map(vente => (
                <tr key={vente.id}>
                  <td>{new Date(vente.createdAt).toLocaleString('fr-FR')}</td>
                  <td>{vente.product}</td>
                  <td>{vente.quantity}</td>
                  <td>{vente.paymentMethod}</td>
                  <td>{vente.currency}</td>
                  <td>{formatCurrency(vente.unitPrice, vente.currency)}</td>
                  <td>{formatCurrency(vente.total, vente.currency)}</td>
                  <td>{formatCurrency(vente.amountPaid, vente.currency)}</td>
                  <td className={vente.change < 0 ? 'warning' : ''}>
                    {formatCurrency(vente.change, vente.currency)}
                  </td>
                  <td>
                    <button
                      onClick={() => duplicateVente(vente)}
                      className="btn btn-small"
                      title="Dupliquer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteVente(vente.id)}
                      className="btn btn-small btn-danger"
                      title="Supprimer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ventes-summary">
        <h3>Résumé de la journée</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <h4>Totaux</h4>
            <p><strong>Total EUR:</strong> {formatCurrency(stats.totalEUR, 'EUR')}</p>
            <p><strong>Total FCFA:</strong> {formatCurrency(stats.totalFCFA, 'FCFA')}</p>
          </div>
          <div className="summary-card">
            <h4>Statistiques</h4>
            <p><strong>Nombre de ventes:</strong> {stats.totalVentes}</p>
            <p><strong>Quantité totale:</strong> {stats.totalQuantite}</p>
          </div>
          <div className="summary-card">
            <h4>Quantité par produit</h4>
            {Object.entries(stats.quantiteParProduit).map(([product, qty]) => (
              <p key={product}><strong>{product}:</strong> {qty}</p>
            ))}
          </div>
          <div className="summary-card">
            <h4>Soldes par mode de paiement</h4>
            {Object.entries(getSoldesByPaymentMethod()).map(([method, solde]) => (
              <p key={method}>
                <strong>{method}:</strong> {formatCurrency(solde.total, solde.currency)}
              </p>
            ))}
          </div>
        </div>
        <div className="summary-actions">
          <button onClick={handleExportPDF} className="btn btn-primary">
            Exporter les ventes en PDF
          </button>
          <button onClick={() => handleExportTransactions(PaymentMethod.Revolut)} className="btn btn-secondary">
            Transactions Revolut
          </button>
          <button onClick={() => handleExportTransactions(PaymentMethod.MobileMoney)} className="btn btn-secondary">
            Transactions Mobile Money
          </button>
          <button onClick={() => handleExportTransactions(PaymentMethod.Especes)} className="btn btn-secondary">
            Transactions Espèces
          </button>
          <button onClick={resetJournee} className="btn btn-danger">
            Réinitialiser la journée
          </button>
        </div>
      </div>
    </div>
  );
}

