
var md5 = require ('md5')

exports.setApp = function (JPS){

    //######################################################
    // POST: 
    //######################################################
    JPS.app.post('/paytrailauthcode', (req, res) => {

        JPS.now = Date.now();
        console.log("paytrailauthcode requested.", JPS.now);
        JPS.body = '';
        req.on('data', (data) => {
            JPS.body += data;
            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (JPS.body.length > 1e6) req.connection.destroy();
        });
        req.on('end', () => {
            JPS.post = JSON.parse(JPS.body);
            JPS.currentUserToken = JPS.post.current_user;
            JPS.trxDetails = JPS.post.auth_code;
            console.log("POST:", JPS.post);

            JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
                .then(decodedToken => {
                    JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
                    console.log("User: ", JPS.currentUserUID, " requested paytrailauthcode.");
                    JPS.merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ" //TODO: get this from ENV
                    console.log("trxDetails", JPS.trxDetails);
                    JPS.hashOK = md5(JPS.merchantAuthenticationhash + '|' + JPS.trxDetails).toUpperCase()
                    console.log("HASH-OK", JPS.hashOK);
                    res.status(200).end(JPS.hashOK);
                }).catch(err => {
                    console.error("paytrailauthcode failed: ", err);
                    res.status(500).jsonp({
                        message: "paytrailauthcode failed." + err.toString()
                    }).end(err);
                });
            })
        })
}
