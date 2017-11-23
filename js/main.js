'use strict';

let movieCaller;
let movieSearchDiv;
let searchForm;
let searchResultsDiv;
let errorSearchFormDiv;
let errorSearchFormMessage;
let movieDetailsDiv;
let backButton;

let recommendationWorker;


const onLoad = () => {

    movieCaller = new MoviesAPICaller();
    if(!recommendationWorker) {
        recommendationWorker = new Worker('/movies_recommendation/js/worker/recommendation_worker.js');
    }

    initializeViewElements();
    parseUrl();

    searchForm.addEventListener('submit', submitSearchForm);
    backButton.addEventListener('click', onBackClick);

    const latestResults = Utils.getLatestResults();
    // Cache previous results, to prevent API Call
    if (latestResults) {
        Utils.urlChange('movies', 'Movies', 'movies?search=' + latestResults.keyword);
        document.getElementsByName('keyword')[0].value = latestResults.keyword;
        showMovies(searchResultsDiv, latestResults.movies);
    }
};

const submitSearchForm = (e) => {
    e.preventDefault();
    Utils.removeAllChildsFromElement(errorSearchFormMessage);

    const keyword = document.getElementsByName('keyword')[0].value;
    if (!keyword || keyword.length <= 2) {
        Utils.showElement(errorSearchFormDiv);
        Utils.hideElement(searchResultsDiv);
        errorSearchFormMessage.appendChild(document.createTextNode('Keyword should be three or more characters'));
        return false;
    } else {
        Utils.hideElement(errorSearchFormDiv);
    }

    getMovies(keyword)
};

// Get movies by keyword and show the result
const getMovies = (keyword) => {
    Utils.urlChange('movies', 'Movies', 'movies?search=' + keyword);
    // Search movies by keyword
    movieCaller.getMoviesByKeyword(keyword, (err, movies) => {
        if (err) {
            // If error occur
            Utils.showElement(errorSearchFormDiv);
            Utils.hideElement(searchResultsDiv);
            errorSearchFormMessage.appendChild(document.createTextNode(err));
        } else {
            Utils.hideElement(errorSearchFormDiv);
            Utils.setLatestResults(keyword, movies);
            showMovies(searchResultsDiv, movies);
        }
    });
};

// Show movies in parentElement
const showMovies = (parentElement, movies) => {
    Utils.removeAllChildsFromElement(parentElement);
    Utils.showElement(parentElement);

    let length = movies.length;
    if (length > 20) {
        length = 20; // Limit results
    }

    for (let i = 0; i <= length - 1; i++) {
        let movieDiv = document.createElement('div');
        movieDiv.id = `movie-${movies[i]['movieId']}`;
        movieDiv.className += 'movie spacing';

        let movieTitleSpan = document.createElement('span');
        movieTitleSpan.appendChild(document.createTextNode(movies[i]['title']));
        movieTitleSpan.className += 'movie-title';
        movieTitleSpan.setAttribute('movie-id', movies[i]['movieId']);
        movieTitleSpan.addEventListener('click', onClickMovie, false);
        movieDiv.appendChild(movieTitleSpan);

        let genreSpan = document.createElement('span');
        genreSpan.appendChild(document.createTextNode(movies[i]['genres']));
        movieDiv.appendChild(genreSpan);

        let hr = document.createElement('hr');

        parentElement.appendChild(movieDiv);

        if (i !== length - 1) {
            parentElement.appendChild(hr);
        }
    }
};

//Go to movie details when click on a movie title
const onClickMovie = (e) => {
    movieCaller.getMovieById(e.target.getAttribute('movie-id'), (err, movie) => {
        if (err) {
            alert('Error');
        } else {
            Utils.hideElement(movieSearchDiv);
            Utils.showElement(movieDetailsDiv);
            showMovieDetails(movie[0]);
        }
    });
};

