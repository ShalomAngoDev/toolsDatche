import { Vente, Product, PaymentMethod, Currency, PriceConfig, BoxPricing } from '../models/types';
import { PRODUCTS_REQUIRING_PRICE } from '../config/prices';

export function getCurrencyFromPaymentMethod(paymentMethod: PaymentMethod): Currency {
  if (paymentMethod === PaymentMethod.Revolut) {
    return 'EUR';
  }
  return 'FCFA';
}

export function getUnitPrice(
  product: Product,
  currency: Currency,
  prices: PriceConfig[]
): number | null {
  const priceConfig = prices.find(p => p.product === product);
  if (!priceConfig) {
    return null;
  }

  // Prix standard (y compris pour Gamme maintenant)
  const price = currency === 'EUR' ? priceConfig.eur : priceConfig.fcfa;
  
  // Vérifier si le produit nécessite un prix défini et qu'il est à 0
  if (PRODUCTS_REQUIRING_PRICE.includes(product) && price === 0) {
    return null; // Prix non défini, doit être configuré dans Paramètres
  }

  return price;
}

export function calculateTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}

export function calculateChange(amountPaid: number, total: number): number {
  return amountPaid - total;
}

export function createVente(
  product: Product,
  quantity: number,
  paymentMethod: PaymentMethod,
  amountPaid: number,
  prices: PriceConfig[]
): Vente | { error: string } {
  if (quantity < 1) {
    return { error: 'La quantité doit être au moins 1' };
  }

  const currency = getCurrencyFromPaymentMethod(paymentMethod);
  const unitPrice = getUnitPrice(product, currency, prices);

  if (unitPrice === null) {
    if (PRODUCTS_REQUIRING_PRICE.includes(product)) {
      return { error: `Prix à définir pour ${product}. Veuillez configurer le prix dans Paramètres.` };
    }
    return { error: `Prix manquant pour ${product} en ${currency}` };
  }

  const total = calculateTotal(unitPrice, quantity);
  const change = calculateChange(amountPaid, total);

  const vente: Vente = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    product,
    quantity,
    paymentMethod,
    currency,
    unitPrice,
    total,
    amountPaid,
    change
  };

  return vente;
}

