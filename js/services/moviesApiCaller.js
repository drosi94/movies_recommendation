class MoviesAPICaller extends AjaxHttpCaller {
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
}