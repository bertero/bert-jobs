var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var u = require('underscore')

var START_URL = "http://www.bloomberg.com/quote/PETRE46:BZ";
// var SEARCH_WORD = ("before it's here, it's on the bloomberg terminal").toLowerCase()
var SEARCH_WORD = ("previous close").toLowerCase()
var MAX_PAGES_TO_VISIT = 10;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(START_URL);
crawl();

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
     } else {
       // collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  var wordStartIndex = bodyText.indexOf(word.toLowerCase())
  var brlIndex = bodyText.indexOf('brl'.toLowerCase())
  var resultString = (bodyText.substring(wordStartIndex - 500, wordStartIndex + 100)).replace(/(\r\n|\n\n|\r|)/gm, ',')
  resultString = resultString.replace(/ /g, '')
  resultString = resultString.replace(/,/g, '')
  resultsArray = u.compact(resultString.split('\n'))
  var stockParams = {
    priceNow : resultsArray[0],
    priceVariation : resultString[1],
    percentageVariation : resultString[2]
  }
  for(var index = 3; index < resultsArray.length; index += 2){
    stockParams[resultsArray[index]] = resultsArray[index + 1]
  }
  // resultString = resultString.substring(brlIndex - 3, resultString.length)
  console.log(stockParams)
  // console.log(bodyText)

  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}