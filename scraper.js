'use strict';
const puppeteer = require('puppeteer');

async function startBrowser() {

  let browser;

  try {

    console.log("Opening the browser... ...");

    browser = await puppeteer.launch({
      headless: false,
      args: ["--disable-setuid-sandbox"],
      // devtools: true,
      // 'ignoreHTTPSErrors': true,
      slowMo: 150,
      defaultViewport: null
    });

  } catch (err) {

    console.error("Could not create a browser instance => : ", err);
  }

  return browser
}

function Query(qo) {
  // query variables
  this.host = qo.host || "www.indeed.com";
  this.query = qo.query || "";
  this.city = qo.city || "";
  this.radius = qo.radius || "25";
  this.level = qo.level || "";
  this.maxAge = qo.maxAge || "";
  this.sort = qo.sort || "";
  this.jobType = qo.jobType || "";
  this.excludeSponsored = qo.excludeSponsored || false;
  // internal variables
  this.start = 0;
  this.limit = Number(qo.limit) || 0;
}

Query.prototype.url = function () {
  let q = "https://" + this.host + "/jobs";
  q += "?q=" + this.query;
  q += "&l=" + this.city;
  q += "&radius=" + this.radius;
  q += "&explvl=" + this.level;
  q += "&fromage=" + this.maxAge;
  q += "&sort=" + this.sort;
  q += "&jt=" + this.jobType;
  q += "&start=" + this.start;
  return encodeURI(q);
};

/* Gets all the desired jobs for the city */
Query.prototype.getJobs = function () {
  console.log('Query.prototype.getJobs: ', this.excludeSponsored)
  const excludeSponsored = this.excludeSponsored
  /* Recursive function that gets jobs until it can't anymore (Or shouldn't) */
  async function getSomeJobs(self, jobs,) {
    const parsed = await parseJobList(self.url(), excludeSponsored);
    jobs = jobs.concat(parsed.jobs);
    if (parsed.error !== null) {
      return console.error('Something is not working :(')
    } else if (parsed.continue === true) {
      // If we reach the limit stop looping
      if (self.limit != 0 && jobs.length > self.limit) {
        while (jobs.length != self.limit) jobs.pop();
        return jobs;
      } else {
        // Continue getting more jobs
        self.start += 10;
        getSomeJobs(self, jobs);
      }
    } else {
      // We got all the jobs so stop looping
      return jobs;
    }
  }
  getSomeJobs(this, []);
};

async function parseJobList(url, excludeSponsored) {

  console.log('eS inside parsejob fn: ', excludeSponsored);
  const browser = await startBrowser();

  const page = await browser.newPage();

  await page.goto(url);

  await page.waitForSelector('.jobsearch-ResultsList', { state: 'attached' })
  // const scrapedData = [];

  const jobObjects = await page.evaluate((excludeSponsored) => {

    console.log('eS inside page eval: ', excludeSponsored);
    const jobTable = document.querySelector('.jobsearch-ResultsList');
    const jobs = jobTable.querySelectorAll('.result') === 0 ? 'no elements found' :
      this.excludeSponsored ?
        jobTable.querySelectorAll('.result:not(.sponsoredJob)') :
        jobTable.querySelectorAll('.result');

    return [...jobs]
      .map((job) => {
        const jobTitle = !job.querySelector('h2') ? 'no jobTitle' :
          job.querySelector('h2')
            .textContent
            .trim()

        console.log('jobTitle: ', jobTitle);

        const summary = !job.querySelector('.job-snippet') ? 'no summary' :
          job.querySelector('.job-snippet')
            .textContent
            .trim();

        console.log('summary: ', summary);

        const url = !job.querySelector('h2 > a') ? 'no url' :
          job.querySelector('h2 > a').href;

        console.log('url: ', url);

        const company = !job.querySelector('.companyName') ? 'no companyName' :
          job.querySelector('.companyName')
            .textContent
            .trim();

        console.log('company: ', company);

        const location = !job.querySelector('.companyLocation') ? 'no location' :
          job.querySelector('.companyLocation')
            .textContent
            .trim();

        console.log('location: ', location);

        const postDate = !job.querySelector('.date') ? 'no postDate' :
          job.querySelector('.date')
            .textContent
            .trim();

        console.log('postDate: ', postDate);

        const salary = !job.querySelector('.salary-snippet-container') ? 'no salary' :
          job.querySelector('.salary-snippet-container')
            .textContent
            .trim();

        console.log('salary: ', salary);

        const isEasyApply = !job.querySelector('.ialbl') ? 'no easyApply' :
          job.querySelector('.ialbl')
            .textContent
            .trim() === "Easily apply";

        console.log('isEasyApply: ', isEasyApply);

        return {
          title: jobTitle,
          summary: summary,
          url: url,
          company: company,
          location: location,
          postDate: postDate,
          salary: salary,
          isEasyApply: isEasyApply
        };
      })
  }, excludeSponsored)

  const cont = await page.evaluate(() => {
    const list = document.querySelector('nav[aria-label="pagination"]');

    if (!list.childNodes.length) {
      // No paging of results
      return false;
    } else {
      // Indeed returns two different types of html
      // In one the links are nested inside of a ul, on the other they are just
      // a list, not nested in anything
      // I believe the nested one is SSRed, and the other one is hydrated?  Aria stuff
      // is not set for flat, and it doesn't use semantic tags.
      const type = list.childElementCount > 1 ? "flat" : "nested";
      const buttons =
        type === "flat"
          ? list.childNodes
          : list
            .firstChild // returns the node's first child
            .childNodes

      // We determine if this is the last page by checking if the last button is a number
      const isLastPage = buttons[buttons.length - 1].textContent * 1 != 0;
      if (isLastPage) {
        // We have seen all the results
        return false;
      }
    }
  })

  return {
    error: null,
    continue: cont,
    jobs: jobObjects
  };
}

module.exports.query = function (queryObject) {
  const q = new Query(queryObject);
  return q.getJobs();
};
