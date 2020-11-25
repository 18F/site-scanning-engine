import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { WebsiteController } from './website.controller';
import { CoreResult } from 'entities/core-result.entity';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';

describe('WebsiteController', () => {
  let websiteController: WebsiteController;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let website: Website;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
      ],
    }).compile();

    websiteController = app.get<WebsiteController>(WebsiteController);

    const coreResult = new CoreResult();
    coreResult.id = 1;
    const solutionsResult = new SolutionsResult();
    const website = new Website();
    website.coreResult = coreResult;
    website.solutionsResult = solutionsResult;
  });

  afterEach(async () => {
    mockReset(mockWebsiteService);
  });

  describe('websites', () => {
    it('should return a list of results', async () => {
      mockWebsiteService.findAllWithResult
        .calledWith()
        .mockResolvedValue([website]);

      const result = await websiteController.getResults();

      expect(result).toStrictEqual([website]);
    });

    it('should return a result by url', async () => {
      const url = '18f.gov';
      mockWebsiteService.findByUrl.calledWith(url).mockResolvedValue(website);

      const result = await websiteController.getResultByUrl(url);

      expect(result).toStrictEqual(website);
    });
  });
});
