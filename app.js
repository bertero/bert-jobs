var cronFunctions       = require('./job')
var webCrawlerFunctions = require('./webCrawler')

console.log('Bert Jobs initialized!')

cronFunctions.jobH('0 30 10-18 * * *', webCrawlerFunctions.webCrawlerHourly)
cronFunctions.jobH('0 30 19    * * *', webCrawlerFunctions.webCrawlerDaily)
// webCrawlerFunctions.webCrawlerDaily()