var request            = require('request')
var cheerio            = require('cheerio')
var URL                = require('url-parse')
var u                  = require('underscore')
var strftime           = require('strftime')
var async              = require('async')
var api_key            = 'key-7ad8eebeaea3a30d05ae433e507fbb11'
var domain             = 'sandboxc746da069aca49db8e6b10a583928903.mailgun.org'
var mailgun            = require('mailgun-js')({apiKey: api_key, domain: domain})
var START_URL          = "http://www.bloomberg.com/quote/PETRE46:BZ";
var SEARCH_WORD        = ("previous close").toLowerCase()

module.exports = {
  webCrawlerDaily  : webCrawlerDaily,
  webCrawlerHourly : webCrawlerHourly
}

function webCrawlerDaily () {
  var stocks = require('./myStocks.json')
  webCrawler(stocks)
}

function webCrawlerHourly () {
  var stocks = require('./options.json')
  webCrawler(stocks, true)
}

function webCrawler(stocks, isHourly) {
  console.log('Stock Quotes Update has started!')
  var message = ''

  async.each(Object.keys(stocks), function(stock, cb){
    var url = "http://www.bloomberg.com/quote/" + stock + ":BZ"
    console.log("Visiting page " + url);
    request(url, function(error, response, body) {
      console.log("Status code: " + response.statusCode);
      if(response.statusCode !== 200) {
       cb()
      }
      var buyingPrice   = stocks[stock].p
      var stockQuantity = stocks[stock].q
      var $             = cheerio.load(body);
      var searchResults = searchForWord($, SEARCH_WORD);
      if(searchResults.isWordFound) {
        console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
        var stockParams = searchResults.params
        var priceNow = Number(stockParams.priceNow.split('b')[0])
        if(priceNow < Number(stockParams.open)){
          stockParams.percentageVariation = '-' + stockParams.percentageVariation
          stockParams.priceVariation      = '-' + stockParams.priceVariation
        }
        message += 'Cotação atualizada:' + strftime("%k", new Date()) + 'h\n\n' + JSON.stringify(stockParams, null, 2)
        message += '\n\nBuying Price: R$ ' + buyingPrice + '\nStock Quantity: ' + stockQuantity
        message += '\nStarting Investment Value: R$ ' + (stockQuantity * buyingPrice).toFixed(2)
        message += isHourly ? '\nStarting Investment Value per Person: R$ ' + (stockQuantity * buyingPrice / 3).toFixed(2) : ''
        message += '\nActual Investment Value: R$ ' + (stockQuantity * priceNow).toFixed(2)
        message += isHourly ? '\nActual Investment Value per Person: R$ ' + (stockQuantity * priceNow / 3).toFixed(2) : ''
        message += '\nInvestment Return: ' + (100 * priceNow / buyingPrice - 100).toFixed(3) + '%'
        message += '\n\n----------------------------------\n\n'
        cb()
      }
    })
  }, function(){
    var data = {
     from: 'Default User <postmaster@sandboxc746da069aca49db8e6b10a583928903.mailgun.org>',
     to: ['guilherme.bertero@gmail.com'],
     subject: 'Atualização Cotação PETRE46 - ' + strftime("%Y-%m-%d", new Date()),
     text: message
    }
    // console.log(message)
    mailgun.messages().send(data, function (error, body) {
    if(error){
      console.log(error)
      console.log(body)
    }
    else console.log('Message ' + body.message)
    });
  })
}

function searchForWord($, word) {
  var bodyText       = $('html > body').text().toLowerCase();
  var wordStartIndex = bodyText.indexOf(word.toLowerCase())
  var brlIndex       = bodyText.indexOf('brl'.toLowerCase())
  var resultString   = (bodyText.substring(wordStartIndex - 500, wordStartIndex + 100)).replace(/(\r\n|\n\n|\r|)/gm, ',')
  resultString = resultString.replace(/ /g, '')
  resultString = resultString.replace(/,/g, '')
  resultsArray = u.compact(resultString.split('\n'))
  var stockParams = {
    priceNow : resultsArray[0],
    priceVariation : Number(resultsArray[1]),
    percentageVariation : resultsArray[2]
  }
  for(var index = 3; index < resultsArray.length; index += 2){
    if(resultsArray[index].indexOf('asof4') < 0){
      stockParams[resultsArray[index]] = resultsArray[index + 1]
    }
    else index -= 1
  }
  // resultString = resultString.substring(brlIndex - 3, resultString.length)
  // console.log(stockParams)
  // console.log(bodyText)

  return {isWordFound : (bodyText.indexOf(word.toLowerCase()) !== -1), params : stockParams}
}

// function collectInternalLinks($) {
//     var relativeLinks = $("a[href^='/']");
//     console.log("Found " + relativeLinks.length + " relative links on page");
//     relativeLinks.each(function() {
//         pagesToVisit.push(baseUrl + $(this).attr('href'));
//     });
// }