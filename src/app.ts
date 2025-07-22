import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import axios from 'axios'

const PORT = process.env.PORT ?? 3008

// Datos simulados del hotel
const hotelData = {
    meals: {
        breakfast: "🍳 Desayuno de hoy: Huevos revueltos, pan recién horneado, frutas frescas, café/té",
        lunch: "🍝 Almuerzo de hoy: Pasta al pesto, ensalada César, sopa del día",
        dinner: "🍖 Cena de hoy: Filete de res, puré de papas, vegetales asados"
    },
    activities: [
        "🏊‍♂️ 9:00 AM - Clase de natación en la piscina",
        "🧘‍♀️ 11:00 AM - Yoga en el jardín",
        "🎯 3:00 PM - Torneo de dardos en el bar",
        "💃 8:00 PM - Noche de baile latino"
    ],
    restaurants: [
        "🍽️ La Trattoria Di Marco - Comida italiana (⭐⭐⭐⭐½)",
        "🥘 El Rincón Criollo - Comida local (⭐⭐⭐⭐)",
        "🍣 Sushi Zen - Comida japonesa (⭐⭐⭐⭐)",
        "🥩 The Grill House - Carnes y parrilla (⭐⭐⭐⭐½)"
    ],
    hotelPlans: [
        "🌟 Plan Todo Incluido - Comidas y bebidas ilimitadas",
        "🎯 Plan Aventura - Incluye tours y actividades extremas",
        "💆‍♀️ Plan Relax - Acceso ilimitado al spa",
        "👨‍👩‍👦 Plan Familiar - Actividades para niños y descuentos"
    ]
}

// Función para obtener el clima (simulada por ahora, pero preparada para API real)
const getWeather = async () => {
    try {
        // Aquí podrías integrar una API real del clima
        return "🌤️ 25°C - Parcialmente nublado con probabilidad de lluvia por la tarde"
    } catch (error) {
        return "No se pudo obtener la información del clima"
    }
}

const menuFlow = addKeyword<Provider, Database>(['menu', 'opciones'])
    .addAnswer([
        '🏨 *Bienvenido al Hotel Paradise*',
        '',
        'Selecciona una opción:',
        '',
        '1️⃣ Ver menú del día',
        '2️⃣ Actividades de hoy',
        '3️⃣ Restaurantes recomendados',
        '4️⃣ Planes del hotel',
        '5️⃣ Clima actual',
        '',
        'Responde con el número de la opción que deseas consultar'
    ].join('\n'))

const mealsFlow = addKeyword<Provider, Database>(['1', 'menu del dia', 'comida'])
    .addAnswer([
        '🍽️ *Menú del día*',
        '',
        '*Desayuno*',
        hotelData.meals.breakfast,
        '',
        '*Almuerzo*',
        hotelData.meals.lunch,
        '',
        '*Cena*',
        hotelData.meals.dinner,
        '',
        'Escribe *menu* para volver al menú principal'
    ].join('\n'))

const activitiesFlow = addKeyword<Provider, Database>(['2', 'actividades'])
    .addAnswer([
        '📅 *Actividades de hoy*',
        '',
        ...hotelData.activities,
        '',
        'Escribe *menu* para volver al menú principal'
    ].join('\n'))

const restaurantsFlow = addKeyword<Provider, Database>(['3', 'restaurantes'])
    .addAnswer([
        '🍽️ *Restaurantes Recomendados*',
        '',
        ...hotelData.restaurants,
        '',
        'Escribe *menu* para volver al menú principal'
    ].join('\n'))

const plansFlow = addKeyword<Provider, Database>(['4', 'planes'])
    .addAnswer([
        '💫 *Planes del Hotel*',
        '',
        ...hotelData.hotelPlans,
        '',
        'Escribe *menu* para volver al menú principal'
    ].join('\n'))

const weatherFlow = addKeyword<Provider, Database>(['5', 'clima'])
    .addAction(async (_, { flowDynamic }) => {
        const weather = await getWeather()
        await flowDynamic([
            '🌡️ *Clima actual*',
            '',
            weather,
            '',
            'Escribe *menu* para volver al menú principal'
        ].join('\n'))
    })

const welcomeFlow = addKeyword<Provider, Database>(['hola', 'hi', 'buenos dias', 'buenas'])
    .addAnswer([
        '👋 ¡Bienvenido al Hotel Paradise!',
        '',
        'Soy tu asistente virtual y estoy aquí para ayudarte.',
        '',
        'Escribe *menu* para ver todas las opciones disponibles'
    ].join('\n'))

const main = async () => {
    const adapterFlow = createFlow([
        welcomeFlow,
        menuFlow,
        mealsFlow,
        activitiesFlow,
        restaurantsFlow,
        plansFlow,
        weatherFlow
    ])
    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(+PORT)
}

main()
