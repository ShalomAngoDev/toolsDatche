import { Product, PriceConfig, BoxPricing } from '../models/types';

// Table de prix exacte selon spécifications
export const DEFAULT_PRICES: PriceConfig[] = [
  // Shampoing
  { product: Product.Shampoing, eur: 21.50, fcfa: 14000 },
  
  // Masque
  { product: Product.Masque, eur: 20.00, fcfa: 13000 },
  
  // Crème (Leave-in 300 ml)
  { product: Product.Crème, eur: 18.50, fcfa: 12000 },
  
  // Huile
  { product: Product.Huile, eur: 22.99, fcfa: 15000 },
  
  // Gamme (Box DATCHÉ) - prix fixe
  { product: Product.Gamme, eur: 70.00, fcfa: 45000 },
  
  // Serviette / Vaporisateur / Masseur: prix à 0 par défaut (inclus dans box)
  // Doivent être définis dans Paramètres si vendus seuls
  { product: Product.Serviette, eur: 0, fcfa: 0 },
  { product: Product.Vaporisateur, eur: 0, fcfa: 0 },
  { product: Product.Masseur, eur: 0, fcfa: 0 }
];

// Produits qui nécessitent un prix défini dans Paramètres s'ils sont vendus seuls
export const PRODUCTS_REQUIRING_PRICE: Product[] = [
  Product.Serviette,
  Product.Vaporisateur,
  Product.Masseur
];

