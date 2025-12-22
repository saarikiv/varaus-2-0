
exports.setApp = function (JPS){

  //######################################################
  // POST: reserveSlot
  // Reduces from the user needed tokens and assigns the user to the slot.
  //######################################################

  JPS.app.post('/reserveSlot', (req, res) => {
    JPS.now = Date.now();
    console.log("POST: reserveslot", JPS.now);
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
      JPS.currentUserToken = JPS.post.user;
      JPS.slotInfo = JPS.post.slotInfo;
      JPS.weeksForward = JPS.post.weeksForward;
      JPS.timezoneOffset = JPS.post.timezoneOffset;
      JPS.slotTime = JPS.timeHelper.getSlotTimeLocal(JPS.weeksForward, JPS.slotInfo.start, JPS.slotInfo.day)

      JPS.firebase.auth().verifyIdToken(JPS.currentUserToken)
      .then( decodedToken => {
        JPS.currentUserUID = decodedToken.uid || decodedToken.sub;
        console.log("User: ", JPS.currentUserUID, " requested reserveSlot.");
        return JPS.firebase.database().ref('/users/'+JPS.currentUserUID).once('value')
      })
      .then ( snapshot => {
        if(snapshot.val() == null){
          throw(new Error("User record does not exist in the database: " + JPS.currentUserUID))
        }
        JPS.user = snapshot.val();
        JPS.user.key = snapshot.key;
        console.log("USER:",JPS.user);
        console.log("slotINFO:",JPS.slotInfo);
        JPS.userHasCount = false;
        JPS.earliestToExpire = 0;
        JPS.expiryTime = 9999999999999;
        JPS.recordToUpdate = {};
        JPS.unusedtimes = 0;
        console.log("Starting to process user transactions");
        return JPS.firebase.database().ref('/transactions/'+JPS.currentUserUID).once('value')
      })
      .then( snapshot => {
        JPS.allTx = snapshot.val();
        for (JPS.one in JPS.allTx){
          if((JPS.allTx[JPS.one].expires > JPS.now) && (JPS.allTx[JPS.one].unusedtimes > 0)){
            JPS.userHasCount = true;
                //Find the earliest to expire record
            if(JPS.allTx[JPS.one].expires < JPS.expiryTime){
              JPS.earliestToExpire = JPS.one;
              JPS.expiryTime = JPS.allTx[JPS.one].expires;
              JPS.recordToUpdate = JPS.allTx[JPS.one];
              JPS.unusedtimes = JPS.allTx[JPS.one].unusedtimes;
            }
          }
        } // for - looping through transactions
        JPS.transactionReference = 0; //Leave it 0 if bookign is based on time-token.
        if(!JPS.userHasCount){
          console.log("User does not have count");
          throw( new Error("User is not entitled to book this slot"));
        }
        else { //Process user has count option
          JPS.transactionReference = JPS.earliestToExpire;
          //TODO: Check tahat user has not already booked in to the slot before reducing count.
          JPS.recordToUpdate.unusedtimes = JPS.recordToUpdate.unusedtimes - 1;
          JPS.unusedtimes = JPS.unusedtimes - 1;
          JPS.firebase.database()
            .ref('/transactions/'+JPS.currentUserUID+'/'+JPS.earliestToExpire)
            .update({unusedtimes: JPS.unusedtimes})
            .then( err => {
              if(err){
                throw(new Error(err.message + " " + err.code));
              } else {
                console.log("Updated transaction date for user: ", JPS.currentUserUID);
              }
            })
            .catch(err => {throw(err)})
          }
          //If user is entitled, write the bookings in to the database
          if(JPS.userHasTime || JPS.userHasCount){
            JPS.bookingTime = JPS.slotTime.getTime();
            JPS.firebase.database().ref('/bookingsbyslot/'+JPS.slotInfo.key+'/'+JPS.bookingTime+'/'+JPS.user.key)
            .update({
              user: (JPS.user.alias)? JPS.user.alias : JPS.user.firstname + " " + JPS.user.lastname,
              transactionReference: JPS.transactionReference,
              slotTime: JPS.bookingTime
            })
            .then( err => {
              if(err){
                console.error("Booking by SLOT write to firabase failed: ", err);
                throw(new Error("Booking by SLOT write to firabase failed: " + err.toString()))
              }
              return JPS.firebase.database().ref('/bookingsbyuser/'+JPS.user.key+'/'+JPS.slotInfo.key+'/'+JPS.bookingTime)
              .update({
                transactionReference: JPS.transactionReference,
                slotTime: JPS.bookingTime
              })
            })
            .then( err => {
              if(err){
                console.error("Booking by USER write to firabase failed: ", err);
                throw(new Error("Booking by USER write to firabase failed: " + err.toString()))
              }
              else{
                //======================================
                res.status(200).jsonp("Booking done succesfully").end();
                JPS.mailer.sendConfirmation(JPS.user.email, JPS.slotInfo, JPS.slotTime); //Send confirmation email
                //======================================
              }
            })
            .catch( err => {
              throw(err)
            })
          }
      })
      .catch( err => {
        console.error("Reserve slot failed: ", err);
        res.status(500).jsonp("Reserve slot failed" + String(err)).end();
      })
    })
  })
}
