import { BROWSER_TOKEN } from '@app/browser';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Scanner } from 'common/interfaces/scanner.interface';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Website } from 'entities/website.entity';
import { round } from 'lodash';
import { Browser } from 'puppeteer';
import { UswdsInputDto } from './uswds.input.dto';

@Injectable()
export class UswdsScannerService
  implements Scanner<UswdsInputDto, UswdsResult>, OnModuleDestroy {
  constructor(@Inject(BROWSER_TOKEN) private browser: Browser) {}

  async scan(input: UswdsInputDto): Promise<UswdsResult> {
    const page = await this.browser.newPage();

    const result = new UswdsResult();
    const website = new Website();
    website.id = input.websiteId;

    result.website = website;

    const url = this.getHttpsUrls(input.url);
    await page.goto(url);

    const usaClasses = await page.evaluate(() => {
      return document.querySelectorAll("[class^='usa-']");
    });
    result.usaClassesDetected = this.uswdsUsaClasses(usaClasses);

    await this.browser.close();
    return result;
  }

  private getHttpsUrls(url: string) {
    if (!url.startsWith('https://')) {
      return `https://${url.toLowerCase()}`;
    } else {
      return url.toLowerCase();
    }
  }

  private uswdsUsaClasses(usaClasses: NodeListOf<Element>) {
    let score = 0;
    if (usaClasses.length > 0) {
      score = round(Math.sqrt(usaClasses.length)) * 5;
    }
    return score;
  }

  async onModuleDestroy() {
    await this.browser.close();
  }
}
