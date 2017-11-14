class AjaxHttpCaller {
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
