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
            deleteSpan.addEventListener('click', onDeleteMyRating, false);
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


const onDeleteMyRating = (e) => {
    Utils.removeNode(e.target.parentNode.parentNode); // Remove tr
    Utils.removeFromUserRatings(e.target.getAttribute("movie-id"));
};