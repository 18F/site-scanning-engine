import { CoreResultService } from '@app/database/core-results/core-result.service';
import { WebsiteService } from '@app/database/websites/websites.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mock, MockProxy, mockReset } from 'jest-mock-extended';
import { WebsiteController } from './website.controller';
import { CoreResult } from 'entities/core-result.entity';

describe('WebsiteController', () => {
  let websiteController: WebsiteController;
  let mockWebsiteService: MockProxy<WebsiteService>;
  let mockCoreResultsService: MockProxy<CoreResultService>;

  beforeEach(async () => {
    mockWebsiteService = mock<WebsiteService>();
    mockCoreResultsService = mock<CoreResultService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
        },
        {
          provide: CoreResultService,
          useValue: mockCoreResultsService,
        },
      ],
    }).compile();

    websiteController = app.get<WebsiteController>(WebsiteController);
  });

  afterEach(async () => {
    mockReset(mockWebsiteService);
  });

  describe('websites', () => {
    it('should return a list of results', async () => {
      const coreResult = new CoreResult();
      coreResult.id = 1;

      mockCoreResultsService.findResultsWithWebsite
        .calledWith()
        .mockResolvedValue(Promise.resolve([coreResult]));

      const result = await websiteController.getResults();

      expect(result).toStrictEqual([coreResult]);
    });
  });
});
