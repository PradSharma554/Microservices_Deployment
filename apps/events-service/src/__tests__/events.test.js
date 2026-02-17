const Event = require('../models/Event');

describe('Event Model', () => {
  it('should have correct schema fields', () => {
    const schema = Event.schema.obj;
    expect(schema).toHaveProperty('title');
    expect(schema).toHaveProperty('description');
    expect(schema).toHaveProperty('date');
    expect(schema).toHaveProperty('venue');
    expect(schema).toHaveProperty('capacity');
    expect(schema).toHaveProperty('bookedCount');
    expect(schema).toHaveProperty('price');
    expect(schema).toHaveProperty('status');
  });

  it('should default status to published', () => {
    const event = new Event({
      title: 'Test Event',
      description: 'A test event',
      date: new Date(),
      venue: 'Test Venue',
      capacity: 100,
      price: 25,
    });
    expect(event.status).toBe('published');
    expect(event.bookedCount).toBe(0);
  });
});
