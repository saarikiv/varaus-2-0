//------------------------------------------
// Server main file
//------------------------------------------

const express = require('express');
const admin = require('firebase-admin');

const JPS = {}; // The global.
JPS.tests = require('../tests/tests.js');
JPS.timeHelper = require('./helpers/timeHelper.js');
JPS.errorHelper = require('./helpers/errorHelper.js');
JPS.pendingTransactionsHelper = require('./helpers/pendingTransactionsHelper.js');
JPS.mailer = require('./helpers/mailer.js');

console.log("ENV: ", process.env.PWD);

// Validate required environment variables
const requiredEnvVars = ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'MAILGUN_FROM_WHO'];
requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
        console.warn(`WARNING: Required environment variable ${varName} is not set. Email functionality may not work.`);
    }
});

// Firebase Admin SDK configuration
let serviceAccount;
let databaseURL;

if (process.env.NODE_ENV === "production") {
    serviceAccount = require("../public/varaus-prod.json");
    databaseURL = "https://hakolahdentie-2.firebaseio.com/";
} else {
    serviceAccount = require("../public/varaus-stage.json");
    databaseURL = "https://varaus-a0250.firebaseio.com/";
}

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL,
    databaseAuthVariableOverride: {
        uid: "varausserver"
    }
});

// Create firebase compatibility layer for existing code
JPS.firebase = {
    auth: () => admin.auth(),
    database: () => admin.database()
};

JPS.firebaseConfig = {
    databaseURL: databaseURL
};

JPS.app = express();
JPS.date = new Date();
JPS.listenport = 3000;

//------------------------------------------
// Process handlers
//------------------------------------------
process.on('exit', (code) => {
    console.log("Process exited with code: ", code);
});

process.on('uncaughtException', (err) => {
    console.error("Caught exception:", err);
    JPS.errorHelper.logErrorToFirebase(JPS, err);
});

// Get port primarily from Environment
JPS.app.set('port', (process.env.PORT || JPS.listenport));

JPS.app.use(express.static(__dirname + '/public'));

JPS.app.listen(JPS.app.get('port'), function() {
    console.log('Node app is running on port', JPS.app.get('port'));
    if (process.env.NODE_ENV === "production") {
        console.log("Running against production firebase.");
    } else {
        console.log("Running against stage firebase.");
    }
    console.log(JPS.firebaseConfig);
});

JPS.mailer.initializeMail(JPS);

// HEADERS
require('./setHeaders.js').setApp(JPS);

// Body parsing middleware
JPS.app.use(express.json({ limit: '1mb' }));

// Handle malformed JSON from express.json()
JPS.app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body too large' });
    }
    next(err);
});
// Health check endpoint (no authentication required)
JPS.app.get('/health', (req, res) => {
    const health = { status: 'ok' };

    // Optionally verify Firebase connectivity
    JPS.firebase.database().ref('/').once('value')
        .then(() => {
            health.firebase = 'connected';
            res.status(200).json(health);
        })
        .catch((err) => {
            health.firebase = 'error';
            health.firebaseError = err.message;
            res.status(200).json(health);
        });
});

// Authentication middleware
const { createAuthMiddleware } = require('./middleware/auth.js');
const { createAdminAuthMiddleware } = require('./middleware/adminAuth.js');
JPS.authMiddleware = createAuthMiddleware(JPS);
JPS.adminAuthMiddleware = createAdminAuthMiddleware(JPS);

// POST
require('./post/postNotifyRegistration.js').setApp(JPS);
require('./post/postFeedback.js').setApp(JPS);
require('./post/postCheckout.js').setApp(JPS);
require('./post/postApproveIncomplete.js').setApp(JPS);
require('./post/postInitializeDelayedTransaction.js').setApp(JPS);
require('./post/postCashbuy.js').setApp(JPS);
require('./post/postCancelSlot.js').setApp(JPS);
require('./post/postReserveSlot.js').setApp(JPS);
require('./post/postNotifyDelayed.js').setApp(JPS);
require('./post/postRemoveTransaction.js').setApp(JPS);
require('./post/postOkTransaction.js').setApp(JPS);
if (process.env.NODE_ENV !== "production") {
    require('../tests/postTest.js').setApp(JPS);
}
