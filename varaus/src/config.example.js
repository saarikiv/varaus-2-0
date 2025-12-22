// Select your VARAUSSERVER
var VARAUSSERVER = 'http://localhost:3000';

// Initialize Firebase
// Stage
var firebaseStageConfig = {
    apiKey: "YOUR_STAGE_API_KEY",
    authDomain: "varaus-a0250.firebaseapp.com",
    databaseURL: "https://varaus-a0250.firebaseio.com",
    storageBucket: "varaus-a0250.appspot.com",
};
// PROD
var firebaseProdConfig = {
    apiKey: "YOUR_PROD_API_KEY",
    authDomain: "hakolahdentie-2.firebaseapp.com",
    databaseURL: "https://hakolahdentie-2.firebaseio.com",
    storageBucket: "hakolahdentie-2.appspot.com",
};

//----------------------------------------
//SELECT THE FIREBASE instance
//----------------------------------------
//firebase.initializeApp(firebaseStageConfig);
firebase.initializeApp(firebaseProdConfig);
//----------------------------------------
