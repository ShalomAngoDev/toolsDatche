import Dexie, { Table } from 'dexie';
import { Vente, PriceConfig, Stock } from '../models/types';

export class DatcheDatabase extends Dexie {
  ventes!: Table<Vente, string>;
  prices!: Table<PriceConfig, Product>;
  stock!: Table<Stock, Product>;

  constructor() {
    super('DatcheDB');
    this.version(1).stores({
      ventes: 'id, createdAt, product, paymentMethod, currency',
      prices: 'product',
      stock: 'product'
    });
  }
}

export const db = new DatcheDatabase();

