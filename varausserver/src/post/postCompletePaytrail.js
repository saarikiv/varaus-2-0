
var md5 = require ('md5')

exports.setApp = function (JPS){

//######################################################
// GET: clienttoken, needed for the client to initiate payment method
//######################################################

  JPS.app.post('/completepaytrail', (req, res) => {
    
    
    JPS.now = Date.now();
    console.log("completepaytrail requested.", JPS.now);
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
        console.log("POST:", JPS.post);
        JPS.merchantAuthenticationhash = "6pKF4jkv97zmqBJ3ZL8gUw5DfT2NMQ"
        console.log("ORDER_NUMBER", JPS.post.ORDER_NUMBER);
        console.log("TIMESTAMP", JPS.post.TIMESTAMP);
        console.log("PAID", JPS.post.PAID);
        console.log("METHOD", JPS.post.METHOD);
        console.log("RETURN_AUTHCODE", JPS.post.RETURN_AUTHCODE);
        JPS.hashOK = md5(JPS.post.ORDER_NUMBER + '|' + JPS.post.TIMESTAMP + '|' + JPS.post.PAID + '|' + JPS.post.METHOD + '|' + JPS.merchantAuthenticationhash).toUpperCase()
        JPS.hashNOK = md5(JPS.post.ORDER_NUMBER + '|' + JPS.post.TIMESTAMP + '|' + JPS.merchantAuthenticationhash).toUpperCase()
        console.log("HASH-OK", JPS.hashOK);
        console.log("HASH-NOK", JPS.hashNOK);
        JPS.orderNumber = JPS.post.ORDER_NUMBER;
        JPS.timeStamp = JPS.post.TIMESTAMP;
        JPS.paymentTransactionRef = JPS.post.PAID;
        JPS.paymentMethod = JPS.post.METHOD
        JPS.authorizationCode = JPS.post.RETURN_AUTHCODE;

        JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
        .then(decodedToken => {
            JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
            console.log("User: ", JPS.currentUserUID, " requested completepaytrail.");
            return JPS.firebase.database().ref('/users/' + JPS.currentUserUID).once('value');
        })
        .then(snapshot => {
            if(snapshot.val() != null){
              JPS.user = snapshot.val()
              JPS.user.key = snapshot.key;
              if(JPS.post.PAID){
                console.log("Transaction was paid OK");
                if(JPS.hashOK === JPS.post.RETURN_AUTHCODE){
                  console.log("Authorization code matches!!", JPS.hashOK);
                  console.log("start processing: ", JPS.orderNumber);

                  JPS.pendingTransactionsHelper.completePendingTransaction(JPS, JPS.orderNumber, JPS.paymentTransactionRef, "PayTrail", JPS.paymentMethod)
                  .then( status => {
                      console.log("Status from completing pending transaction: ", status);
                      res.status(200).end();
                  })
                  .catch((error) => {
                      console.error("Complete pending transaction request failed: ", error);
                      throw( new Error("Complete pending transaction request failed: " + error.message))
                  })

                } else {
                  console.error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK);
                  throw (new Error("Input authorization code did not match: " + JPS.hashOK + "!=" + JPS.authorizationCode + " --- " + JPS.hashNOK))
                }
              }
              else{
                console.log("Payment did not clear or was cancelled. Remove the pending transaction: ", JPS.orderNumber);
                JPS.firebase.database().ref('/pendingtransactions/'+JPS.orderNumber).remove()
                .then(() => {
                  console.log("Pending transaction for NOK payment removed: ", JPS.orderNumber);
                  res.status(200).end();
                })
                .catch(error => {
                  console.error("Removing pending transaction failed.");
                  throw (new Error("Removing pending transaction failed." + error.message))
                })
              }
            } else{
              throw( new Error("User was not found in db: " + JPS.currentUserUID) );
            }

        })
        .catch(err => {
            console.error("Complete Pay Trai transaction failed: ", err);
            res.status(500).jsonp({
                message: "Complete Pay Trai transaction failde." + err
            }).end(err);
        })
    })
  })
}
