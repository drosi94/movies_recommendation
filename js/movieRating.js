class UserRating {
    constructor(mId, title, rating) {
        this.mId = mId;
        this.title = title;
        this.rating = rating;
    }
}

const fillStars = (e) => {
    const value = e.target.getAttribute('value');
    const images = document.getElementsByClassName('unfilled-star');
    for (let i = images.length - 1; i >= 0; i--) {
        if (parseInt(images[i].getAttribute('value')) <= value) {
            images[i].src = 'img/star_filled.png';
            images[i].className = 'filled-star';
        }
    }
};

const unFillStars = (e) => {
    const value = e.target.getAttribute('value');
    const images = document.getElementsByClassName('filled-star');
    for (let i = images.length - 1; i >= 0; i--) {
        if (parseInt(images[i].getAttribute('value')) <= value) {
            images[i].src = 'img/star_not_filled.png';
            images[i].className = 'unfilled-star';
        }
    }
};

const submitRating = (e) => {
    const mIdValue = document.getElementById('mId').value;
    const title = document.getElementById('title').innerText;
    Utils.setUserRating(mIdValue, title, e.target.value);
    showMovieUserRating(mIdValue);
};

const showMovieUserRating = (mId) => {
    const unratedDiv = document.getElementById('unrated');
    const ratedDiv = document.getElementById('rated');

    const ratings = Utils.getUserRatings();

    const movieRating = ratings ? ratings.filter(userRating => userRating.mId === mId.toString()) : null;
    if (movieRating && movieRating.length > 0) {
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

const onDeleteRating = (e) => {
    Utils.removeNode(e.target.parentNode.parentNode); // Remove tr
    Utils.removeFromUserRatings(e.target.getAttribute("movie-id"));
};