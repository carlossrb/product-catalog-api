import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  readonly status: string;
  readonly timestamp: string;
  readonly uptime: number;
  readonly database: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
