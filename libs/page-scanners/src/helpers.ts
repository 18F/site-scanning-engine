import { Response } from 'puppeteer';

export const getMIMEType = (res: Response) => {
  const headers = res.headers();
  if (headers['Content-Type'] || headers['content-type']) {
    const contentType = headers['Content-Type'] || headers['content-type'];
    const mimetype = contentType.split(';')[0];
    return mimetype;
  } else {
    return 'unknown';
  }
};

export const getHttpsUrls = (url: string) => {
  if (!url.startsWith('https://')) {
    return `https://${url.toLowerCase()}`;
  } else {
    return url.toLowerCase();
  }
};
