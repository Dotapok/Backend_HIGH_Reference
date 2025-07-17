import mongoose from 'mongoose';
import User from '../modeles/utilisateur.modele';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
    try {
        // Configuration de MongoDB
        await mongoose.connect('mongodb://mongo:ViPBbYGMQdLvXAwXhaXyNrmTszvGSPXk@crossover.proxy.rlwy.net:51160');

        // Vérifier si un administrateur existe déjà
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        
        if (existingAdmin) {
            console.log('Un administrateur existe déjà.');
            return;
        }

        // Créer un mot de passe hashé
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Créer l'administrateur
        const admin = new User({
            firstName: 'Admin',
            lastName: 'istrator',
            email: 'admin@example.com',
            phone: '0123456789',
            password: hashedPassword,
            role: 'admin',
            points: 1000
        });

        await admin.save();
        console.log('Administrateur créé avec succès!');
        console.log('Email: admin@example.com');
        console.log('Mot de passe: admin123');

        // Fermer la connexion MongoDB
        await mongoose.connection.close();
    } catch (error) {
        console.error('Erreur lors de la création de l\'administrateur:', error);
        process.exit(1);
    }
};
