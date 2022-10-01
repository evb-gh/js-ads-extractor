const scraperObject = {

    url: 'https://www.indeed.com/jobs?q=(qa or qa engineer or sdet)&l=Texas',
    page: 0,

    async scraper(browser) {

        try {

            const page = await browser.newPage();
            console.log(`Navigating to ${this.url}...`);
            await page.goto(this.url);

            await page.waitForSelector('.jobsearch-ResultsList', { state: 'attached' })
            // const scrapedData = [];

            const results = await page.evaluate(() => {

                const jobTable = document.querySelector('.jobsearch-ResultsList');
                const jobs = jobTable.querySelectorAll('.result') === 0 ? 'no elements found' :
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
            })

            const continium = await page.evaluate(() => {
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

            return results;

        } catch (err) {

            console.error(err)
        }
    }
}

module.exports = scraperObject;
