var JPSM = {}
JPSM.Mailgun = require('mailgun-js')
JPSM.mg_api_key = process.env.MAILGUN_API_KEY;
JPSM.mg_domain = process.env.MAILGUN_DOMAIN || 'sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.mg_from_who = process.env.MAILGUN_FROM_WHO || 'postmaster@sandbox75ae890e64684217a94067bbc25db626.mailgun.org';
JPSM.feedbackMail = process.env.FEEDBACK_ADDRESS || null;
JPSM.notifyMail = process.env.NOTIFY_ADDRESS || null;
JPSM.registrationMail = process.env.REGISTRATION_ADDRESS || null;
JPSM.initialized = false;

module.exports = {

    initializeMail: (jps) => {
        if (!JPSM.initialized) {
            JPSM.jps = jps;
            JPSM.mailgun = new JPSM.Mailgun({
                apiKey: JPSM.mg_api_key,
                domain: JPSM.mg_domain
            });
        }
        JPSM.initialized = true;
    },

    sendThankyouForFeedback: (user) => {
        if (!JPSM.initialized) return;

        console.log("sendThankyouForFeedback")
        console.log(user)

        const html =
            "<h1>Kiitos palautteesta!</h1>" +
            "<p>Olemme vastaanottaneet palautteesi ja arvostamme sitä, että käytit aikaasi antaaksesi palautetta.</p>" +
            "<p>Teemme kaikkemme, jotta voimme palvella Sinua paremmin tulevaisuudessa.</p>" +
            "<br>" +
            "<p>Ystävällisin terveisin,</p>" +
            "<p>Hakolahdentie 2</p>"

        const data = {
            from: JPSM.mg_from_who,
            to: user.email,
            subject: 'Kiitos palautteesta!',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },


    sendNotifyDelayed: (user, transaction) => {
        if (!JPSM.initialized) return;
        if (!JPSM.notifyMail) {
            console.warn("NOTIFY_ADDRESS not set, skipping sendNotifyDelayed");
            return;
        }

        console.log("sendNotifyDelayed")
        console.log(user)
        console.log(transaction)

        const html =
            "<h1>Ostoilmoitus:</h1>" +
            "<p> Hakolahdentie 2 saunavarusjärjestelmässä odottaa osto vahvistamista.</p>" +
            "<br>" +
            "<p> Oston tunniste: " + transaction + "</p>" +
            "<br>" +
            "<p> Oston teki käyttäjä: " + user.uid + "</p>" +
            "<p> Nimi: " + user.firstname + " " + user.lastname + "</p>" +
            "<p> Sähköposti: " + user.email + "</p>" 
            

        console.log("Notification: ", html)

        const data = {
            from: JPSM.mg_from_who,
            to: JPSM.notifyMail,
            subject: 'Hakolahdentie 2 oston ilmoitus',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },

    sendFeedback: (user, feedback) => {
        if (!JPSM.initialized) return;
        if (!JPSM.feedbackMail) {
            console.warn("FEEDBACK_ADDRESS not set, skipping sendFeedback");
            return;
        }

        console.log("sendFeedback")
        console.log(user)
        console.log(feedback)

        const html =
            "<h1>Palaute:</h1>" +
            "<p>"+ feedback +"</p>" +
            "<br>" +
            "<p> Terveisin " + user.email + "</p>"
        console.log("Feedback: ", html)

        const data = {
            from: JPSM.mg_from_who,
            to: JPSM.feedbackMail,
            subject: 'Hakolahdentie 2 varaus palaute',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },

    sendRegistration: (user) => {
        if (!JPSM.initialized) return;
        if (!JPSM.registrationMail) {
            console.warn("REGISTRATION_ADDRESS not set, skipping sendRegistration");
            return;
        }

        console.log("sendRegistration")
        console.log(user)

        const html =
            "<h1>Rekisteröinti-ilmoitus:</h1>" +
            "<br>" +
            "<p> Käyttäjä:" + user.email + "</p>" +
            "<br>" +
            "<p> Nimi:" + user.firstname + " " + user.lastname + "</p>" +
            "<br>" +
            "<p> On rekisteröitynyt Hakolahdentie 2 varaus palveluun.</p>"
        console.log("Registration: ", html)

        const data = {
            from: JPSM.mg_from_who,
            to: JPSM.registrationMail,
            subject: 'Rekisteröinti imoitus',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },

    sendConfirmation: (sendTo, slotInfo, slotTime) => {
        if (!JPSM.initialized) return;

        console.log("sendConfirmation")
        console.log(sendTo)
        console.log(slotInfo)
        console.log(slotTime)

        const html =
            "<h1>Varauksen vahvistus</h1>" +
            "<p>Saunavuoron varauksesi on vahvistettu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(slotTime) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(slotTime) + "</p>" +
            "<br></br>" +
            "<p>Mikäli et pääse saunomaan, voit perua varauksesi vielä vähintään 3 h ennen vuoron alkamista.</p>"

        console.log("CONFIRMATION: ", html)

        const data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Varausvahvistus:' + slotTime.toString() + ' - Hakolahdentie 2',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-error: ", err);
            } else {
                console.log("MAIL-SENT: ", body);
            }
        });
    },

    sendCancellationCount: (sendTo, slotInfo, slotTimeMs) => {
        if (!JPSM.initialized) return;
        var day = new Date()
        day.setTime(slotTimeMs)
        console.log("sendCancellationCount")
        console.log(slotTimeMs)

        const html =
            "<h1>Peruutuksen vahvistus</h1>" +
            "<p>Peruutuksesi on vahvistettu.</p>" +
            "<p>Päivä: " + JPSM.jps.timeHelper.getDayStr(day) + "</p>" +
            "<p>Aika: " + JPSM.jps.timeHelper.getTimeStr(day) + "</p>" +
            "<br></br>" +
            "<p>Kertavarauksesi on palautettu tilillesi.</p>" +
            "<p>Tervetuloa saunomaan jonain toisena ajankohtana!</p>"

        const data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Peruutusvahvistus:' + day.toString() + ' - Hakolahdentie 2',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("CANCEL-SENT-error: ", err);
            } else {
                console.log("CANCEL-SENT: ", body);
            }
        });
    },

    sendReceipt: (sendTo, trx, trxId) => {
        if (!JPSM.initialized) return;

        console.log("sendReceipt")
        console.log(trx.title)
        var expires = new Date();
        expires.setTime(trx.expires);
        var expiresTxt = trx.expires != 0? "<p> Voimassaolo loppuu: " + JPSM.jps.timeHelper.getDayStr(expires) + "</p>" : ""

        const html =
            "<h1>Kiitos ostostasi!</h1>" +
            "<p>Voit nyt mennä varaamaan saunavuoroja.</p>" +
            "<br></br>" +
            "<h1>Laskun tiedot</h1>" +
            "<br></br>" +
            "<p>Tuote: " + trx.title + "</p>" +
            "<p>" + trx.desc + "</p>" +
            expiresTxt +
            "<p>Veroton hinta: " + trx.beforetax + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<p>ALV(" + trx.taxpercent + ")     : " + trx.taxamount + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<p>Yhteensä     : " + trx.price + " " + trx.details.transaction.currencyIsoCode + "</p>" +
            "<br></br>" +
            "<p>Ostotunniste: " + trxId + "</p>"

        const data = {
            from: JPSM.mg_from_who,
            to: sendTo,
            subject: 'Ostokuitti, Hakolahdentie 2',
            html: html
        }
        JPSM.mailgun.messages().send(data, (err, body) => {
            if (err) {
                console.error("MAILGUN-RECEIPT-error: ", err);
            } else {
                console.log("RECEIPT-SENT: ", body);
            }
        });
    }


}
