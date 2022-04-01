// Import application insights
const { ApplicationInsightsTelemetryClient, TelemetryInitializerMiddleware } = require('botbuilder-applicationinsights');
const { TelemetryLoggerMiddleware } = require('botbuilder-core');

// Import required packages
const path = require('path');

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const restify = require('restify');

// Import required bot services.
const {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConversationState,
    createBotFrameworkAuthenticationFromConfiguration,
    MemoryStorage,
    UserState,
    NullTelemetryClient
} = require('botbuilder');

const { CosmosDbPartitionedStorage } = require('botbuilder-azure');

const { TeamsBot } = require('./bots/teamsBot');
const { MainDialog } = require('./dialogs/mainDialog');

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights. See https://aka.ms/bottelemetry for telemetry
    //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    // Clear out state
    await conversationState.delete(context);
};

// In memory cache
const cacheProvider = require('./services/cacheProvider');

// Setup cache singleton instance
cacheProvider.start(function (err) {
    if (err) console.error(err);
});

// Setup logger
const winston = require('winston');
const { AzureApplicationInsightsLogger } = require('winston-azure-application-insights');
const { initializeLogger }  = require('./services/logger');
let logger = initializeLogger();
if (process.env.Environment !== 'production') {
    // add a console logger transport
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple()
        })
    );
}
logger = logger.child({
    class: 'index'
});

let telemetryClient;
// Persist conversationState & userState according to the current environment
if (process.env.Environment === 'local') {
    // don't load application insights in this configuration
    telemetryClient = getTelemetryClient(false);
} else {
    // setup the app insights telemetry client
    telemetryClient = getTelemetryClient(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);

    // Add ApplicationInsights logger transport
    logger.add(
        new AzureApplicationInsightsLogger({
            client: telemetryClient
        })
    );
}

// Add telemetry middleware to the adapter middleware pipeline
const telemetryLoggerMiddleware = new TelemetryLoggerMiddleware(telemetryClient);
const initializerMiddleware = new TelemetryInitializerMiddleware(telemetryLoggerMiddleware);
adapter.use(initializerMiddleware);

// Define the state store for your bot.
// TODO replace with cosmos DB
const memoryStorage = new MemoryStorage();
// const cosmosDbPartitionedStorage = new CosmosDbPartitionedStorage({
//     cosmosDbEndpoint: config.cosmosDB.cosmosDbEndpoint,
//     authKey: config.cosmosDB.authKey,
//     databaseId: config.cosmosDB.databaseId,
//     containerId: config.cosmosDB.containerId,
//     compatibilityMode: config.cosmosDB.compatibilityMode === "false" ? false : true
// });

// Create conversation and user state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create the main dialog.
const dialog = new MainDialog(conversationState, userState);

// Create the bot that will handle incoming messages.
const bot = new TeamsBot(conversationState, userState, dialog);

// Attach telemetryClient to the main dialog
dialog.telemetryClient = telemetryClient;

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => bot.run(context));
});

// Creates a new TelemetryClient based on a instrumentation key
function getTelemetryClient(instrumentationKey) {
    if (instrumentationKey) {
        const telemetryClient = new ApplicationInsightsTelemetryClient(instrumentationKey);
        // configure telemetry client
        telemetryClient.configuration.setAutoCollectConsole(false, false); // don't collect console

        return telemetryClient;
    }
    return new NullTelemetryClient();
};