const showMovieDetails = (movie) => {
    Utils.urlChange('movieDetails', 'Movie Details', `movie/${movie['movieId']}`);

    const title = document.getElementById('title');
    Utils.removeAllChildsFromElement(title);
    title.appendChild(document.createTextNode(movie['title']));
    const genres = document.getElementById('genres');
    Utils.removeAllChildsFromElement(genres);
    genres.appendChild(document.createTextNode(movie['genres']));
    const movieIdInput = document.getElementById('mId');
    movieIdInput.value = movie['movieId'];

    showMovieUserRating(movie['movieId']);

    const starRatings = document.getElementsByName('rating');
    for (let i = 0; i <= starRatings.length - 1; i++) {
        starRatings[i].addEventListener('click', submitRating, false);
        starRatings[i].addEventListener('mouseout', unFillStars, false);
        starRatings[i].addEventListener('mouseover', fillStars, false);
    }
};

const showRecommendations = (parentElement, userRatings) => {
    Utils.removeAllChildsFromElement(parentElement);
    findRecommendations(userRatings, (recommendations) => {
        console.log(recommendations);
        const moviesDiv = document.createElement('div');
        recommendations.forEach(rec => {
            const titleSpan = document.createElement('span');
            titleSpan.className += 'movie-title';
            titleSpan.appendChild(document.createTextNode(rec.title));
            titleSpan.setAttribute('movie-id', rec.mId);
            titleSpan.addEventListener('click', onClickMovie, false);
            moviesDiv.appendChild(titleSpan);
        });

        parentElement.appendChild(moviesDiv);

    });
};

const findRecommendations = (currentUserRatings, cb) => {
    if (currentUserRatings) {
        const latestRecommendations = Utils.getLatestRecommendations();
        const movieListRatings = currentUserRatings.map(it => it.mId);

        // If latestRecommendations object is already defined and current user rating are not changed, return the saved object
        if (latestRecommendations && Utils.arraysEqual(latestRecommendations.movieList, movieListRatings)) {
            return cb(latestRecommendations.recommendations);
        }

        recommendationWorker.postMessage(JSON.stringify({
            movieListRatings: movieListRatings,
            currentUserRatings: currentUserRatings
        }));
        recommendationWorker.onmessage = (e) => {
            Utils.setLatestRecommendations(movieListRatings, e.data);
            return cb(e.data);
        }
    }

};


const initializeViewElements = () => {
    movieSearchDiv = document.getElementById('moviesSearch');
    searchForm = document.getElementById('searchForm');
    searchResultsDiv = document.getElementById('searchResults');
    errorSearchFormDiv = document.getElementById('errorSearchForm');
    errorSearchFormMessage = document.getElementById('errorSearchFormMessage');
    movieDetailsDiv = document.getElementById('movieDetails');
    backButton = document.getElementById('backButton');
};

const onBackClick = (e) => {
    Utils.urlChange('movies', 'Movies', 'movies');
    parseUrl();
    Utils.showElement(movieSearchDiv);
    Utils.hideElement(movieDetailsDiv);
};


const parseUrl = () => {
    let url = window.location.hash.substr(1);
    if (url.includes('/movies') || url === '') {
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
        Utils.urlChange('movies', 'Movies', 'movies');
        const userRatings = Utils.getUserRatings();
        // If user has rated at least 3 movies, show recommendations
        if (userRatings && userRatings.length > 3) {
            showRecommendations(document.getElementById('recommendedMovies'), userRatings);
        }

        if (url.includes('?search=') > 0) {
            const keyword = url.substring(url.lastIndexOf('?search=') + 8, url.length);
            if (keyword.length > 2) {
                document.getElementsByName('keyword')[0].value = keyword;
                getMovies(keyword);
            }
        }

    } else if (url.startsWith('/movie/')) {
        Utils.hideElement(movieSearchDiv);
        Utils.showElement(movieDetailsDiv);
        movieCaller.getMovieById(url.substring(url.lastIndexOf('/') + 1, url.length), (err, movie) => {
            if (err) {
                alert('Error');
            } else {
                showMovieDetails(movie[0]);
            }
        });
    }
};

window.onload = onLoad;
