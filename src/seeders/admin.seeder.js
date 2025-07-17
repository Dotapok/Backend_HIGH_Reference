const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../modeles/utilisateur.modele');

const MONGODB_URI = 'mongodb://mongo:ViPBbYGMQdLvXAwXhaXyNrmTszvGSPXk@crossover.proxy.rlwy.net:51160';

async function seedAdmin() {
    try {
        console.log('Démarrage du seeder...');
        console.log('URI MongoDB:', MONGODB_URI);

        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connexion à MongoDB établie');

        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (existingAdmin) {
            console.log('Un administrateur existe déjà. Données:', existingAdmin);
            await mongoose.connection.close();
            return;
        }

        console.log('Création d\'un nouvel administrateur...');

        const admin = new User({
            firstName: 'Admin',
            lastName: 'istrator',
            email: 'admin@example.com',
            phone: '0123456789',
            password: 'admin123',
            role: 'admin',
            points: 1000
        });

        console.log('Enregistrement de l\'administrateur...');
        const savedAdmin = await admin.save();
        console.log('Administrateur créé avec succès!');
        console.log('ID:', savedAdmin._id);
        console.log('Email:', savedAdmin.email);
        console.log('Role:', savedAdmin.role);
        console.log('Points:', savedAdmin.points);

        await mongoose.connection.close();
        console.log('Connexion MongoDB fermée');

    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

seedAdmin();
