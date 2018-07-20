# QuotesBot (javascript version)

This is a "node-crawling-framework" project to scrape quotes from famous people from http://quotes.toscrape.com/js/.


This project is only meant for educational purposes.


## Extracted data

This project extracts quotes, combined with the respective author names and tags.
The extracted data looks like this sample:

    {
        'author': 'Douglas Adams',
        'text': '“I may not have gone where I intended to go, but I think I ...”',
        'tags': ['life', 'navigation']
    }


## Spiders

This project contains only one spider "spiders/CssSpider.js" 

## Running the spider

You can run the spider using those commands:

    $ yarn install
    $ yarn crawl
