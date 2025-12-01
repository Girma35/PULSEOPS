const express = require('express');
const router = express.Router();
const controller = require('../controllers/monitorController');

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/check', controller.checkNow);
router.get('/:id/results', controller.results);

module.exports = router;
