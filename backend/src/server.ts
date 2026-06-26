import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`🚀 AgroJatra ERP API running on http://localhost:${env.port}`);
  console.log(`   Health:  http://localhost:${env.port}/health`);
  console.log(`   API base: http://localhost:${env.port}/api`);
});
