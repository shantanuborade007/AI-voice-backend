import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Confirms the authenticated user either is an admin or owns the business
 * referenced by :businessId (or :id, for the top-level /businesses/:id
 * routes). Attaches the loaded business to the request for downstream use.
 */
@Injectable()
export class BusinessOwnershipGuard implements CanActivate {
  constructor(@InjectRepository(Business) private readonly businessesRepository: Repository<Business>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const businessId = request.params.businessId ?? request.params.id;

    if (!businessId) {
      return true;
    }

    const business = await this.businessesRepository.findOne({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (user?.role === UserRole.ADMIN || business.ownerId === user?.id) {
      request.business = business;
      return true;
    }

    throw new ForbiddenException('You do not have access to this business');
  }
}
