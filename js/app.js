import {
  NetworkError,
  InvalidMediaError,
  EmptySearchResultsError,
  EmptyCreditsError,
  InvalidCreditURLError,
  BlankSearchError
} from "./errs.js";

const APP = {
  lastSearch: '',
  lastMedia: '',
  pageName: location.pathname.split("/")[1].split(".")[0],
  noPush: true,
  init: () => {
    if (location.hash) {
      APP.readURL();
    } else {
      APP.showDefaults();
    }
    console.log(location);
    console.log(APP.pageName);
    console.log(location.hash);

    window.addEventListener("popstate", APP.pop);
    document.querySelector("form").addEventListener("submit", APP.submit);
    document.getElementById("btnSearch").addEventListener("click", APP.click);
  },
  pop: (ev) => {
    APP.noPush = true;
    APP.lastSearch = '';
    APP.lastMedia = '';
    APP.readURL();
  },
  submit: (ev) => {
    
    let type = document.querySelector('input[name="media"]:checked').value;
    let keyword = document.getElementById("key").value;
    ev.preventDefault();

    if (keyword) {
    APP.noPush = false;
    APP.processSearch(type, keyword.trim());
    } else {
      APP.errorHandler(new BlankSearchError());
    }

  },
  click: (ev) => {
    
    let type = document.querySelector('input[name="media"]:checked').value;
    let keyword = document.getElementById("key").value;
    ev.preventDefault();

    if (keyword) {
    APP.noPush = false;
    APP.processSearch(type, keyword.trim());
    } else {
      APP.errorHandler(new BlankSearchError());
    }

  },
  focusSearch: (ev) => {
    document.getElementById("key").focus();
  },
  readURL: () => {
    let hash = location.hash;
    let type;
    let keyword;
    let id;
    let title;

    switch (APP.pageName) {
      case "credits":
        [, type, id, title] = hash.split("/").filter((val) => val);

        //  Scenario 1. Type is movie or tv and we have an ID and title -- process search
        if ((type == "movie" || type == "tv") && id && title) {
          document.getElementById(type).checked = true;
          APP.processCredits(type, id, title);
        }
        // Scenario 2. (Someone manually types in a URL) -- Format is correct but the type is not movie or TV -- throw wrong media error
        else if (type && !(type == "movie" || type == "tv")) {
          APP.errorHandler(new InvalidMediaError());
        }
        // Scenarios 3+ (Someone manually types in a URL) -- Format is correct but the there is no ID or Title
        else {
          APP.errorHandler(new InvalidCreditURLError());
        }
        break;

      default: // index.html
        [, type, keyword] = hash.split("/").filter((val) => val);

        //  Scenario 1. Type is movie or tv and we have a keyword -- process search
        if ((type == "movie" || type == "tv") && keyword) {
          document.getElementById("key").value = keyword;
          document.getElementById(type).checked = true;
          APP.processSearch(type, keyword.trim());
        }

        // Scenario 2. (Someone manually types in a URL) -- Format is correct but there is no keyword - send back to homepage
        else if ((type == "movie" || type == "tv") && !keyword) {
          APP.errorHandler(new InvalidCreditURLError());
        }

        // Scenario 3. (Someone manually types in a URL) -- Format is correct but the type is not movie or TV -- throw wrong media error
        else if (type && !(type == "movie" || type == "tv")) {
          APP.errorHandler(new InvalidMediaError());
        }

        // Scenario 4. (Someone manually types in a URL with a hash) -- Format is correct but there is no type - this is index.html
        else if (!type) {
          APP.showDefaults();
        }
    }
  },
  showDefaults: () => {
    let h2Container = document.querySelector(".h2-container");
    h2Container.classList.remove('error');

    let h2 = document.querySelector("h2");
    h2.innerHTML = "Welcome to the Movie Database JAMStack Web App";

    let message = document.querySelector(".grid-p");
    message.classList.remove('error');
    message.innerHTML = `<span class="grid-p-search">Search</span> for a movie or TV show above!`;
    
    document.querySelector(".grid-p-search").addEventListener("click", APP.focusSearch);

    let resultArea = document.querySelector(".results");
    resultArea.innerHTML = "";

    document.getElementById("key").value = "";
  },
  processSearch: (type, keyword) => {

    // If search is clicked on credits page, then redirect to index.html
    if (APP.pageName == "credits") {
      window.location = `/#/${type}/${keyword}`;
    }

    let h2 = document.querySelector("h2");
    let h2Container = document.querySelector('.h2-container');
    let resultArea = document.querySelector(".results");
    let message = document.querySelector(".grid-p");
    
    // Only search if the keyword or the media type is different from the current result query
    if (type.toLowerCase() != APP.lastMedia.toLowerCase() || keyword.toLowerCase() != APP.lastSearch.toLowerCase()) {

    APP.fetchMedia(type, keyword)
      .then((results) => {

        let searchResults = results["results"];
        if (searchResults.length == 0) throw new EmptySearchResultsError(type, keyword);

        message.innerHTML = "";

        h2Container.classList.remove("error");
        h2.innerHTML = `<span class="search-type">${APP.capitalize(type)}</span> Search Results for <span class="search-keyword">"${keyword}"</span>`;

        resultArea.innerHTML = searchResults
          .map((result) => {

            const imgBaseURL = `https://image.tmdb.org/t/p/original`;
            const placeholder = `./images/placeholder.png`;

            return `
                    <div class="search-result xs-1">
                      <a href="credits.html#/${type}/${result.id}/${encodeURIComponent(type == 'movie' ? result.title : result.name)}">
                        <img class="cast-member-image" src="${result.poster_path == null ? placeholder : imgBaseURL + result.poster_path}">
                        <div class="card-details">
                          <h3 class="search-result-title">${type == 'movie' ? result.title : result.name}</h3>
                          <p class="search-result-overview">${result.overview}</p>
                          <span class="search-result-average">${result.vote_average} / 10 (${result.vote_count} votes)</span>
                        </div>
                      </a>
                    </div>`;
          })
          .join("");

          APP.lastMedia = type;
          APP.lastSearch = keyword;

          if (!APP.noPush) {
            history.pushState(null, null, `#/${type}/${encodeURIComponent(keyword)}`);
          }
      })
      .catch(APP.errorHandler);
    } 
  },
  processCredits: (type, id, title) => {

    let h2 = document.querySelector("h2");
    let h2Container = document.querySelector(".h2-container");
    let resultArea = document.querySelector(".results");
    let message = document.querySelector(".grid-p");

    APP.fetchCredits(type, id)
      .then((results) => {

        let cast = results["cast"];
        if (cast.length == 0) throw new EmptyCreditsError(type);

        message.innerHTML = '';

        h2Container.classList.remove("error");
        h2.innerHTML = `<span class="search-type">${APP.capitalize(type)}</span> Credits for <span class="search-keyword">"${decodeURIComponent(title)}"</span>`;

        resultArea.innerHTML = cast
          .map((member) => {

            const imgBaseURL = `https://image.tmdb.org/t/p/original/`;
            const placeholder = `./images/placeholder.png`;

            return `
                    <div class="cast-member xs-1 m-1-3 l-1-4">
                      <img class="cast-member-image" src="${member.profile_path == null ? placeholder : imgBaseURL + member.profile_path}">
                        <h3 class="cast-member-name">${member.name}</h3>
                        <p class ="cast-member-role">${member.character}</p>
                     </div>`;
          })
          .join("");

      })
      .catch(APP.errorHandler);
  },
  fetchMedia: (type, keyword) => {
    const searchURL = `https://api.themoviedb.org/3/search/${type}?api_key=d413093a1bb5ce647b9e64fbd55e60c5&lang=en&query=${keyword}`;

    return fetch(searchURL).then((response) => {
      if (!response.ok) throw new NetworkError('Failed to get response', response);
      return response.json();
    });
  },
  fetchCredits: (type, id) => {
    const searchURL = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=d413093a1bb5ce647b9e64fbd55e60c5`;

    return fetch(searchURL).then((response) => {
      if (!response.ok) throw new NetworkError('Failed to get response', response);
      return response.json();
    });
  },
  errorHandler: (err) => {
    switch (err.name) {
      case "Error":
        APP.showError(err.name + ": " + err.message);
        break;
      case "NetworkError":
        APP.showError(err.status + ": " + err.message);
        break;
        case "BlankSearchError":
        APP.showError(err.message);
        break;
      case "InvalidMediaError":
        APP.showError(err.message);
        break;
      case "EmptySearchResultsError":
        APP.showError(err.message);
        if (!APP.noPush) history.pushState(null, null, `#/${err.type}/${encodeURIComponent(err.keyword)}`);
        break;
        case "EmptyCreditsError":
        APP.showError(err.message);
        break;
        case "InvalidCreditURLError":
        APP.showError(err.message);
        let redirect = () => window.location = '/';
        setTimeout(redirect, 5000);
        break;
      default:
        APP.showError(err.status + ": " + err.message);
    }
  },
  showError: (msg) => {
    let h2 = document.querySelector("h2");
    let h2Container = document.querySelector(".h2-container");
    let message = document.querySelector(".grid-p");
    let resultArea = document.querySelector(".results");

    h2Container.classList.add("error");
    message.classList.add("error");
    h2.innerHTML = "Error";
    message.innerHTML = `<p>${msg}</p>`;
    resultArea.innerHTML = '';
  },
  capitalize: (str) => {
    const lower = str.toLowerCase();
    if (str == "movie") {
      return str.charAt(0).toUpperCase() + lower.slice(1);
    } else {
      return "TV";
    }
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
