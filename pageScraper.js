const scraperObject = {

    url: 'https://www.indeed.com/jobs?q=(qa or qa engineer or sdet)&l=Texas',
    page: 0,

    async scraper(browser) {

        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);

        await page.waitForSelector('.jobsearch-ResultsList', { state: 'attached' })
        const scrapedData = [];

        const test = await page.evaluate(() => {

            const jobTable = document.querySelector('.jobsearch-ResultsList');
            const bla = jobTable.querySelectorAll('.result')
            const results = [...bla];

            return results
                .map((job) => {
                    const jobtitle = job
                        .querySelector('h2')
                        .textContent
                        .trim();

                    const summary = job
                        .querySelector('.job-snippet')
                        .textContent
                        .trim();

                    const url = job
                        .querySelector('h2 > a')
                        .href;

                    const company = job
                        .querySelector('.companyName')
                        .textContent
                        .trim();

                    const location = job
                        .querySelector('.companyLocation')
                        .textContent
                        .trim();

                    const postDate = job
                        .querySelector('.date')
                        .textContent
                        .trim();

                    const salary = job
                        .querySelector('.date')
                        .textContent
                        .trim();

                    const isEasyApply = job
                        .querySelector('.ialbl')
                        .textContent
                        .trim() === "Easily apply";

                    return {
                        title: jobtitle,
                        summary: summary,
                        url: url,
                        company: company,
                        location: location,
                        postDate: postDate,
                        salary: salary,
                        isEasyApply: isEasyApply
                    };
                })

        })

        console.log(test[0].title);

        async function scrapeCurrentPage() {

            await page.waitForSelector('.jcs-JobTitle');

            // Get the link to all job posts
            let urls = await page.evaluate(() => {

                const jobs = document.querySelectorAll('.jcs-JobTitle');

                return [...jobs].map(elem => elem.href);
            });

            for (link in urls) {

                let currentPageData = await pagePromise(urls[link]);

                scrapedData.push(currentPageData);
                // console.log(currentPageData);
            }

            let pagePromise = (link) => new Promise(async (resolve, reject) => {
                let newPage = await browser.newPage();
                await newPage.goto(link);

                const jobTitleSelector = '.jcs-JobTitle';
                const jobLocationSelector = 'div.jobsearch-CompanyInfoContainer > div > div > div > div:nth-child(2)';
                const companyNameSelector = 'div.jobsearch-CompanyInfoContainer > div > div > div > div.jobsearch-InlineCompanyRating > div:nth-child(2) > div';

                let dataObj = {};
                dataObj['jobTitle'] = await newPage.$eval(jobTitleSelector, text => text.textContent);
                dataObj['jobLocation'] = await newPage.$eval(jobLocationSelector, text => text.innerText);
                dataObj['companyName'] = await newPage.$eval(companyNameSelector, text => text.innerText);

                let jobKey = await newPage.$eval('script#mosaic-data', text => text.textContent.match(/(?<="jobKey":")[\w\d]*/)[0]);
                dataObj['jobUrl'] = `https://www.indeed.com/viewjob?jk=${jobKey}`;
                dataObj['jobID'] = jobKey;

                resolve(dataObj);

                console.log(dataObj);

                await newPage.close();
            });

            // const paginationSelector = 'ul.pagination-list > li'
            await page.waitForSelector('nav[aria-label="pagination"]');

            const exists = await page.$eval('ul.pagination-list', () => true).catch(() => false)

            console.log(exists);

            let nextPageExists;

            if (exists) {
                nextPageExists = (await page.$$eval('ul.pagination-list > li', list => list[list.length - 1].textContent)) == '';
            } else {
                nextPageExists = (await page.$$eval('nav[aria-label="pagination"] > div', list => list[list.length - 1].textContent)) == '';
            }

            console.log(nextPageExists)

            let scanNumber = 3;

            //  if (nextPageExists && scanNumber != 0) {
            //      scraperObject.page += 10
            //      console.log(scraperObject.page)
            //      console.log(`${scraperObject.url}&start=${scraperObject.page}`)
            //      let pageUrl = `${scraperObject.url}&start=${scraperObject.page}`;
            //      await page.goto(pageUrl);

            //      scanNumber -= 1;
            //      return scrapeCurrentPage(); // Call this function recursively

            //  }

            await page.close();

            return scrapedData;
        }

        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
    // console.log(urls, typeof (urls));
}

module.exports = scraperObject;
