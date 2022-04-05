const winston = require('winston');

function initializeLogger(appInsightsClient) {
    // not using winston.createLogger as configuring the default logger
    // allows us to simply require winston in any other file and use
    // the logger without reconfiguring it
    winston.configure({
        level: process.env.Environment === 'production' ? 'info' : 'debug',
        format: winston.format.json(),
        // defaultMeta: { service: 'bot-service' },
        transports: [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' }),
            // new winston.transports.File({
            //     filename: 'logs/server.log',
                // format: winston.format.combine(
                //     winston.format.timestamp({ format: 'YYYY-DD-MM HH:mm:ss' }),
                //     winston.format.align(),
                //     winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
                // )
            // }),
        ],
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-DD-MM HH:mm:ss' }),
            winston.format.align(),
            winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
        )
    });

    return winston;
}

module.exports = {
    initializeLogger
};
