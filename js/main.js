'use strict';

let movieCaller;
let movieSearchDiv;
let searchForm;
let searchResultsDiv;
let errorSearchFormDiv;
let errorSearchFormMessage;
let movieDetailsDiv;
let backButton;

window.onload = () => {

    movieCaller = new MoviesAPICaller();
    movieSearchDiv = document.getElementById('moviesSearch');
    searchForm = document.getElementById('searchForm');
    searchResultsDiv = document.getElementById('searchResults');
    errorSearchFormDiv = document.getElementById('errorSearchForm');
    errorSearchFormMessage = document.getElementById('errorSearchFormMessage');
    movieDetailsDiv = document.getElementById('movieDetails');
    backButton = document.getElementById('backButton');

    parseUrl();

    searchForm.addEventListener('submit', submitSearchForm);

    backButton.addEventListener('click', (e) => {
        Utils.urlChange('movies', 'Movies', 'movies');
        parseUrl();
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
    });

    const latestResults = Utils.getLatestResults();
    if (latestResults) {
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

const parseUrl = () => {
    let url = window.location.hash.substr(1);
    if (url.includes('/movies') || url === '') {
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
        Utils.urlChange('movies', 'Movies', 'movies');

        if (url.includes('?search=') > 0) {
            const keyword = url.substring(url.lastIndexOf('?search=') + 8, url.length);
            if (keyword.length > 2) {
                document.getElementsByName('keyword')[0].value = keyword;
                getMovies(keyword);
            }
        } else {
            const userRatings = Utils.getUserRatings();
            if (userRatings && userRatings.length >= 2) {
                showRecommendations(userRatings);
            }
        }

    } else if ((url.startsWith('/movie/'))) {
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

//Go to movie details
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

const showRecommendations = (userRatings) => {
    const recommendations = findRecommendations(userRatings);
};

const findRecommendations = (currentUserRatings) => {
    if (currentUserRatings) {
        const latestRecommendations = Utils.getLatestRecommendations();
        const movieListRatings = currentUserRatings.map(it => it.mId);
        if (latestRecommendations) {

            if (Utils.arraysEqual(latestRecommendations.movieList, movieListRatings)) {
                return latestRecommendations;
            }
        }

        movieCaller.getRatingsByMovies(movieListRatings, (err, moviesRatings) => {
            if (err) {
                console.error(err);
            } else {
                //GROUP BY ratings by userId
                const moviesRatingsByUser = moviesRatings.reduce(function (groups, item) {
                    let val = item['userId'];
                    groups[val] = groups[val] || [];
                    groups[val].push(item);
                    return groups;
                }, {});

                currentUserRatings = currentUserRatings.map((it) => parseFloat(it.rating));
                Object.keys(moviesRatingsByUser).forEach(function (userId) {
                    if (moviesRatingsByUser[userId] && moviesRatingsByUser[userId].length > 0) {
                        if (moviesRatingsByUser[userId].length >= 2) {
                            console.log('ela re man')
                        }
                        const userRatings = moviesRatingsByUser[userId].map((it) => parseFloat(it.rating));

                        const score = pearsonCorrelation([currentUserRatings, userRatings], 0, 1);

                        console.log(score);
                    }

                });
            }
        });
    }
};

window.onunload = (e) => {
    this.localStorage.removeItem('latestResults')
}