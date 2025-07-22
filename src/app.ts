import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import axios from 'axios'
import * as dotenv from 'dotenv'

// Configurar variables de entorno
dotenv.config()

const PORT = 3008

console.log('🚀 Iniciando el bot...')

// Configurar DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// Respuestas de respaldo cuando la IA no está disponible
const fallbackResponses = {
    weather: "🌡️ Clima actual: 25°C - Parcialmente nublado. Excelente día para disfrutar de nuestras instalaciones.",
    general: "Lo siento, en este momento estoy operando en modo básico. Por favor, usa el comando *menu* para ver las opciones disponibles o contacta a recepción marcando *0* para asistencia personalizada.",
    concierge: "En este momento estoy operando en modo básico. Te sugiero:\n\n" +
              "1. Visitar nuestros restaurantes\n" +
              "2. Participar en las actividades del día\n" +
              "3. Explorar nuestros planes\n\n" +
              "Escribe *menu* para ver todas las opciones disponibles."
}

// Función para interactuar con DeepSeek
const askAI = async (prompt: string, context: string = '') => {
    try {
        console.log('🤖 Enviando solicitud a DeepSeek...')
        const payload = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `Eres un asistente virtual del Hotel Paradise, un hotel de lujo. ${context}`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            stream: false
        }

        console.log('📤 Payload:', JSON.stringify(payload, null, 2))

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

        console.log('📥 Respuesta recibida:', response.data)

        if (response.data && response.data.choices && response.data.choices[0]) {
            return response.data.choices[0].message.content
        } else {
            console.error('❌ Respuesta inesperada de DeepSeek:', response.data)
            return fallbackResponses.general
        }
    } catch (error) {
        console.error('❌ Error detallado al comunicarse con DeepSeek:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        })
        
        if (error.response?.status === 429) {
            console.log('⚠️ Límite de API alcanzado, usando respuesta de respaldo')
            if (prompt.toLowerCase().includes('clima')) {
                return fallbackResponses.weather
            } else if (prompt.toLowerCase().includes('concierge')) {
                return fallbackResponses.concierge
            }
            return fallbackResponses.general
        }
        
        // Mensaje de error más descriptivo
        return `Lo siento, hubo un problema técnico. Por favor:
1️⃣ Escribe *menu* para ver las opciones básicas
2️⃣ O marca *0* para hablar con recepción
3️⃣ Intenta de nuevo en unos minutos`
    }
}

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
        '❓ Escribe *consulta* para hacer preguntas generales',
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
        const weatherPrompt = "Actúa como un experto meteorólogo y proporciona un pronóstico del clima actual para un hotel de lujo. Incluye temperatura, condiciones y recomendaciones para los huéspedes. Mantén la respuesta corta y concisa."
        const weather = await askAI(weatherPrompt)
        await flowDynamic([
            '🌡️ *Pronóstico del Clima*',
            '',
            weather,
            '',
            'Escribe *menu* para volver al menú principal'
        ].join('\n'))
    })

const chatGPTFlow = addKeyword<Provider, Database>(['consulta', 'pregunta', 'ayuda'])
    .addAnswer([
        '¿En qué puedo ayudarte? Puedes preguntarme cualquier cosa sobre el hotel.',
        'Para volver al menú principal, escribe *menu*'
    ].join('\n'))
    .addAction(async (ctx, { flowDynamic }) => {
        const userMessage = ctx.body
        if (userMessage.toLowerCase() === 'menu') return

        const context = `
            Responde como un concierge profesional del Hotel Paradise.
            Información del hotel:
            - Tenemos restaurantes de diferentes especialidades
            - Ofrecemos actividades diarias como yoga, natación y entretenimiento nocturno
            - Contamos con diferentes planes: Todo Incluido, Aventura, Relax y Familiar
            - Nuestro objetivo es brindar una experiencia de lujo y confort
            Mantén las respuestas concisas pero informativas y siempre con un tono amable y profesional.
        `
        const response = await askAI(userMessage, context)
        await flowDynamic([
            response,
            '',
            'Escribe *menu* para ver todas las opciones disponibles'
        ].join('\n'))
    })

const welcomeFlow = addKeyword<Provider, Database>(['hola', 'hi', 'buenos dias', 'buenas'])
    .addAnswer([
        '👋 ¡Bienvenido al Hotel Paradise!',
        '',
        'Soy tu asistente virtual potenciado por IA y estoy aquí para ayudarte.',
        '',
        'Puedes:',
        '- Escribir *menu* para ver todas las opciones disponibles',
        '- Escribir *consulta* para hacer preguntas generales',
        '',
        '¡Estoy aquí para hacer tu estancia más placentera! 🌟'
    ].join('\n'))

const fallbackFlow = addKeyword<Provider, Database>([''])
    .addAction(async (ctx, { flowDynamic }) => {
        const response = await askAI(ctx.body, "Responde de manera amable y concisa. Si no entiendes la consulta, sugiere usar el comando 'menu' para ver las opciones disponibles.")
        await flowDynamic(response)
    })

const main = async () => {
    console.log('📱 Configurando el flujo del bot...')
    const adapterFlow = createFlow([
        welcomeFlow,
        menuFlow,
        mealsFlow,
        activitiesFlow,
        restaurantsFlow,
        plansFlow,
        weatherFlow,
        chatGPTFlow,
        fallbackFlow
    ])
    
    console.log('🔄 Iniciando proveedor de WhatsApp...')
    const adapterProvider = createProvider(Provider, {
        qrMobile: true,
        browser: ['Hotel Paradise Bot', 'Chrome', '4.0.0']
    })

    // Agregar listeners para eventos importantes
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

    console.log('🌐 Iniciando servidor web...')
    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(PORT)
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`)
}

main().catch(error => {
    console.error('❌ Error al iniciar el bot:', error)
})
