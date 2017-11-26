class Utils {
    static urlChange(id, title, url, activeLink) {
        window.history.pushState(id, title, `#/${url}`);

        document.getElementById('pageTitle').innerHTML = document.title = title;

        if (activeLink) {
            this.activateLink(activeLink)
        }
    }

    static activateLink(activeLink) {
        const activeLis = document.querySelectorAll('li.active');
        activeLis.forEach(li => {
           li.classList.remove('active');
        });

        activeLink.parentNode.classList += " active"

    }

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

    static setUserRating(mId, title, value) {
        let userRatings = Utils.getUserRatings();
        if (!userRatings) {
            userRatings = [];
        }
        userRatings.push(new UserRating(mId, title, value));

        localStorage.setItem('userRatings', JSON.stringify(userRatings));
    }

    static removeFromUserRatings(mId) {
        let userRatings = Utils.getUserRatings();
        userRatings.splice(userRatings.findIndex((rating) => rating.mId === mId), 1);
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

    static setLatestRecommendations(movieList, recommendations) {
        let latestRecommendations = {
            movieList: movieList,
            recommendations: recommendations
        };

        localStorage.setItem('latestRecommendations', JSON.stringify(latestRecommendations));
    }

    static getLatestRecommendations() {
        let latestRecommendations = localStorage.getItem('latestRecommendations');
        if (latestRecommendations) {
            latestRecommendations = JSON.parse(latestRecommendations);
            return latestRecommendations;
        } else {
            return null;
        }
    }

    static setLatestResults(keyword, movies) {
        let latestResults = {
            keyword: keyword,
            movies: movies
        };

        localStorage.setItem('latestResults', JSON.stringify(latestResults));
    }


    static getLatestResults() {
        let latestResults = localStorage.getItem('latestResults');
        if (latestResults) {
            latestResults = JSON.parse(latestResults);
            return latestResults;
        } else {
            return null;
        }
    }

    static arraysEqual(a1, a2) {
        return a1.length === a2.length && a1.every((v, i) => v === a2[i])
    }

    static sortArrayByKey(array, key, asc) {
        return array.sort((a, b) => ( asc ? a[key] - b[key] : b[key] - a[key]));
    }

    static removeNode(node) {
        node.parentElement.removeChild(node);
    }
}