import { Logger } from 'pino';
import { Page, HTTPResponse } from 'puppeteer';

import { CoreInputDto } from '@app/core-scanner/core.input.dto';
import { getHttpsUrl, getMIMEType } from './helpers';

export const createSitemapXmlScanner = (
  logger: Logger,
  input: CoreInputDto,
) => {
  const url = getHttpsUrl(input.url);
  return async (sitemapPage: Page) => {
    // go to the sitemap page from the targeet url
    const sitemapUrl = new URL(url);
    sitemapUrl.pathname = 'sitemap.xml';
    logger.info('Going to sitemap.xml...');
    const sitemapResponse = await sitemapPage.goto(sitemapUrl.toString());
    logger.info('Got sitemap.xml!');
    // extract the html page source
    const sitemapText = await sitemapResponse.text();
    logger.info('Got sitemap.xml text!');

    return buildSitemapResult(sitemapResponse, sitemapText, sitemapPage);
  };
};

const buildSitemapResult = async (
  sitemapResponse: HTTPResponse,
  sitemapText: string,
  sitemapPage: Page,
) => {
  const sitemapUrl = new URL(sitemapResponse.url());
  const sitemapStatus = sitemapResponse.status();
  const sitemapLive = sitemapStatus / 100 === 2;

  const sitemapXmlDetected =
    sitemapUrl.pathname === '/sitemap.xml' && sitemapLive;

  return {
    sitemapXmlFinalUrl: sitemapUrl.toString(),
    sitemapXmlFinalUrlLive: sitemapLive,
    sitemapTargetUrlRedirects:
      sitemapResponse.request().redirectChain().length > 0,
    sitemapXmlFinalUrlMimeType: getMIMEType(sitemapResponse),
    sitemapXmlStatusCode: sitemapStatus,

    sitemapXmlDetected,
    ...(sitemapXmlDetected
      ? {
          sitemapXmlFinalUrlFilesize: Buffer.byteLength(sitemapText, 'utf-8'),
          sitemapXmlCount: await getUrlCount(sitemapPage),
          sitemapXmlPdfCount: getPdfCount(sitemapText),
        }
      : {}),
  };
};

const getUrlCount = async (page: Page) => {
  const urlCount = await page.evaluate(() => {
    const urls = [...document.getElementsByTagName('url')];
    return urls.length;
  });

  return urlCount;
};

const getPdfCount = (sitemapText: string) => {
  const re = /\.pdf/g;
  const occurrenceCount = [...sitemapText.matchAll(re)].length;
  return occurrenceCount;
};
