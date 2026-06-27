import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { accountsRouter } from './routes/accounts.routes.js';
import { activityRouter } from './routes/activity.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { insightsRouter } from './routes/insights.routes.js';
import { organizationsRouter } from './routes/organizations.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { purchasesRouter } from './routes/purchases.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { salesRouter } from './routes/sales.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { suppliersRouter } from './routes/suppliers.routes.js';
import { usersRouter } from './routes/users.routes.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'agrojatra-erp-api' }));

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/organizations', organizationsRouter);
  api.use('/admin', adminRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/categories', categoriesRouter);
  api.use('/products', productsRouter);
  api.use('/customers', customersRouter);
  api.use('/suppliers', suppliersRouter);
  api.use('/purchases', purchasesRouter);
  api.use('/sales', salesRouter);
  api.use('/reports', reportsRouter);
  api.use('/accounts', accountsRouter);
  api.use('/users', usersRouter);
  api.use('/settings', settingsRouter);
  api.use('/activity', activityRouter);
  api.use('/insights', insightsRouter);
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
