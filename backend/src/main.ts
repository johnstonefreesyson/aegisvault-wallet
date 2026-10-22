import express from 'express';
import { HealthController } from './modules/health/health.controller';
import { NetworksController } from './modules/networks/networks.controller';
import { MarketService } from './modules/market/market.service';
import { BlockchainService } from './modules/blockchain/blockchain.service';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Routes
app.get('/api/health', HealthController.getHealth);
app.get('/api/networks', NetworksController.listNetworks);
app.get('/api/market/overview', MarketService.getMarkets);
app.get('/api/blockchain/:chainId/balance/:address', BlockchainService.getBalance);
app.post('/api/blockchain/broadcast', BlockchainService.broadcastTransaction);

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AegisVault API] Microservice listening on port ${PORT}`);
  });
}
