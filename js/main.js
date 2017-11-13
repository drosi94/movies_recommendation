'use strict';

window.onload = () => {
    const movieCaller = new MoviesAPICaller();

    const movieSearchDiv = document.getElementById('moviesSearch');
    const searchForm = document.getElementById('searchForm');
    const searchResultsDiv = document.getElementById('searchResults');
    const errorSearchFormDiv = document.getElementById('errorSearchForm');
    const errorSearchFormMessage = document.getElementById('errorSearchFormMessage');

    const movieDetailsDiv = document.getElementById('movieDetails');
    const backButton = document.getElementById('backButton');

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
                Utils.showMovies(searchResultsDiv, movies);

                let movieTitles = document.getElementsByClassName('movie-title');
                for (let i = 0; i <= movieTitles.length - 1; i++) {
                    movieTitles[i].addEventListener('click', onClickMovie, false);
                }
            }
        });
    });


    //Movie details
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
        document.title = 'Movies';
        document.getElementById('pageTitle').innerHTML = 'Movies';
        Utils.showElement(movieSearchDiv);
        Utils.hideElement(movieDetailsDiv);
    });
};

const showMovieDetails = (movie) => {
    document.title = 'Movie Details';
    document.getElementById('pageTitle').innerHTML = 'Movie Details';
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

//Rating
const fillStars = (img) => {
    const value = img.getAttribute('value');
    const images = document.getElementsByClassName('unfilled-star');
    for (let i = images.length - 1; i >= 0; i--) {
        if (parseInt(images[i].getAttribute('value')) <= value) {
            images[i].src = 'img/star_filled.png';
            images[i].className = 'filled-star';
        }
    }
};

const unFillStars = (img) => {
    const value = img.getAttribute('value');
    const images = document.getElementsByClassName('filled-star');
    for (let i = images.length - 1; i >= 0; i--) {
        if (parseInt(images[i].getAttribute('value')) <= value) {
            images[i].src = 'img/star_not_filled.png';
            images[i].className = 'unfilled-star';
        }
    }
};

const submitRating = (img) => {
    const mIdValue = document.getElementById('mId').value;
    Utils.setUserRating(mIdValue, img.value);
    showMovieUserRating(mIdValue);
};

const showMovieUserRating = (mId) => {
    const unratedDiv = document.getElementById('unrated');
    const ratedDiv = document.getElementById('rated');

    const ratings = Utils.getUserRatings();
    console.log(ratings);

    const movieRating = ratings ? ratings.filter(userRating => userRating.mId === mId.toString()) : null;
    if (movieRating && movieRating.length > 0) {
        console.log(movieRating);
        Utils.hideElement(unratedDiv);
        Utils.showElement(ratedDiv);

        Utils.removeAllChildsFromElement(ratedDiv);
        for (let i = 0; i < movieRating[0].rating; i++) {
            const starImg = document.createElement('img');
            starImg.src = 'img/star_filled.png';
            starImg.className = 'filled-star';

            ratedDiv.appendChild(starImg);
        }
    } else {
        Utils.showElement(unratedDiv);
        Utils.hideElement(ratedDiv);
    }
};

//


//CLASSES / ENUMS
const AjaxHttpCaller = class {
    /**
     * Create a new AjaxHttpCaller object for sending ajax requests (GET OR POST) to a specific API url
     * @param apiUrl, The API url to send the requests. If null, use default http://62.217.127.19:8010
     */
    constructor(apiUrl) {
        if (apiUrl) {
            this.API_URL = apiUrl;
        } else {
            this.API_URL = 'http://62.217.127.19:8010';
        }

        this.xmlHttp = new XMLHttpRequest();
    }

    /**
     * Send the API request
     * @param method, GET OR POST
     * @param endpoint, the endpoint of api url to send request
     * @param data, the data to send with request
     * @param callback, the callback to call when ajax state is done
     */
    sendRequest(method, endpoint, data, callback) {
        this.xmlHttp.onreadystatechange = this.onReadyChange(callback);

        if (method === HTTP_METHODS.GET) {
            return this.ajaxRequestGet(endpoint);
        } else if (method === HTTP_METHODS.POST) {
            return this.ajaxRequestPost(endpoint, data);
        } else {
            throw new Error('Method not defined');
        }

    };

    ajaxRequestGet(endpoint) {
        this.xmlHttp.open('GET', `${this.API_URL}/${endpoint}`, true);
        this.xmlHttp.setRequestHeader('Accept', 'application/json');
        this.xmlHttp.send(null);
    };

    ajaxRequestPost(endpoint, data) {
        this.xmlHttp.open('POST', `${this.API_URL}/${endpoint}`, true);
        this.xmlHttp.setRequestHeader('Accept', 'application/json');
        this.xmlHttp.setRequestHeader('Content-Type', 'application/json');
        this.xmlHttp.send(data ? JSON.stringify(data) : null);
    };

    onReadyChange(callback) {
        return () => {
            try {
                if (this.xmlHttp.readyState === XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
                    if (this.xmlHttp.status === HTTP_STATUS.OK || this.xmlHttp.status === HTTP_STATUS.CREATED) {
                        return callback(null, JSON.parse(this.xmlHttp.responseText))
                    } else if (this.xmlHttp.status === HTTP_STATUS.NOT_FOUND) {
                        return callback('Resource not found');
                    } else if (this.xmlHttp.status === HTTP_STATUS.BAD_REQUEST) {
                        return callback('Bad request');
                    } else if (this.xmlHttp.status === HTTP_STATUS.SERVER_ERROR) {
                        return callback('Server Error');
                    } else {
                        return callback('Something very bad happened');
                    }
                }
            } catch (err) {
                console.error(err);
                return callback('Something very bad happened');
            }
        };

    };
};

const MoviesAPICaller = class extends AjaxHttpCaller {
    constructor(apiUrl) {
        super(apiUrl);
    }

    getMoviesByKeyword(keyword, cb) {
        const data = {
            keyword: keyword
        };

        super.sendRequest(HTTP_METHODS.POST, 'movie', data, cb);
    };


    getMovieById(id, cb) {
        super.sendRequest(HTTP_METHODS.GET, `movie/${id}`, null, cb);
    };


    getRatingsByMovies(movieList, cb) {
        const data = {
            movieList: movieList
        };
        super.sendRequest(HTTP_METHODS.POST, 'ratings', data, cb);
    };

    getRatingsByUserId(userId, cb) {
        super.sendRequest(HTTP_METHODS.GET, `ratings/${userId}`, null, cb);
    };
};

const UserRating = class {
    constructor(mId, rating) {
        this.mId = mId;
        this.rating = rating;
    }
};

const Utils = class {
    static hideElement(element) {
        element.style.display = 'none';
    }


    static showElement(element) {
        element.style.display = 'block';
    }

    static removeAllChildsFromElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    static setUserRating(mId, value) {
        let userRatings = Utils.getUserRatings();
        if (!userRatings) {
            userRatings = [];
        }
        userRatings.push(new UserRating(mId, value));
        console.log(userRatings);
        console.log(JSON.stringify(userRatings));
        localStorage.setItem('userRatings', JSON.stringify(userRatings));
    }

    static getUserRatings() {
        let userRatings = localStorage.getItem('userRatings');
        if (userRatings) {
            userRatings = JSON.parse(userRatings);
            return userRatings;
        } else {
            return null;
        }
    }

    static showMovies(parentElement, movies) {
        this.removeAllChildsFromElement(parentElement);
        this.showElement(parentElement);
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
    }
};


// Enums at js ES6 -> http://2ality.com/2016/01/enumify.html
const HTTP_METHODS = Object.freeze({
    GET: 'GET',
    POST: 'POST'
});

const HTTP_STATUS = Object.freeze({
    OK: 200,
    CREATED: 201,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    SERVER_ERROR: 500
});