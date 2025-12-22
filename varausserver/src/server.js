//------------------------------------------
// Server main file
//------------------------------------------

const express = require('express');
const admin = require('firebase-admin');

const JPS = {}; // The global.
JPS.tests = require('../tests/tests.js');
JPS.timeHelper = require('./helpers/timeHelper.js');
JPS.errorHelper = require('./helpers/errorHelper.js');
JPS.cancelHelper = require('./helpers/cancelHelper.js');
JPS.pendingTransactionsHelper = require('./helpers/pendingTransactionsHelper.js');
JPS.mailer = require('./helpers/mailer.js');
JPS.braintree = require("braintree");

console.log("ENV: ", process.env.PWD);

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

console.log("PROCESS: ", process);

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

// POST
require('./post/postNotifyRegistration.js').setApp(JPS);
require('./post/postFeedback.js').setApp(JPS);
require('./post/postPayTrailAuthCode.js').setApp(JPS);
require('./post/postCheckout.js').setApp(JPS);
require('./post/postApproveIncomplete.js').setApp(JPS);
require('./post/postCompletePaytrail.js').setApp(JPS);
require('./post/postInitializePayTrailTransaction.js').setApp(JPS);
require('./post/postInitializeDelayedTransaction.js').setApp(JPS);
require('./post/postCancelPayTrailTransaction.js').setApp(JPS);
require('./post/postCashbuy.js').setApp(JPS);
require('./post/postCancelSlot.js').setApp(JPS);
require('./post/postReserveSlot.js').setApp(JPS);
require('./post/postCancelSlot.js').setApp(JPS);
require('./post/postNotifyDelayed.js').setApp(JPS);
require('./post/postRemoveTransaction.js').setApp(JPS);
require('./post/postOkTransaction.js').setApp(JPS);
require('../tests/postTest.js').setApp(JPS);
