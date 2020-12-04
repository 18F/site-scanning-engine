import { FilterWebsiteDto } from '@app/database/websites/dto/filter-website.dto';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { NotFoundInterceptor } from '../not-found.interceptor';
import { WebsiteSerializerInterceptor } from './website-serializer.interceptor';

@Controller('websites')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @UseInterceptors(WebsiteSerializerInterceptor)
  async getResults(
    @Query() query: FilterWebsiteDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const websites = await this.websiteService.paginatedFilter(query, {
      page: page,
      limit: limit,
      route: 'http://localhost:3000',
    });
    return websites;
  }

  @Get(':url')
  @UseInterceptors(
    new NotFoundInterceptor('No website found for target url'),
    WebsiteSerializerInterceptor,
  )
  async getResultByUrl(@Param('url') url: string) {
    const result = await this.websiteService.findByUrl(url);
    return result;
  }
}
