const Event = require('../models/Event');
const logger = require('../utils/logger');

async function listEvents(req, res) {
  try {
    const { status = 'published', page = '1', limit = '10', sort = 'date' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status !== 'all') filter.status = status;

    const [events, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limitNum),
      Event.countDocuments(filter),
    ]);

    res.json({
      data: events,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    logger.error('Failed to list events', { error: err });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

async function getEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ data: event });
  } catch (err) {
    logger.error('Failed to get event', { error: err });
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

async function createEvent(req, res) {
  try {
    const event = await Event.create(req.body);
    logger.info('Event created', { eventId: event._id });
    res.status(201).json({ data: event });
  } catch (err) {
    logger.error('Failed to create event', { error: err });
    res.status(500).json({ error: 'Failed to create event' });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    logger.info('Event updated', { eventId: event._id });
    res.json({ data: event });
  } catch (err) {
    logger.error('Failed to update event', { error: err });
    res.status(500).json({ error: 'Failed to update event' });
  }
}

async function deleteEvent(req, res) {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    logger.info('Event cancelled', { eventId: event._id });
    res.json({ data: event });
  } catch (err) {
    logger.error('Failed to delete event', { error: err });
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

async function getAvailability(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({
      data: {
        available: event.capacity - event.bookedCount,
        capacity: event.capacity,
        bookedCount: event.bookedCount,
      },
    });
  } catch (err) {
    logger.error('Failed to get availability', { error: err });
    res.status(500).json({ error: 'Failed to get availability' });
  }
}

async function bookTickets(req, res) {
  try {
    const { count } = req.body;
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.capacity - event.bookedCount < count) {
      return res.status(409).json({ error: 'Not enough tickets available' });
    }

    event.bookedCount += count;
    await event.save();

    logger.info('Tickets booked', { eventId: event._id, count });
    res.json({ data: { bookedCount: event.bookedCount, available: event.capacity - event.bookedCount } });
  } catch (err) {
    logger.error('Failed to book tickets', { error: err });
    res.status(500).json({ error: 'Failed to book tickets' });
  }
}

async function cancelTickets(req, res) {
  try {
    const { count } = req.body;
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.bookedCount = Math.max(0, event.bookedCount - count);
    await event.save();

    logger.info('Tickets cancelled', { eventId: event._id, count });
    res.json({ data: { bookedCount: event.bookedCount, available: event.capacity - event.bookedCount } });
  } catch (err) {
    logger.error('Failed to cancel tickets', { error: err });
    res.status(500).json({ error: 'Failed to cancel tickets' });
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getAvailability,
  bookTickets,
  cancelTickets,
};
