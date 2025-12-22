
module.exports = {

    executeTestCase: (JPS, testCase) => {
        var promise = new Promise( (resolve, reject) => {
            switch(testCase){
            case "firebase_error_log":
                JPS.tests.testFirebaseLogging(JPS)
                .then(() => {resolve()})
                .catch(error => {
                    reject(error)})
                break;
            default:
                console.error("Test case was not known");
                reject("Unknown test case: " + testCase)
            }
        })
        return promise;
    },

    testFirebaseLogging: (JPS) => {
        var promise = new Promise( (resolve, reject) => {
            try{
                console.log("Test case: testFirebaseLogging");
                JPS.errorHelper.logErrorToFirebase(JPS,{
                    error: "testivirhe",
                    details: "jotain meni tosi pieleen",
                    context: {
                        id: 56,
                        runner: "iskari"
                    }
                })
            } 
            catch(e){
                console.error("Test case: testFirebaseLogging failed:", e);
                reject(e);
            }
            console.log("Test case: testFirebaseLogging passed");
            resolve();
        })
        return promise;
    }
}