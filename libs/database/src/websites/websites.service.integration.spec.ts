import { CoreResult } from 'entities/core-result.entity';
import { Website } from 'entities/website.entity';
import { Connection, createConnection, Repository } from 'typeorm';
import { WebsiteService } from './websites.service';

describe('AnalysisService', () => {
  let db: Connection;
  let websiteRepository: Repository<Website>;
  let coreResultRepository: Repository<CoreResult>;
  let service: WebsiteService;

  beforeEach(async () => {
    db = await createConnection({
      type: 'sqlite',
      database: ':memory:',
      entities: [CoreResult, Website],
      dropSchema: true,
      synchronize: true,
      logging: false,
    });

    websiteRepository = await db.getRepository(Website);
    coreResultRepository = await db.getRepository(CoreResult);
    service = new WebsiteService(websiteRepository);
  });

  afterEach(() => db.close());

  it('repository should be defined', () => {
    expect(websiteRepository).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('get only live snapshot website results', async () => {
    const firstWebsite = new Website();
    firstWebsite.url = 'https://18f.gov';
    firstWebsite.topLevelDomain = 'gov';
    firstWebsite.branch = 'Federal Agency - Executive';
    firstWebsite.agency = 'General Services Administration';
    firstWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    firstWebsite.agencyCode = 10;
    firstWebsite.bureauCode = 10;
    firstWebsite.sourceList = 'gov';

    const secondWebsite = new Website();
    secondWebsite.url = 'https://fake.gov';
    secondWebsite.topLevelDomain = 'gov';
    secondWebsite.branch = 'Federal Agency - Executive';
    secondWebsite.agency = 'Fake Agency';
    secondWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    secondWebsite.agencyCode = 10;
    secondWebsite.bureauCode = 10;
    secondWebsite.sourceList = 'gov';

    const thirdWebsite = new Website();
    thirdWebsite.url = 'https://anotherfake.gov';
    thirdWebsite.topLevelDomain = 'gov';
    thirdWebsite.branch = 'Federal Agency - Executive';
    thirdWebsite.agency = 'Fake Agency';
    thirdWebsite.bureau = 'GSA,FAS,Technology Transformation Service';
    thirdWebsite.agencyCode = 10;
    thirdWebsite.bureauCode = 10;
    thirdWebsite.sourceList = 'gov';

    const firstCoreResult = new CoreResult();
    firstCoreResult.website = firstWebsite;
    firstCoreResult.finalUrlIsLive = true;
    firstCoreResult.notFoundScanStatus = 'complete';
    firstCoreResult.primaryScanStatus = 'complete';
    firstCoreResult.robotsTxtScanStatus = 'complete';
    firstCoreResult.sitemapXmlScanStatus = 'complete';
    firstCoreResult.targetUrlBaseDomain = 'complete';
    firstCoreResult.finalUrlMIMEType = 'text/html';

    const secondCoreResult = new CoreResult();
    secondCoreResult.website = secondWebsite;
    secondCoreResult.finalUrlIsLive = false;
    secondCoreResult.notFoundScanStatus = 'complete';
    secondCoreResult.primaryScanStatus = 'complete';
    secondCoreResult.robotsTxtScanStatus = 'complete';
    secondCoreResult.sitemapXmlScanStatus = 'complete';
    secondCoreResult.targetUrlBaseDomain = 'complete';
    secondCoreResult.finalUrlMIMEType = 'text/html';

    const thirdCoreResult = new CoreResult();
    thirdCoreResult.website = thirdWebsite;
    thirdCoreResult.finalUrlIsLive = true;
    thirdCoreResult.notFoundScanStatus = 'complete';
    thirdCoreResult.primaryScanStatus = 'complete';
    thirdCoreResult.robotsTxtScanStatus = 'complete';
    thirdCoreResult.sitemapXmlScanStatus = 'complete';
    thirdCoreResult.targetUrlBaseDomain = 'complete';
    thirdCoreResult.finalUrlMIMEType = 'application/json';

    await websiteRepository.insert(firstWebsite);
    await coreResultRepository.insert(firstCoreResult);
    await websiteRepository.insert(secondWebsite);
    await coreResultRepository.insert(secondCoreResult);
    await websiteRepository.insert(thirdWebsite);
    await coreResultRepository.insert(thirdCoreResult);

    const result = await service.findLiveSnapshotWebsiteResults();

    expect(result.length).toStrictEqual(1);
  });
});
