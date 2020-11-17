import { BROWSER_TOKEN, parseBrowserError } from '@app/browser';
import { ScanStatus } from '@app/core-scanner/scan-status';
import { LoggerService } from '@app/logger';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Scanner } from 'common/interfaces/scanner.interface';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Website } from 'entities/website.entity';
import { sum, uniq } from 'lodash';
import { Browser, Page, Response } from 'puppeteer';
import { SolutionsInputDto } from './solutions.input.dto';

@Injectable()
export class SolutionsScannerService
  implements Scanner<SolutionsInputDto, SolutionsResult>, OnModuleDestroy {
  private page: Page;
  private cssPages: string[];
  private htmlText: string;
  private response: Response;

  constructor(
    @Inject(BROWSER_TOKEN) private browser: Browser,
    private logger: LoggerService,
  ) {
    this.cssPages = [];
  }

  async scan(input: SolutionsInputDto): Promise<SolutionsResult> {
    const url = this.getHttpsUrls(input.url);

    let result: SolutionsResult;

    try {
      // load the page
      this.page = await this.browser.newPage();

      // attach listeners
      this.page.on('response', async response => {
        if (response.request().resourceType() == 'stylesheet') {
          const cssPage = await response.text();
          this.cssPages.push(cssPage);
        }
      });

      // goto url and wait until there are only 2 idle requests
      this.response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
      });

      // extract the html page source
      this.htmlText = await this.response.text();

      // build the result
      result = await this.buildResult(input.websiteId);
    } catch (error) {
      // build error result
      result = this.buildErrorResult(input.websiteId, error);
      if (result.status === ScanStatus.UnknownError) {
        this.logger.error(error.message, error.stack);
      }
    }

    await this.page.close();
    return result;
  }

  private getHttpsUrls(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  private buildErrorResult(websiteId: number, err: Error) {
    const errorType = parseBrowserError(err);
    const result = new SolutionsResult();
    const website = new Website();
    website.id = websiteId;
    result.website = website;
    result.status = errorType;

    return result;
  }

  private async buildResult(websiteId: number): Promise<SolutionsResult> {
    const result = new SolutionsResult();
    const website = new Website();
    website.id = websiteId;
    result.website = website;

    result.status = ScanStatus.Completed;
    result.usaClasses = await this.usaClassesCount();
    result.uswdsString = this.uswdsInHtml(this.htmlText);
    result.uswdsTables = this.tableCount(this.htmlText);
    result.uswdsInlineCss = this.inlineUsaCssCount(this.htmlText);
    result.uswdsUsFlag = this.uswdsFlagDetected(this.htmlText);
    result.uswdsUsFlagInCss = this.uswdsFlagInCSS(this.cssPages);
    result.uswdsStringInCss = this.uswdsInCss(this.cssPages);
    result.uswdsMerriweatherFont = this.uswdsMerriweatherFont(this.cssPages);
    result.uswdsPublicSansFont = this.uswdsPublicSansFont(this.cssPages);
    result.uswdsSourceSansFont = this.uswdsSourceSansFont(this.cssPages);
    result.uswdsSemanticVersion = this.uswdsSemVer(this.cssPages);
    result.uswdsVersion = result.uswdsSemanticVersion ? 20 : 0;

    const uswdsCount = sum([
      result.usaClasses,
      result.uswdsString,
      result.uswdsTables,
      result.uswdsInlineCss,
      result.uswdsUsFlag,
      result.uswdsUsFlagInCss,
      result.uswdsStringInCss,
      result.uswdsMerriweatherFont,
      result.uswdsSourceSansFont,
      result.uswdsPublicSansFont,
      result.uswdsVersion,
    ]);

    result.uswdsCount = uswdsCount;

    return result;
  }

  private async usaClassesCount() {
    const usaClassesCount = await this.page.evaluate(() => {
      const usaClasses = [...document.querySelectorAll("[class^='usa-']")];
      let score = 0;

      if (usaClasses.length > 0) {
        score = Math.round(Math.sqrt(usaClasses.length)) * 5;
      }

      return score;
    });

    return usaClassesCount;
  }

  private uswdsInHtml(htmlText: string) {
    const re = /uswds/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;
    this.logger.debug(`uswds occurs ${occurrenceCount} times`);
    return occurrenceCount;
  }

  /**
   * tableCount detects the presence of <table> elements in HTML. This is a negative indicator of USWDS.
   *
   * @param htmlText html in text.
   */
  private tableCount(htmlText: string) {
    const re = /<table/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;
    let deduction = 0;

    if (occurrenceCount > 0) {
      const tableDeduction = -10;
      deduction = tableDeduction * occurrenceCount;
    }

    return deduction;
  }

  private inlineUsaCssCount(htmlText: string) {
    const re = /\.usa-/g;
    const occurrenceCount = [...htmlText.matchAll(re)].length;

    return occurrenceCount;
  }

  private uswdsFlagDetected(htmlText: string) {
    // these are the asset names of the small us flag in the USA Header for differnt uswds versions and devices.
    const re = /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;

    // all we need is one match to give the points;
    const occurrenceCount = htmlText.match(re);
    let score = 0;

    if (occurrenceCount) {
      score = 20;
    }
    return score;
  }

  private uswdsInCss(cssPages: string[]) {
    let score = 0;
    const re = /uswds/i;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsFlagInCSS(cssPages: string[]) {
    // these are the asset names of the small us flag in the USA Header for differnt uswds versions and devices.
    const re = /us_flag_small.png|favicon-57.png|favicon-192.png|favicon-72.png|favicon-144.png|favicon-114.png/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsMerriweatherFont(cssPages: string[]) {
    const re = /[Mm]erriweather/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 5;
        break;
      }
    }

    return score;
  }

  private uswdsPublicSansFont(cssPages: string[]) {
    const re = /[Pp]ublic.[Ss]ans/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 20;
        break;
      }
    }

    return score;
  }

  private uswdsSourceSansFont(cssPages: string[]) {
    const re = /[Ss]ource.[Ss]ans.[Pp]ro/;
    let score = 0;

    for (const page of cssPages) {
      const match = page.match(re);
      if (match) {
        score = 5;
        break;
      }
    }

    return score;
  }

  private uswdsSemVer(cssPages: string[]): string | null {
    const re = /uswds v?[0-9.]*/i;

    const versions: string[] = [];

    for (const page of cssPages) {
      const match = page.match(re);

      if (match) {
        const version = match[0].split(' ')[1];
        versions.push(version);
      }
    }

    if (versions) {
      const uniqueVersions = uniq(versions);
      if (uniqueVersions.length > 1) {
        this.logger.debug(`found multiple USWDS versions ${uniqueVersions}`);
      }
      return uniqueVersions[0];
    } else {
      return null;
    }
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
