import { Router } from 'express';
import { eventController } from './event.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { eventValidation } from './event.validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Create event - Only admins and teachers can create events
router.post(
  '/',
  authorize('admin', 'superadmin', 'teacher'),
  validateRequest(eventValidation.createEventSchema),
  eventController.createEvent
);

// Get all events with filtering and pagination
router.get(
  '/',
  validateRequest(eventValidation.getEventsSchema),
  eventController.getEvents
);

// Get today's events
router.get('/today', eventController.getTodaysEvents);

// Get upcoming events
router.get('/upcoming', eventController.getUpcomingEvents);

// Get specific event by ID
router.get(
  '/:id',
  validateRequest(eventValidation.getEventByIdSchema),
  eventController.getEventById
);

// Update event - Only admins and event creators can update
router.put(
  '/:id',
  authorize('admin', 'superadmin', 'teacher'),
  validateRequest(eventValidation.updateEventSchema),
  eventController.updateEvent
);

// Delete event - Only admins and event creators can delete
router.delete(
  '/:id',
  authorize('admin', 'superadmin', 'teacher'),
  eventController.deleteEvent
);

export const EventRoutes = router;