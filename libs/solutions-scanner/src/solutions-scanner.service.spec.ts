import { BROWSER_TOKEN } from '@app/browser';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { LoggerService } from '@app/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { mock, MockProxy } from 'jest-mock-extended';
import { Browser, Page, Response, Request } from 'puppeteer';
import { SolutionsScannerService } from './solutions-scanner.service';
import { SolutionsInputDto } from './solutions.input.dto';
import { source } from './testPageSource';

describe('SolutionsScannerService', () => {
  let service: SolutionsScannerService;
  let mockBrowser: MockProxy<Browser>;
  let mockPage: MockProxy<Page>;
  let mockRobotsPage: MockProxy<Page>;
  let mockLogger: MockProxy<LoggerService>;
  let mockResponse: MockProxy<Response>;
  let mockRobotsResponse: MockProxy<Response>;
  let redirectRequest: MockProxy<Request>;

  beforeEach(async () => {
    mockBrowser = mock<Browser>();
    mockPage = mock<Page>();
    mockRobotsPage = mock<Page>();
    mockResponse = mock<Response>();
    mockRobotsResponse = mock<Response>();
    mockBrowser.newPage.mockResolvedValueOnce(mockPage);
    mockBrowser.newPage.mockResolvedValueOnce(mockRobotsPage);
    mockLogger = mock<LoggerService>();
    redirectRequest = mock<Request>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolutionsScannerService,
        {
          provide: BROWSER_TOKEN,
          useValue: mockBrowser,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SolutionsScannerService>(SolutionsScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct response', async () => {
    const input: SolutionsInputDto = {
      websiteId: 1,
      url: '18f.gov',
    };

    const website = new Website();
    website.id = input.websiteId;

    mockPage.evaluate.mockResolvedValueOnce(4);
    mockPage.evaluate.mockResolvedValueOnce('Page Title');
    mockPage.evaluate.mockResolvedValueOnce('Page Description');
    mockPage.evaluate.mockResolvedValueOnce(true);
    mockResponse.text.mockResolvedValue(source);
    mockResponse.url.mockReturnValue('https://18f.gsa.gov');
    mockPage.goto.mockResolvedValue(mockResponse);
    redirectRequest.redirectChain.mockReturnValue([]);
    mockRobotsResponse.url.mockReturnValue('https://18f.gsa.gov/robots.txt');
    mockRobotsResponse.status.mockReturnValue(200);
    mockRobotsResponse.request.mockReturnValue(redirectRequest);

    mockRobotsPage.goto.mockResolvedValue(mockRobotsResponse);

    const result = await service.scan(input);
    const expected = new SolutionsResult();

    expected.website = website;
    expected.usaClasses = 4;
    expected.uswdsString = 1;
    expected.uswdsTables = 0;
    expected.uswdsInlineCss = 0;
    expected.uswdsUsFlag = 20;
    expected.uswdsStringInCss = 0; // :TODO mock this
    expected.uswdsUsFlagInCss = 0; // :TODO mock this
    expected.uswdsMerriweatherFont = 0; // :TODO mock this
    expected.uswdsPublicSansFont = 0; // :TODO mock this
    expected.uswdsSourceSansFont = 0; // :TODO mock this
    expected.uswdsCount = 25;
    expected.uswdsSemanticVersion = undefined;
    expected.uswdsVersion = 0;
    expected.dapDetected = false;
    expected.dapParameters = undefined;
    expected.ogTitleFinalUrl = 'Page Title';
    expected.ogDescriptionFinalUrl = 'Page Description';
    expected.mainElementFinalUrl = true;
    expected.robotsTxtFinalUrl = 'https://18f.gsa.gov/robots.txt';
    expected.robotsTxtFinalUrlLive = true;
    expected.robotsTxtTargetUrlRedirects = false;

    expected.status = ScanStatus.Completed;

    expect(result).toStrictEqual(expected);
  });
});
