# Datche

Application React TypeScript pour gérer les ventes et le stock lors d'événements. Fonctionne entièrement hors ligne (PWA) avec stockage local via IndexedDB.

## 🚀 Installation

```bash
npm install
```

## 📱 Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build de production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## 📋 Fonctionnalités

### Page Ventes
- Enregistrement des ventes avec tous les détails
- Calcul automatique des totaux et monnaie à rendre
- Gestion de deux devises : EUR (Revolut) et FCFA (Mobile Money/Espèces)
- Statistiques en temps réel (totaux, quantités, répartition)
- Export CSV et JSON
- Import JSON pour restaurer des sauvegardes
- Duplication et suppression de ventes

### Page Stock
- Gestion du stock initial par produit
- Décrémentation automatique lors des ventes
- Visualisation du stock actuel avec indicateurs (normal/faible/vide)

### Page Paramètres
- Configuration des prix par produit en EUR et FCFA
- Sauvegarde persistante des prix
- Réinitialisation aux valeurs par défaut

## ⚙️ Configuration

### Modifier les prix

1. Allez dans la page **Paramètres**
2. Modifiez les prix EUR et FCFA pour chaque produit
3. Cliquez sur **"Enregistrer les modifications"**

Les prix sont utilisés automatiquement selon le mode de paiement :
- **Revolut** → Prix en EUR
- **Mobile Money / Espèces** → Prix en FCFA

### Modifier le stock

1. Allez dans la page **Stock**
2. Entrez la nouvelle quantité pour chaque produit
3. Cliquez sur **"Enregistrer"**

Le stock est automatiquement décrémenté lors de chaque vente enregistrée.

## 📦 Structure du projet

```
src/
├── models/          # Types et modèles de données
├── storage/         # Configuration Dexie (IndexedDB)
├── utils/           # Utilitaires (currency, export, stats, etc.)
├── components/      # Composants réutilisables
├── pages/           # Pages principales (Ventes, Stock, Paramètres)
└── App.tsx          # Composant principal avec routing
```

## 🔧 Technologies utilisées

- **React 18** avec TypeScript
- **Vite** pour le build
- **Dexie** pour IndexedDB (stockage local)
- **React Router** pour la navigation
- **Vite PWA Plugin** pour la fonctionnalité PWA

## 📱 PWA (Progressive Web App)

L'application est installable et fonctionne hors ligne :
- Cache automatique des assets
- Service Worker pour le fonctionnement offline
- Installation possible sur mobile et desktop

## 💾 Données

Toutes les données sont stockées localement dans IndexedDB :
- **Ventes** : Historique complet des ventes
- **Prix** : Configuration des prix par produit
- **Stock** : Quantités en stock par produit

Les données persistent même après fermeture du navigateur.

## 📤 Export / Import

### Export CSV
Exporte toutes les ventes au format CSV avec toutes les colonnes.

### Export JSON
Exporte toutes les ventes au format JSON pour sauvegarde complète.

### Import JSON
Permet de restaurer des ventes depuis un fichier JSON exporté précédemment.

## ⚠️ Notes importantes

- L'application fonctionne entièrement hors ligne
- Les prix doivent être configurés avant de pouvoir enregistrer des ventes
- Le stock n'empêche pas les ventes mais permet de suivre les quantités
- La réinitialisation de la journée supprime toutes les ventes (irréversible)

## 🐛 Dépannage

Si l'application ne fonctionne pas correctement :
1. Vérifiez que les prix sont bien configurés dans **Paramètres**
2. Videz le cache du navigateur si nécessaire
3. Vérifiez la console du navigateur pour les erreurs

## 📄 Licence

Application privée pour usage interne.

