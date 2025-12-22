
exports.setApp = function (JPS){

  //#############################
  // Add headers
  //#############################
  JPS.app.use( (req, res, next) => {
      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('content-type', 'text/plain')
      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'content-type')
      // Pass to next layer of middleware
      next();
  });

}
