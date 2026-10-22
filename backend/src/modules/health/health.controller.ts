import { Request, Response } from 'express';

export class HealthController {
  static getHealth(req: Request, res: Response) {
    res.json({
      status: 'ok',
      service: 'aegisvault-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nonCustodialProof: 'Service operates strictly as zero-knowledge proxy; no private keys processed or stored.',
    });
  }
}
