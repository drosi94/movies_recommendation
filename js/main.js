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

    searchForm.addEventListener('submit', (e) => {
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

        // Search movies by keyword
        movieCaller.getMoviesByKeyword(keyword, (err, movies) => {
            if (err) {
                // If error occur
                Utils.showElement(errorSearchFormDiv);
                Utils.hideElement(searchResultsDiv);
                errorSearchFormMessage.appendChild(document.createTextNode(err));
            } else {
                Utils.hideElement(errorSearchFormDiv);
                showMovies(searchResultsDiv, movies);
                let movieTitles = document.getElementsByClassName('movie-title');
                for (let i = 0; i <= movieTitles.length - 1; i++) {
                    movieTitles[i].addEventListener('click', onClickMovie, false);
                }
            }
        });
    });


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

    backButton.addEventListener('click', (e) => {
        Utils.urlChange('movies', 'Movies', 'movies');
        parseUrl();
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
    });
};

const parseUrl = () => {
    let url = window.location.hash.substr(1);
    if (url === '/movies' || url === '') {
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
        Utils.urlChange('movies', 'Movies', 'movies');

        const userRatings = Utils.getUserRatings();
        if (userRatings && userRatings.length >= 2) {
            showRecommendations(userRatings);
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
}

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
               const moviesRatingsByUser = moviesRatings.reduce(function(groups, item) {
                   let val = item['userId'];
                   groups[val] = groups[val] || [];
                   groups[val].push(item);
                   return groups;
               }, {});

               Object.keys(moviesRatingsByUser).forEach(function(userId){
                   console.log(userId);
                   currentUserRatings = currentUserRatings.map(it => it.rating);
                   const userRatings = moviesRatingsByUser[userId].map(it => it.rating);

                   const score = pearsonCorrelation({
                       currentUserRatings: currentUserRatings,
                       userRatings: userRatings
                   }, 'currentUserRatings', 'userRatings');

                   console.log(score);
               });
           }
        });
    }
};