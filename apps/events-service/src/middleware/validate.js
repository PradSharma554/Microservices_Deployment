function validateEventBody(req, res, next) {
  const { title, description, date, venue, capacity, price } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string') errors.push('title is required');
  if (!description || typeof description !== 'string') errors.push('description is required');
  if (!date) errors.push('date is required');
  if (!venue || typeof venue !== 'string') errors.push('venue is required');
  if (capacity === undefined || typeof capacity !== 'number' || capacity < 1)
    errors.push('capacity must be a positive number');
  if (price === undefined || typeof price !== 'number' || price < 0)
    errors.push('price must be a non-negative number');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

module.exports = { validateEventBody };
