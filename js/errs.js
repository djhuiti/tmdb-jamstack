class NetworkError extends Error {
  constructor(msg, response) {
    super(msg);
    this.name = "NetworkError";
    this.response = response;
    this.status = response.status;
    this.text = response.statusText;
  }
}

class InvalidMediaError extends Error {
  constructor() {
    let msg = `The URL contains an invalid media type. The media has to be either 'movie' or 'tv'.`;
    super(msg);
    this.name = "InvalidMediaError";
    this.message = msg;
  }
}

class EmptySearchResultsError extends Error {
  constructor(type, keyword) {
    let msg = "No results found. Try another search!";
    super(msg);
    this.name = "EmptySearchResultsError";
    this.message = msg;
    this.type = type;
    this.keyword = keyword;
  }
}

class EmptyCreditsError extends Error {
  constructor(type) {
    let media;
    if (type == 'movie') {
        media = type;
    } else {
        media = 'tv show';
    }
    let msg = `There are no credits listed for this ${media}. Try another search!`;
    super(msg);
    this.name = "EmptySearchResultsError";
    this.message = msg;
    this.type = type;
  }
}

class InvalidCreditURLError extends Error {
    constructor() {
        let msg = `The URL is invalid. You will be redirected to the homepage in 5 seconds.`;
        super(msg);
        this.name = "InvalidCreditURLError";
        this.message = msg;
      }
  }

class BlankSearchError extends Error {
    constructor() {
        let msg = `The search field was left blank. Enter a search term and try again.`;
        super(msg);
        this.name = "BlankSearchError";
        this.message = msg;
      }
  }

export { NetworkError, InvalidMediaError, EmptySearchResultsError, EmptyCreditsError, InvalidCreditURLError, BlankSearchError };
