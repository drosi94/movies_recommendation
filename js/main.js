'use strict';

let movieCaller;
let movieSearchDiv;
let searchForm;
let searchResultsDiv;
let searchTableResult;
let errorSearchFormDiv;
let errorSearchFormMessage;
let movieDetailsDiv;
let ratingFieldSet;
let myRatingsDiv;
let myRatingsTable;
let showMoviesLink;
let showMyRatingsLink;
let backButton;

let loadingRecommendedMovies;
let recommendedMoviesDiv;
let recommendationDiv;
let recommendationWorker;


const onLoad = () => {

    movieCaller = new MoviesAPICaller();
    if (!recommendationWorker) {
        recommendationWorker = new Worker('./js/worker/recommendation_worker.js');
    }

    initializeViewElements();
    parseUrl({
        target: {
            hash: window.location.hash
        }
    });

    searchForm.addEventListener('submit', submitSearchForm);
    showMoviesLink.forEach((element) => {
        element.addEventListener('click', parseUrl, false);
    });
    showMyRatingsLink.addEventListener('click', parseUrl, false);
    backButton.addEventListener('click', parseUrl, false);
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
        Utils.showElement(searchResultsDiv);
        Utils.hideElement(errorSearchFormDiv);
    }

    getMovies(keyword)
};

// Get movies by keyword and show the result
const getMovies = (keyword) => {
    Utils.urlChange('movies', 'Movies', 'movies?search=' + keyword, showMoviesLink[1]);
    // Search movies by keyword
    movieCaller.getMoviesByKeyword(keyword, (err, movies) => {
        if (err) {
            // If error occur
            Utils.showElement(errorSearchFormDiv);
            Utils.hideElement(searchResultsDiv);
            errorSearchFormMessage.appendChild(document.createTextNode(err));
        } else {
            Utils.showElement(searchResultsDiv);
            Utils.hideElement(errorSearchFormDiv);
            Utils.setLatestResults(keyword, movies);
            showMovies(searchTableResult, movies);
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

    parentElement.innerHTML = `<thead class="blue-grey lighten-4">
                <tr>
                    <th width="5%">#</th>
                    <th width="45%">Title</th>
                    <th width="45%">Genre</th>
                    <th width="5%">Info</th>
                </tr>
                </thead>`

    const tbody = document.createElement('tbody');

    for (let i = 0; i <= length - 1; i++) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const tdTitle = document.createElement('td');
        const tdGenre = document.createElement('td');
        const tdMore = document.createElement('td');

        th.appendChild(document.createTextNode(movies[i]['movieId']));
        th.setAttribute('scope', 'row');


        tdTitle.appendChild(document.createTextNode(movies[i]['title']));
        tdGenre.appendChild(document.createTextNode(movies[i]['genres']));
        tdMore.appendChild(document.createTextNode('Details'));
        tdMore.classList += 'movie-details';
        tdMore.setAttribute('movie-id', movies[i]['movieId']);
        tdMore.addEventListener('click', onClickMovie, false);

        tr.appendChild(th);
        tr.appendChild(tdTitle);
        tr.appendChild(tdGenre);
        tr.appendChild(tdMore);

        tbody.appendChild(tr);
        parentElement.appendChild(tbody);

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
            Utils.hideElement(ratingFieldSet);
            Utils.showElement(ratingFieldSet);
            showMovieDetails(movie[0]);
        }
    });
};

