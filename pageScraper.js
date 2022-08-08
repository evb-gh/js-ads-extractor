const scraperObject = {

    url: 'https://www.indeed.com/jobs?q=teacher&l=Nevada&fromage=14',

    async scraper(browser) {

        let page = await browser.newPage();

        console.log(`Navigating to ${this.url}...`);

        // Navigate to the selected page
        await page.goto(this.url);

        // Wait for the required DOM to be rendered
        await page.waitForSelector('.mosaic-zone');

        // Get the link to all the required books
        let urls = await page.evaluate(() => {

            try {

                return [...document.querySelectorAll('h2 > a')].map(elem => elem.href)

            } catch (e) {

                console.error(e);

            }
        });

        // Loop through each of those links, open a new page instance and get the relevant data from them
        let pagePromise = (link) => new Promise(async (resolve, reject) => {

            let dataObj = {};
            let newPage = await browser.newPage();

            await newPage.goto(link);

            dataObj['jobTitle'] = await newPage.$eval('h1.jobsearch-JobInfoHeader-title', text => text.textContent);

            // div.jobsearch-CompanyInfoContainer > div > div > div > div:nth-child(2)
            dataObj['jobLocation'] = await newPage.$eval('div.jobsearch-CompanyInfoContainer > div > div > div > div:nth-child(2)', text => text.innerText);
            // dataObj['jobLocation'] = await newPage.$eval('#mosaic-data', text => text.textContent.match(/(?<=(?:\"|\')(?<key>fullLocation)(?:\"|\')(?:\:\s*))(?:\"|\')?(?<value>[\w\s,-]*)(?:\"|\')?/)[0]);

            //document.querySelector('div.jobsearch-CompanyInfoContainer a').innerHTML
            dataObj['companyName'] = await newPage.$eval('div.jobsearch-CompanyInfoContainer a', text => text.innerText);
            // dataObj['companyName'] = await newPage.$eval('#mosaic-data', text => text.textContent.match(/(?<=(?:\"|\')(?<key>companyName)(?:\"|\')(?:\:\s*))(?:\"|\')?(?<value>[\w\s,-]*)(?:\"|\')?/)[0]);

            let jobKey = await newPage.$eval('script#mosaic-data', text => text.textContent.match(/(?<="jobKey":")[\w\d]*/)[0]);
            dataObj['jobUrl'] = `https://www.indeed.com/viewjob?jk=${jobKey}`
            dataObj['jobID'] = jobKey

            resolve(dataObj);

            await newPage.close();
        });

        for (link in urls) {

            let currentPageData = await pagePromise(urls[link]);

            // scrapedData.push(currentPageData);
            console.log(currentPageData);
        }

        // console.log(urls, typeof (urls));
    }
}

module.exports = scraperObject;
