const scraperObject = {

    url: 'https://www.indeed.com/jobs?q=teacher&l=Nevada',

    async scraper(browser) {

        let page = await browser.newPage();
        let scrapedData = [];

        console.log(`Navigating to ${this.url}...`);

        await page.goto(this.url);
        await page.waitForSelector('.mosaic-zone');

        // Get the link to all the required books
        let urls = await page.evaluate(() => {

            try {
                return [...document.querySelectorAll('h2 > a')].map(elem => elem.href)
            } catch (e) {
                console.error(e);
            }
        });

        let pagePromise = (link) => new Promise(async (resolve, reject) => {

            let dataObj = {};
            let newPage = await browser.newPage();

            const jobTitleSelector = 'h1.jobsearch-JobInfoHeader-title'
            const jobLocationSelector = 'div.jobsearch-CompanyInfoContainer > div > div > div > div:nth-child(2)'
            // const companyNameSelector = 'div.jobsearch-CompanyInfoContainer a'
            const companyNameSelector = 'div.jobsearch-CompanyInfoContainer > div > div > div > div.jobsearch-InlineCompanyRating > div:nth-child(2) > div'

            await newPage.goto(link);

            dataObj['jobTitle'] = await newPage.$eval(jobTitleSelector, text => text.textContent);
            dataObj['jobLocation'] = await newPage.$eval(jobLocationSelector, text => text.innerText);
            dataObj['companyName'] = await newPage.$eval(companyNameSelector, text => text.innerText);

            let jobKey = await newPage.$eval('script#mosaic-data', text => text.textContent.match(/(?<="jobKey":")[\w\d]*/)[0]);
            dataObj['jobUrl'] = `https://www.indeed.com/viewjob?jk=${jobKey}`
            dataObj['jobID'] = jobKey

            resolve(dataObj);

            await newPage.close();
        });

        for (link in urls) {

            let currentPageData = await pagePromise(urls[link]);

            scrapedData.push(currentPageData);
            // console.log(currentPageData);
        }

        let nextButtonExist = false;

        try {
            const nextButton = await page.$eval('ul.pagination-list > a', a => a.textContent);
            nextButtonExist = true;
        }
        catch (err) {
            nextButtonExist = false;
        }

        if (nextButtonExist) {
            await page.click('.next > a');
            return scrapeCurrentPage(); // Call this function recursively
        }

        // await page.close();

        return scrapedData;
    }
    // console.log(urls, typeof (urls));
}

module.exports = scraperObject;
