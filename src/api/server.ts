import Fastify from 'fastify';
import { sourceRoutes } from './routes/sources.js';
import { evidenceRoutes } from './routes/evidence.js';
import { claimRoutes } from './routes/claims.js';
import { alternativeExplanationRoutes } from './routes/alternative_explanations.js';
import { topicRoutes } from './routes/topics.js';
import { researchBriefRoutes } from './routes/research_briefs.js';
import { linkedinDraftRoutes } from './routes/linkedin_drafts.js';
import { conflictRoutes } from './routes/conflicts.js';
import { referenceRoutes } from './routes/references.js';

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

await app.register(sourceRoutes, { prefix: '/api' });
await app.register(evidenceRoutes, { prefix: '/api' });
await app.register(claimRoutes, { prefix: '/api' });
await app.register(alternativeExplanationRoutes, { prefix: '/api' });
await app.register(topicRoutes, { prefix: '/api' });
await app.register(researchBriefRoutes, { prefix: '/api' });
await app.register(linkedinDraftRoutes, { prefix: '/api' });
await app.register(conflictRoutes, { prefix: '/api' });
await app.register(referenceRoutes, { prefix: '/api' });

const PORT = Number(process.env.PORT) || 3000;

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}