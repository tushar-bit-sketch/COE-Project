import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';
import * as sourceController from '../controllers/source.controller.js';
import * as targetController from '../controllers/target.controller.js';
import * as eventController from '../controllers/event.controller.js';
import * as systemController from '../controllers/system.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';

export const apiRouter = Router();

// Authentication Routes
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/logout', requireAuth, authController.logout);
apiRouter.get('/auth/session', optionalAuth, authController.getSession);

// Surveillance Sources Routes
apiRouter.get('/sources', sourceController.listSources);
apiRouter.post('/sources', requireAuth, sourceController.createSource);
apiRouter.get('/sources/:id', sourceController.getSource);
apiRouter.patch('/sources/:id', requireAuth, sourceController.updateSource);
apiRouter.delete('/sources/:id', requireAuth, sourceController.deleteSource);
apiRouter.post('/sources/:id/test', sourceController.testSourceConnection);
apiRouter.post('/sources/:id/start', requireAuth, sourceController.startSource);
apiRouter.post('/sources/:id/stop', requireAuth, sourceController.stopSource);

// Target Intelligence & Tracking Routes
apiRouter.get('/targets', targetController.listTargets);
apiRouter.get('/targets/:id', targetController.getTarget);
apiRouter.post('/targets/:id/lock', optionalAuth, targetController.lockTarget);
apiRouter.post('/targets/:id/unlock', optionalAuth, targetController.unlockTarget);
apiRouter.get('/targets/:id/history', targetController.getTargetHistory);

// Event Audit & Alarm Routes
apiRouter.get('/events', eventController.listEvents);
apiRouter.get('/events/:id', eventController.getEvent);
apiRouter.post('/events/:id/acknowledge', optionalAuth, eventController.acknowledgeEvent);

// System Diagnostics & Simulation Controls
apiRouter.get('/system/health', systemController.getSystemHealth);
apiRouter.get('/system/metrics', systemController.getSystemMetrics);
apiRouter.get('/system/status', systemController.getSystemStatus);
apiRouter.post('/system/simulation', systemController.updateSimulation);
apiRouter.post('/system/simulation/reset', systemController.resetSimulation);
apiRouter.post('/system/simulation/pause', systemController.toggleSimulationPause);

// Analytics Routes
apiRouter.get('/analytics/overview', analyticsController.getAnalyticsOverview);
apiRouter.get('/analytics/dwell', analyticsController.getDwellAnalytics);
