import { Router } from 'express';
import {
  getPublicBusinessByIdentifier,
  getPublicBusinesses,
  getPublicStats,
  getPublicWorkerByIdentifier,
  getPublicWorkers,
} from '../controllers/publicController';

const router: Router = Router();

router.get('/stats', getPublicStats);
router.get('/workers', getPublicWorkers);
router.get('/workers/:identifier', getPublicWorkerByIdentifier);
router.get('/businesses', getPublicBusinesses);
router.get('/businesses/:identifier', getPublicBusinessByIdentifier);

export default router;
