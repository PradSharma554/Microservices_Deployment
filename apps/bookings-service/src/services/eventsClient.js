const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

const client = axios.create({
  baseURL: config.eventsServiceUrl,
  timeout: 5000,
});

async function getEvent(eventId) {
  const response = await client.get(`/api/events/${eventId}`);
  return response.data.data;
}

async function getEventAvailability(eventId) {
  const response = await client.get(`/api/events/${eventId}/availability`);
  return response.data.data;
}

async function reserveTickets(eventId, count) {
  const response = await client.patch(`/api/events/${eventId}/book`, { count });
  return response.data.data;
}

async function releaseTickets(eventId, count) {
  const response = await client.patch(`/api/events/${eventId}/cancel`, { count });
  return response.data.data;
}

module.exports = { getEvent, getEventAvailability, reserveTickets, releaseTickets };
