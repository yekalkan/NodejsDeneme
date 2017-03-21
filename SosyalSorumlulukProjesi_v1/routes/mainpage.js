var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
   if(req.session.email == undefined){
       res.redirect('/');
   }

    res.render('mainpage', { username: req.session.email});
});

module.exports = router;