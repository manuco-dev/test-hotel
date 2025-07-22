import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { hotelData } from '../app';

const app = express();
const ADMIN_PORT = process.env.ADMIN_PORT ?? 3009;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rutas
app.get('/', (req, res) => {
    res.render('admin', { hotelData });
});

// API para actualizar menús
app.post('/api/meals', (req, res) => {
    const { breakfast, lunch, dinner } = req.body;
    hotelData.meals = {
        breakfast,
        lunch,
        dinner
    };
    res.json({ success: true, message: 'Menús actualizados correctamente' });
});

export const startAdminPanel = () => {
    app.listen(ADMIN_PORT, () => {
        console.log(`Panel de administración ejecutándose en http://localhost:${ADMIN_PORT}`);
    });
}; 