// const pageScraper = require('./pageScraper');
const pageScraper = require('./scraper');
const savedData = require('./data')
const fs = require('fs');

const queryOptions = {
	host: 'www.indeed.com',
	query: 'Software',
	city: 'Seattle, WA',
	radius: '25',
	level: 'entry_level',
	jobType: 'fulltime',
	maxAge: '7',
	sort: 'date',
	limit: 100
};

async function scrapeAll(browserInstance) {

	try {
		const browser = await browserInstance;

		const scrapedData = await pageScraper.query(queryOptions, browser);

		await browser.close();

		const newData = savedData.concat(scrapedData)

		const uniqueIds = new Set(); // stores unique values of any type

		const uniqueData = newData.filter(element => {

			const isDuplicate = uniqueIds.has(element.jobID);

			uniqueIds.add(element.jobID);

			return !isDuplicate;
		});

		fs.writeFile('data.json', JSON.stringify(uniqueData), 'utf8', function (err) {
			if (err) {
				return console.error(err);
			}
			console.log('\nThe data has been scraped and saved successfully! View it at "./data.json"');
		});

	}
	catch (err) {

		console.error("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)
