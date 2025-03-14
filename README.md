# USportNantes - Réservation Automatique de Sports

Un système automatisé pour réserver des créneaux sportifs sur la plateforme U-Sport de l'Université de Nantes. Ce projet utilise Puppeteer pour automatiser les interactions avec le navigateur et GitHub Actions pour planifier les réservations au moment opportun.

## 📌 Fonctionnalités

- Réservation automatique de créneaux sportifs (badminton, volleyball, etc.)
- Planification des réservations via GitHub Actions
- Possibilité de lancer les réservations manuellement ou automatiquement
- Notification des résultats de réservation

## 🔧 Prérequis

- Un compte GitHub pour forker ce dépôt
- Un compte U-Sport de l'Université de Nantes

## 🚀 Installation et configuration

1. **Forker ce dépôt** sur votre propre compte GitHub
   - Cliquez sur le bouton "Fork" en haut à droite de la page du dépôt

2. **Configurer les secrets GitHub**
   - Dans votre dépôt forké, allez dans Settings > Secrets and variables > Actions
   - Ajoutez deux nouveaux secrets:
     - `USPORT_USERNAME`: Votre identifiant U-Sport
     - `USPORT_PASSWORD`: Votre mot de passe U-Sport

3. **Adapter les workflows existants ou en créer de nouveaux**
   - Examinez les fichiers workflow existants dans le dossier `.github/workflows`
   - Modifiez-les ou créez de nouveaux fichiers selon vos besoins

## ➕ Création d'un workflow pour un nouveau sport

Pour créer un workflow pour un autre sport ou créneau:

1. Dupliquez l'un des fichiers workflow existants dans `.github/workflows/`
2. Renommez-le selon le format `sport_jour.yml` (ex: `volleyball_jeudi.yml`)
3. Modifiez:
   - La planification cron (jour et heure d'exécution)
   - Les paramètres par défaut (activité, jour, heures, lieu)

## 📋 Utilisation

### Exécution automatique

Une fois configurés, les workflows s'exécuteront automatiquement selon la planification définie dans les fichiers.

### Exécution manuelle

1. Allez dans l'onglet "Actions" de votre dépôt GitHub
2. Sélectionnez le workflow que vous souhaitez exécuter
3. Cliquez sur "Run workflow"
4. Modifiez les paramètres si nécessaire
5. Cliquez sur "Run workflow" pour lancer l'exécution

## 📁 Structure du projet

- `script.js` - Script principal d'automatisation des réservations
- `.github/workflows/` - Contient les fichiers de configuration GitHub Actions pour chaque réservation
- `package.json` - Configuration du projet et dépendances

## 🔍 Personnalisation avancée

Pour une personnalisation plus poussée:

- Ajustez la fréquence d'exécution dans les fichiers workflow
- Modifiez l'heure de planification en fonction de l'ouverture des réservations
- Note: Le format cron est en UTC; ajustez en fonction du fuseau horaire français

## ⚠️ Remarques importantes

- Le système utilise Chromium en mode headless pour l'automatisation
- Les résultats sont visibles dans les logs des actions GitHub
- Vérifiez que les réservations ont bien été effectuées dans votre compte U-Sport
- La syntaxe cron est au format: `minute heure jour-du-mois mois jour-de-la-semaine`
  - Exemple: `31 21 * * 3` signifie "tous les mercredis à 21h31 UTC"
  - Pour la France: UTC+1 (hiver) ou UTC+2 (été)

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou à proposer une pull request.