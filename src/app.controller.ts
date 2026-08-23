import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';

class HealthResponseDto {
  status: string;
  timestamp: string;
}

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Public liveness probe. Returns 200 with the current server status and timestamp if the process is up. Does not check database connectivity.',
  })
  @ApiOkResponse({
    description: 'Service is up.',
    type: HealthResponseDto,
    schema: { example: { status: 'ok', timestamp: '2026-08-23T10:15:00.000Z' } },
  })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
