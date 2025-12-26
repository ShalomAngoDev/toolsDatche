export enum Product {
  Shampoing = 'Shampoing',
  Masque = 'Masque',
  Crème = 'Crème', // Leave-in 300 ml
  Huile = 'Huile',
  Serviette = 'Serviette',
  Vaporisateur = 'Vaporisateur',
  Masseur = 'Masseur',
  Miroir = 'Miroir',
  Gamme = 'Gamme' // Box DATCHÉ
}

export enum BoxPricing {
  Lancement = 'Lancement',
  ApresLancement = 'Après lancement'
}

export enum PaymentMethod {
  Revolut = 'Revolut',
  MobileMoney = 'Mobile Money',
  Especes = 'Espèces'
}

export type Currency = 'EUR' | 'FCFA';

export interface Vente {
  id: string;
  createdAt: Date;
  product: Product;
  quantity: number;
  paymentMethod: PaymentMethod;
  currency: Currency;
  unitPrice: number;
  total: number;
  amountPaid: number;
  change: number;
  boxPricing?: BoxPricing; // Seulement pour Gamme
}

export interface PriceConfig {
  product: Product;
  eur: number;
  fcfa: number;
  // Pour Gamme: eur et fcfa peuvent être des objets avec lancement/apresLancement
  eurGamme?: {
    lancement: number;
    apresLancement: number;
  };
  fcfaGamme?: {
    lancement: number;
    apresLancement: number;
  };
}

export interface Stock {
  product: Product;
  quantity: number;
}

