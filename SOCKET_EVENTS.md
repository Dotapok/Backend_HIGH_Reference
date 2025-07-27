# Événements Socket.IO - Jeu TrueNumber Multijoueur

## Connexion
Pour se connecter au serveur Socket.IO, l'utilisateur doit fournir son token JWT dans l'authentification.

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Événements côté client

### Rejoindre une room de partie
```javascript
socket.emit('joinGameRoom', { gameId: 'game-id' });
```

### Jouer un tour
```javascript
socket.emit('playTurn', { gameId: 'game-id' });
// Le nombre est généré automatiquement côté serveur
```

### Quitter une room
```javascript
socket.emit('leaveGameRoom', { gameId: 'game-id' });
```

## Événements côté serveur

### Confirmation de connexion à une room
```javascript
socket.on('joinedRoom', (data) => {
  console.log('Rejoint la room:', data.room);
});
```

### Début de partie
```javascript
socket.on('gameStarted', (data) => {
  console.log('Partie démarrée:', data.game);
  console.log('Joueur actuel:', data.currentPlayer);
  console.log('Temps limite:', data.timeLimit);
});
```

### Mise à jour de la partie
```javascript
socket.on('gameUpdate', (data) => {
  console.log('Mise à jour de la partie:', data.game);
  console.log('Partie terminée:', data.finished);
  console.log('Prochain joueur:', data.nextPlayer);
  console.log('Dernier nombre joué:', data.lastPlayedNumber);
  console.log('Dernier joueur:', data.lastPlayer);
  console.log('Timeout:', data.timeout); // Si le joueur a perdu par timeout
});
```

### Erreurs
```javascript
socket.on('error', (data) => {
  console.error('Erreur:', data.message);
});
```

## Séquence de jeu typique

1. **Création de partie** (via API REST)
2. **Rejoindre la room** : `joinGameRoom`
3. **Début de partie** : `gameStarted` (quand un adversaire rejoint)
4. **Tour du créateur** : Le créateur clique sur "JOUER"
   - Émission : `playTurn`
   - Réception : `gameUpdate` avec `nextPlayer`
5. **Tour de l'adversaire** : L'adversaire clique sur "JOUER"
   - Émission : `playTurn`
   - Réception : `gameUpdate` avec `finished: true`
6. **Fin de partie** : Affichage du résultat

## Gestion des timeouts

- Chaque joueur a un temps limité pour jouer
- Si le temps expire, un nombre aléatoire est généré automatiquement
- L'événement `gameUpdate` inclut `timeout: true` si applicable

## États de la partie

- `waiting` : En attente d'un adversaire
- `playing` : Partie en cours
- `finished` : Partie terminée

## Informations de jeu

- **Temps de réflexion** : Configuré lors de la création de la partie
- **Mise** : Points misés par chaque joueur
- **Génération de nombres** : Automatique côté serveur (0-100)
- **Détermination du vainqueur** : Le plus grand nombre gagne
- **Mise à jour des points** : Automatique après la partie 