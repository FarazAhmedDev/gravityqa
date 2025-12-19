const { startServer } = require('appium')

const PORT = process.env.APPIUM_PORT || 4723
const HOST = process.env.APPIUM_HOST || 'localhost'

async function main() {
    console.log('🚀 Starting Appium Server...')

    try {
        const server = await startServer({
            port: PORT,
            address: HOST,
            logLevel: 'info',
            useDrivers: ['uiautomator2', 'xcuitest'],
            usePlugins: [],
            allowInsecure: ['adb_shell'],
            relaxedSecurity: true,
        })

        console.log(`✅ Appium Server running on http://${HOST}:${PORT}`)
        console.log('📱 Ready to accept connections...')

        // Handle shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Appium Server...')
            await server.close()
            process.exit(0)
        })

    } catch (error) {
        console.error('❌ Failed to start Appium Server:', error)
        process.exit(1)
    }
}

main()
