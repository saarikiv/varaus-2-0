

const { validateBody } = require('../src/helpers/validateBody');

exports.setApp = function (JPS){

  //######################################################
  // POST: test
  //######################################################

  JPS.app.post('/test', JPS.authMiddleware, async (req, res) => {
    const now = Date.now();
    console.log("POST: test", now);
    const post = req.body;
    console.log("POST:", post);

    const validationErrors = validateBody(post, [
        { field: 'current_user', type: 'string' },
        { field: 'test_case', type: 'string' }
    ]);
    if (validationErrors.length > 0) {
        return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const testCase = post.test_case;

    const currentUserUID = req.auth.uid;
    console.log("User: ", currentUserUID, " requested test - case: ", testCase);

    try {
      await JPS.tests.executeTestCase(JPS, testCase);
      res.status(200).json({ message: "Test passed." });
    } catch (error) {
      res.status(500).json({ error: "Test failed: " + error.toString() });
    }
  })
}
