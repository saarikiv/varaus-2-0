
const { validateBody } = require('../helpers/validateBody');

exports.setApp = function (JPS){

  //######################################################
  // POST: reserveSlot
  // Reduces from the user needed tokens and assigns the user to the slot.
  //######################################################

  JPS.app.post('/reserveSlot', JPS.authMiddleware, async (req, res) => {
    const now = Date.now();
    console.log("POST: reserveslot", now);
    const post = req.body;
    console.log("POST:", post);

    const validationErrors = validateBody(post, [
      { field: 'user', type: 'string' },
      { field: 'slotInfo', type: 'object' },
      { field: 'slotInfo.key', type: 'string' },
      { field: 'slotInfo.start', type: 'number' },
      { field: 'slotInfo.day', type: 'number' },
      { field: 'weeksForward', type: 'number' }
    ]);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const slotInfo = post.slotInfo;
    const weeksForward = post.weeksForward;
    const slotTime = JPS.timeHelper.getSlotTimeLocal(weeksForward, slotInfo.start, slotInfo.day)

    const currentUserUID = req.auth.uid;
    const user = req.auth.user;

    console.log("User: ", currentUserUID, " requested reserveSlot.");
    console.log("USER:", user);
    console.log("slotINFO:", slotInfo);
    console.log("Starting to process user transactions");

    try {
      const snapshot = await JPS.firebase.database().ref('/transactions/'+currentUserUID).once('value');
      const allTx = snapshot.val();

      let userHasCount = false;
      let earliestToExpire = 0;
      let expiryTime = 9999999999999;
      let recordToUpdate = {};
      let unusedtimes = 0;
      let transactionReference = 0;

      for (let one in allTx){
        if((allTx[one].expires > now) && (allTx[one].unusedtimes > 0)){
          userHasCount = true;
          //Find the earliest to expire record
          if(allTx[one].expires < expiryTime){
            earliestToExpire = one;
            expiryTime = allTx[one].expires;
            recordToUpdate = allTx[one];
            unusedtimes = allTx[one].unusedtimes;
          }
        }
      }

      transactionReference = 0; //Leave it 0 if booking is based on time-token.
      if(!userHasCount){
        console.log("User does not have count");
        throw new Error("User is not entitled to book this slot");
      }

      // Process user has count option
      transactionReference = earliestToExpire;
      recordToUpdate.unusedtimes = recordToUpdate.unusedtimes - 1;
      unusedtimes = unusedtimes - 1;

      await JPS.firebase.database()
        .ref('/transactions/'+currentUserUID+'/'+earliestToExpire)
        .update({unusedtimes: unusedtimes});

      console.log("Updated transaction date for user: ", currentUserUID);

      // Write the bookings into the database
      const bookingTime = slotTime.getTime();

      await JPS.firebase.database().ref('/bookingsbyslot/'+slotInfo.key+'/'+bookingTime+'/'+user.key)
        .update({
          user: (user.alias)? user.alias : user.firstname + " " + user.lastname,
          transactionReference: transactionReference,
          slotTime: bookingTime
        });

      await JPS.firebase.database().ref('/bookingsbyuser/'+user.key+'/'+slotInfo.key+'/'+bookingTime)
        .update({
          transactionReference: transactionReference,
          slotTime: bookingTime
        });

      res.status(200).json({ message: "Booking done successfully" });
      JPS.mailer.sendConfirmation(user.email, slotInfo, slotTime); //Send confirmation email

    } catch (err) {
      console.error("Reserve slot failed: ", err);
      res.status(500).json({ error: "Reserve slot failed: " + String(err) });
    }
  })
}
