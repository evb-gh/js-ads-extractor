const pageScraper = require('./pageScraper');
const savedData = require('./data')
const fs = require('fs');

async function scrapeAll(browserInstance) {

	let browser;

	try {
		browser = await browserInstance;
		let scrapedData = {};

		scrapedData = await pageScraper.scraper(browser);
		await browser.close();

		const newData = savedData.concat(scrapedData)

		const uniqueIds = new Set(); // lets you store unique values of any type

		const uniqueData = newData.filter(element => {

			const isDuplicate = uniqueIds.has(element.jobID);

			uniqueIds.add(element.jobID);

			return !isDuplicate;
		});

		fs.writeFile("data.json", JSON.stringify(uniqueData), 'utf8', function (err) {
			if (err) {
				return console.error(err);
			}
			console.log("The data has been scraped and saved successfully! View it at './data.json'");
		});

	}
	catch (err) {

		console.error("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)
