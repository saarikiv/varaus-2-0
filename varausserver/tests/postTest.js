
exports.setApp = function (JPS){

  //######################################################
  // POST: reserveSlot
  // Reduces from the user needed tokens and assigns the user to the slot.
  // Caller must check that the user is entitled to the reservation.
  //######################################################

  JPS.app.post('/test', (req, res) => {
    JPS.now = Date.now();
    console.log("POST: test", JPS.now);
    JPS.body = '';
    req.on('data', (data) => {
      JPS.body += data;
      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (JPS.body.length > 1e6) req.connection.destroy();
    });

    req.on('end', () => {
      JPS.post = JSON.parse(JPS.body);
      console.log("POST:", JPS.post);
      JPS.currentUserToken = JPS.post.current_user;
      JPS.testCase = JPS.post.test_case;

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
      .then( decodedToken => {
        JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested test - case: ", JPS.testCase);
        JPS.tests.executeTestCase(JPS, JPS.testCase)
        .then(() => {res.status(200).end();})
        .catch(error => {res.status(500).jsonp(error.toString()).end(error);})
      })
      .catch( err => {
        console.error("Test failed: ", err);
        res.status(500).jsonp({context: "Test failed", err}).end(err);
      })
    })
  })
}
