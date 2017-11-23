//Find recommendations by similarity

//Import scripts to Worker
importScripts('../enums/HTTP_METHODS.js',
    '../enums/HTTP_STATUS.js',
    '../services/ajaxHttpCaller.js',
    '../services/moviesApiCaller.js',
    '../utilities/pearson-correlation.js',
    '../utilities/utils.js');

let movieCaller;
onmessage = (e) => {
    console.log('Message received from main script');
    const data = JSON.parse(e.data);
    movieCaller = new MoviesAPICaller();
    let movieListRatings = data.movieListRatings;
    let currentUserRatings = data.currentUserRatings;
    getRecommendations(movieListRatings, currentUserRatings, (err, moviesForRecommendationWithTitle) => {
        console.log('Posting message back to main script');
        if(err) {
            console.log("No recommendations found");
        } else {
            postMessage(moviesForRecommendationWithTitle);
        }

    })
};

const getRecommendations = (movieListRatings, currentUserRatings, cb) => {
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
            const scorePerUserId = [];
            Object.keys(moviesRatingsByUser).forEach(function (userId) {
                if (moviesRatingsByUser[userId] && moviesRatingsByUser[userId].length > 0 && currentUserRatings.length - moviesRatingsByUser[userId].length <= 2) {
                    const userRatings = moviesRatingsByUser[userId].map((it) => parseFloat(it.rating));

                    const score = getPearsonCorrelation(currentUserRatings, userRatings);
                    scorePerUserId.push({
                        userId: userId,
                        score: score
                    });
                }
            });
            // Sort by score asc and get 3 most similar with current user
            const similarUserRatings = Utils.sortArrayByKey(scorePerUserId, 'score', true).slice(0, 3);

            if(similarUserRatings.length === 0) {
                return cb('Not Found', null)
            }

            getMovieRecommendationsByUsers(similarUserRatings, movieListRatings, (moviesForRecommendation => {
                // Get first 4 movies for recommendations
                moviesForRecommendation = Utils.sortArrayByKey(moviesForRecommendation, 'rating', false).slice(0, 4);
                moviesForRecommendation = moviesForRecommendation.map((movieRec) => movieRec['movieId']);

                let moviesForRecommendationWithTitle = [];
                let i = 0;
                const loopArray = (moviesForRecommendation) => {
                    getMovieTitle(moviesForRecommendation[i], (title) => {
                        moviesForRecommendationWithTitle.push({
                            mId: moviesForRecommendation[i],
                            title: title
                        });
                        i++;
                        if (i < moviesForRecommendation.length) {
                            loopArray(moviesForRecommendation);
                        } else {
                            return cb(null, moviesForRecommendationWithTitle);
                        }
                    })
                };
                loopArray(moviesForRecommendation);
            }))

        }
    });
};

const getMovieRecommendationsByUsers = (similarUserRatings, movieListRatings, cb) => {
    let moviesForRecommendation = [];

    let i = 0;
    const loopArray = (similarUserRatings) => {
        getMovieRecommendations(similarUserRatings[i], movieListRatings, (moviesUserRecommendation) => {
            moviesForRecommendation = moviesForRecommendation.concat(moviesUserRecommendation);
            i++;
            if (i < similarUserRatings.length) {
                loopArray(similarUserRatings);
            } else {
                return cb(moviesForRecommendation);
            }
        })
    };

    loopArray(similarUserRatings);
};


const getMovieRecommendations = (userRating, movieListRatings, cb) => {
    const moviesUserRecommendation = [];
    movieCaller.getRatingsByUserId(userRating.userId, (err, movieRatings) => {
        if (err) {
            console.error(err);
        } else {
            movieRatings.forEach((movieRating) => {
                if (movieRating.rating >= 4 && !movieListRatings.includes(movieRating.movieId) && !movieRatings.includes(movieRating.movieId)) {
                    moviesUserRecommendation.push(movieRating);
                }
            });

            return cb(moviesUserRecommendation);
        }
    });
};



const getMovieTitle = (movieId, cb) => {
    movieCaller.getMovieById(movieId, (err, movie) => {
        if (err) {
            console.error(err);
        } else {
            cb(movie[0].title);
        }
    });
};

