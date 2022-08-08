
// Loop through each of those links, open a new page instance and get the relevant data from them
let pagePromise = (link) => new Promise(async (resolve, reject) => {
  let dataObj = {};
  let newPage = await browser.newPage();
  await newPage.goto(link);
  dataObj['bookTitle'] = await newPage.$eval('.product_main > h1', text => text.textContent);
  dataObj['bookPrice'] = await newPage.$eval('.price_color', text => text.textContent);
  dataObj['noAvailable'] = await newPage.$eval('.instock.availability', text => {
    // Strip new line and tab spaces
    text = text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "");
    // Get the number of stock available
    let regexp = /^.*\((.*)\).*$/i;
    let stockAvailable = regexp.exec(text)[1].split(' ')[0];
    return stockAvailable;
  });
  dataObj['imageUrl'] = await newPage.$eval('#product_gallery img', img => img.src);
  dataObj['bookDescription'] = await newPage.$eval('#product_description', div => div.nextSibling.nextSibling.textContent);
  dataObj['upc'] = await newPage.$eval('.table.table-striped > tbody > tr > td', table => table.textContent);
  resolve(dataObj);
  await newPage.close();

  for (link in urls) {
    let currentPageData = await pagePromise(urls[link]);
    // scrapedData.push(currentPageData);
    console.log(currentPageData);
  }


      // let urls = await page.$$eval('div[class*="jobcards"] > ul > li', links => {
      //   //console.log(Array.isArray(links))
      //   // Make sure the book to be scraped is in stock
      //   //links = links.filter(link => link.querySelector('h2').textContent !== "Teacher")
      //   // Extract the links from the data
      //   //links = links.map(el => el.querySelector('h2 > a').href)
      //   if (Array.isArray(links)) {

      //     //  links = links.filter(link => link.querySelector('h2').innerText !== "Teacher")

      //     return links.map(el => console.log("this is: ", el))

      //   } else {

      //     return "pula"
      //   }

      // });
