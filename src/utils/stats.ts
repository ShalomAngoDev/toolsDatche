import { Vente, Product, PaymentMethod } from '../models/types';

export interface Stats {
  totalVentes: number;
  totalQuantite: number;
  quantiteParProduit: Record<Product, number>;
  repartitionPaiement: Record<PaymentMethod, number>;
  totalEUR: number;
  totalFCFA: number;
}

export function calculateStats(ventes: Vente[]): Stats {
  const stats: Stats = {
    totalVentes: ventes.length,
    totalQuantite: 0,
    quantiteParProduit: {} as Record<Product, number>,
    repartitionPaiement: {} as Record<PaymentMethod, number>,
    totalEUR: 0,
    totalFCFA: 0
  };

  ventes.forEach(vente => {
    // Total quantité
    stats.totalQuantite += vente.quantity;

    // Quantité par produit
    if (!stats.quantiteParProduit[vente.product]) {
      stats.quantiteParProduit[vente.product] = 0;
    }
    stats.quantiteParProduit[vente.product] += vente.quantity;

    // Répartition par mode de paiement
    if (!stats.repartitionPaiement[vente.paymentMethod]) {
      stats.repartitionPaiement[vente.paymentMethod] = 0;
    }
    stats.repartitionPaiement[vente.paymentMethod] += vente.total;

    // Totaux par devise
    if (vente.currency === 'EUR') {
      stats.totalEUR += vente.total;
    } else {
      stats.totalFCFA += vente.total;
    }
  });

  return stats;
}

