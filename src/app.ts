import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const PORT = 3008

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

const fallbackResponses = {
    weather: "🌡️ Clima actual: 25°C - Parcialmente nublado. Excelente día para disfrutar de nuestras instalaciones.",
    general: "Lo siento, en este momento estoy operando en modo básico. Por favor, usa el comando *menu* para ver las opciones disponibles o contacta a recepción marcando *0* para asistencia personalizada.",
    concierge: `En este momento estoy operando en modo básico. Te sugiero:

1. Visitar nuestros restaurantes
2. Participar en las actividades del día
3. Explorar nuestros planes

Escribe *menu* para ver todas las opciones disponibles.`
}

const askAI = async (prompt, context = '') => {
    try {
        const payload = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `Eres Sofía, la recepcionista virtual del Hotel Paradise, un hotel de lujo frente al mar.
Estás entrenada para ofrecer atención cálida, profesional y útil a los huéspedes.
Tu misión es brindar una experiencia excepcional durante su estancia.

🔎 Información útil:
- Servicios: restaurantes, spa, piscina, actividades, room service, planes todo incluido
- Actividades destacadas del día (yoga, baile, piscina)
- Planes disponibles: Aventura, Relax, Familiar, Todo Incluido

🧠 Estilo de respuesta:
- Sé clara, empática y directa.
- Si el usuario se presenta (ej: 'Soy Manuel'), salúdalo por su nombre.
- Si la pregunta no es relevante, invita a usar el menú.
- Finaliza siempre con: “¿Deseas ver el menú principal? Escribe *menu*.”

${context}`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            stream: false
        }

        const response = await axios.post(
            DEEPSEEK_API_URL,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (response.data && response.data.choices && response.data.choices[0]) {
            return response.data.choices[0].message.content
        } else {
            return fallbackResponses.general
        }
    } catch (error) {
        if (error.response?.status === 429) {
            if (prompt.toLowerCase().includes('clima')) return fallbackResponses.weather
            if (prompt.toLowerCase().includes('concierge')) return fallbackResponses.concierge
            return fallbackResponses.general
        }

        return `😔 Lo siento, estoy teniendo problemas para acceder a la información en este momento.\n\nPuedes:\n1️⃣ Escribir *menu* para ver las opciones básicas  \n2️⃣ O marcar *0* para contactar a recepción  \n\nGracias por tu paciencia.`
    }
}

const hotelData = {
    meals: {
        breakfast: "Huevos revueltos, pan recién horneado, frutas frescas, café/té",
        lunch: "Pasta al pesto, ensalada César, sopa del día",
        dinner: "Filete de res, puré de papas, vegetales asados"
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

const menuFlow = addKeyword(['menu', 'opciones'])
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
        '❓ Escribe *consulta* para hacer preguntas generales',
        '',
        'Responde con el número de la opción que deseas consultar'
    ].join('\n'))

const mealsFlow = addKeyword(['1', 'menu del dia', 'comida'])
    .addAnswer([
        '🍽️ *Aquí tienes el menú del día:*',
        '',
        `🥐 *Desayuno:* ${hotelData.meals.breakfast}`,
        `🍝 *Almuerzo:* ${hotelData.meals.lunch}`,
        `🍖 *Cena:* ${hotelData.meals.dinner}`,
        '',
        '¿Deseas hacer una reserva o saber más? Escribe *menu* para volver.'
    ])

const activitiesFlow = addKeyword(['2', 'actividades'])
    .addAnswer([
        '📅 *Actividades de hoy*',
        '',
        ...hotelData.activities,
        '',
        '¿Te gustaría participar en alguna? Escribe *menu* para ver más opciones.'
    ])

const restaurantsFlow = addKeyword(['3', 'restaurantes'])
    .addAnswer([
        '🍽️ *Restaurantes Recomendados*',
        '',
        ...hotelData.restaurants,
        '',
        '¿Quieres reservar en alguno? Escribe *menu* para volver al menú principal.'
    ])

const plansFlow = addKeyword(['4', 'planes'])
    .addAnswer([
        '💫 *Planes del Hotel*',
        '',
        ...hotelData.hotelPlans,
        '',
        '¿Deseas más información? Escribe *menu* para volver al menú principal.'
    ])

const weatherFlow = addKeyword(['5', 'clima'])
    .addAction(async (_, { flowDynamic }) => {
        const weatherPrompt = "Actúa como un experto meteorólogo y proporciona un pronóstico del clima actual para un hotel de lujo. Incluye temperatura, condiciones y recomendaciones para los huéspedes. Mantén la respuesta corta y concisa."
        const weather = await askAI(weatherPrompt)
        await flowDynamic([
            '🌤️ *Pronóstico del Clima*',
            '',
            weather,
            '',
            '¿Quieres planear alguna actividad? Escribe *menu* para ver opciones.'
        ].join('\n'))
    })

const welcomeFlow = addKeyword(['hola', 'hi', 'buenos dias', 'buenas'])
    .addAnswer([
        '👋 ¡Bienvenido al Hotel Paradise!',
        '',
        'Soy Sofía, tu recepcionista virtual. Estoy aquí para ayudarte en lo que necesites durante tu estancia.',
        '',
        'Puedes:',
        '- Preguntarme sobre servicios, actividades o promociones',
        '- Escribir *menu* para ver las opciones disponibles',
        '',
        '¡Estoy encantada de asistirte! 🌟'
    ])

const fallbackFlow = addKeyword([''])
    .addAction(async (ctx, { flowDynamic }) => {
        const reservedKeywords = ['menu', 'opciones', '1', '2', '3', '4', '5', 'hola', 'hi', 'buenos dias', 'buenas']
        const userInput = ctx.body.toLowerCase().trim()
        if (reservedKeywords.includes(userInput) || /^\d$/.test(userInput)) return

        const response = await askAI(userInput)
        await flowDynamic([
            response,
            '',
            '¿Puedo ayudarte con algo más? Escribe *menu* para ver opciones.'
        ].join('\n'))
    })

const main = async () => {
    const adapterFlow = createFlow([
        welcomeFlow,
        menuFlow,
        mealsFlow,
        activitiesFlow,
        restaurantsFlow,
        plansFlow,
        weatherFlow,
        fallbackFlow
    ])

    const adapterProvider = createProvider(Provider, {
        qrMobile: true,
        browser: ['Hotel Paradise Bot', 'Chrome', '4.0.0']
    })

    adapterProvider.on('qr', () => {
        console.log('📲 Nuevo código QR generado - Visita http://localhost:3008 para verlo')
    })

    adapterProvider.on('ready', () => {
        console.log('✅ Bot conectado y listo!')
    })

    adapterProvider.on('error', (error) => {
        console.error('❌ Error en el proveedor:', error)
    })

    const adapterDB = new Database()

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(PORT)
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`)
}

main().catch(console.error)
