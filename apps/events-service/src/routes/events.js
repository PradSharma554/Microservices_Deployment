const { Router } = require('express');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getAvailability,
  bookTickets,
  cancelTickets,
} = require('../controllers/events.controller');
const { validateEventBody } = require('../middleware/validate');

const router = Router();

router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', validateEventBody, createEvent);
router.put('/:id', validateEventBody, updateEvent);
router.delete('/:id', deleteEvent);
router.get('/:id/availability', getAvailability);
router.patch('/:id/book', bookTickets);
router.patch('/:id/cancel', cancelTickets);

module.exports = router;