const showMovieDetails = (movie) => {
    Utils.hideElement(myRatingsDiv);
    Utils.urlChange('movieDetails', 'Movie Details', `movie/${movie['movieId']}`, showMoviesLink[1]);

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
    Utils.showElement(recommendationDiv);
    Utils.showElement(parentElement);
    Utils.showElement(loadingRecommendedMovies);
    findRecommendations(userRatings, (recommendations) => {
        console.log(recommendations);
        const moviesDiv = document.createElement('div');
        parentElement.innerHTML = `<thead class="blue-grey lighten-4" style="width: 50%">
                <tr>
                    <th width="5%">#</th>
                    <th width="40%">Title</th>
                    <th width="5%">Action</th>
                </tr>
                </thead>`

        const tbody = document.createElement('tbody');
        recommendations.forEach(rec => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            const tdTitle = document.createElement('td');
            const tdMore = document.createElement('td');

            th.appendChild(document.createTextNode(rec['mId']));
            th.setAttribute('scope', 'row');
            tdTitle.appendChild(document.createTextNode(rec['title']));
            tdMore.appendChild(document.createTextNode('Details'));
            tdMore.classList += 'movie-details';
            tdMore.setAttribute('movie-id', rec['mId']);
            tdMore.addEventListener('click', onClickMovie, false);

            tr.appendChild(th);
            tr.appendChild(tdTitle);
            tr.appendChild(tdMore);

            tbody.appendChild(tr);
            parentElement.appendChild(tbody);
        });
        Utils.hideElement(loadingRecommendedMovies);
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

const showMyRatings = (parentElement) => {
    parentElement.innerHTML = `<thead class="blue-grey lighten-4">
                <tr>
                    <th width="5%">#</th>
                    <th width="70%">Title</th>
                    <th width="20%">Rating</th>
                    <th width="5%">Action</th>
                </tr>
                </thead>`

    const tbody = document.createElement('tbody');

    const myRatingMovies = Utils.getUserRatings();

    if (myRatingMovies) {
        for (let i = 0; i < myRatingMovies.length; i++) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            const tdTitle = document.createElement('td');
            const tdRating = document.createElement('td');
            const tdMore = document.createElement('td');

            th.appendChild(document.createTextNode(myRatingMovies[i]['mId']));
            th.setAttribute('scope', 'row');

            tdTitle.appendChild(document.createTextNode(myRatingMovies[i]['title']));

            for (let j = 0; j < myRatingMovies[i]['rating']; j++) {
                const starImg = document.createElement('img');
                starImg.src = 'img/star_filled.png';
                starImg.className = 'filled-star';

                tdRating.appendChild(starImg);
            }

            const deleteSpan = document.createElement('span');
            deleteSpan.classList += 'clickable';
            const iElement = document.createElement('i');
            iElement.classList += 'fa fa-times';
            iElement.style.pointerEvents = 'none';
            deleteSpan.appendChild(iElement);
            deleteSpan.setAttribute('movie-id', myRatingMovies[i]['mId']);
            deleteSpan.addEventListener('click', onDeleteRating, false);
            tdMore.appendChild(deleteSpan);

            tr.appendChild(th);
            tr.appendChild(tdTitle);
            tr.appendChild(tdRating);
            tr.appendChild(tdMore);

            tbody.appendChild(tr);
            parentElement.appendChild(tbody);
        }
    }
};


const parseUrl = (e) => {
    let url = e.target.hash;
    if (url.includes('/movies') || url === '') {
        const latestResults = Utils.getLatestResults();
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
        Utils.hideElement(myRatingsDiv);
        Utils.urlChange('movies', 'Movies', 'movies', showMoviesLink[1]);
        const userRatings = Utils.getUserRatings();
        // If user has rated at least 3 movies, show recommendations
        if (userRatings && userRatings.length > 3) {
            showRecommendations(recommendedMoviesDiv, userRatings);
        }
        const latestRecommendations = Utils.getLatestRecommendations();
        if (latestRecommendations) {
            Utils.showElement(recommendationDiv)
        }
        if (url.includes('?search=') > 0) {
            const keyword = url.substring(url.lastIndexOf('?search=') + 8, url.length);
            if (keyword.length > 2) {
                document.getElementsByName('keyword')[0].value = keyword;
                getMovies(keyword);
            }
        } else if (latestResults) {
            // Get cached previous results, to prevent API Call
            document.getElementsByName('keyword')[0].value = latestResults.keyword;
            Utils.showElement(searchResultsDiv);
            showMovies(searchTableResult, latestResults.movies);
        }


    } else if (url.includes('/movie/')) {
        Utils.hideElement(movieSearchDiv);
        Utils.hideElement(myRatingsDiv);
        Utils.showElement(movieDetailsDiv);
        movieCaller.getMovieById(url.substring(url.lastIndexOf('/') + 1, url.length), (err, movie) => {
            if (err) {
                console.error('Error');
            } else {
                showMovieDetails(movie[0]);
            }
        });
    } else {
        Utils.hideElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
        Utils.showElement(myRatingsDiv);
        Utils.urlChange('My Ratings', 'My Ratings', '/my-ratings', showMyRatingsLink);
        showMyRatings(myRatingsTable);
    }
};


const initializeViewElements = () => {
    movieSearchDiv = document.getElementById('moviesSearch');
    searchForm = document.getElementById('searchForm');
    searchResultsDiv = document.getElementById('searchResults');
    searchTableResult = document.getElementById('searchTableResult');
    errorSearchFormDiv = document.getElementById('errorSearchForm');
    errorSearchFormMessage = document.getElementById('errorSearchFormMessage');
    movieDetailsDiv = document.getElementById('movieDetails');
    ratingFieldSet = document.getElementById('ratingFieldSet');
    myRatingsDiv = document.getElementById('myRatings');
    myRatingsTable = document.getElementById('myRatingsTable');
    showMoviesLink = document.getElementsByName('showMoviesLink');
    showMyRatingsLink = document.getElementById('showMyRatingsLink');
    recommendedMoviesDiv = document.getElementById('recommendedMovies');
    loadingRecommendedMovies = document.getElementById('loadingRecommendedMovies');
    recommendationDiv = document.getElementById('recommendationDiv');
    backButton = document.getElementById('backButton');
};


window.onload = onLoad;
