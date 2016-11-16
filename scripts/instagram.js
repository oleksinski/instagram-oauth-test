/**
 * Grab all followers:
 * -------------------
 * 1. Goto: https://www.instagram.com/{username}/followers/
 * 2. Scroll down all users
 * 3. Execute the function below within the console
 * 4. Grab output JSON and save under "/data/followers.json" file
 *
 * Grab all following
 * 1. Goto: https://www.instagram.com/{username}/following/
 * 2. Scroll down all users
 * 3. Execute the function below within the console
 * 4. Grab output JSON and save under "/data/following.json" file
 */

(function getUsersJSON() {

    var json = {};

    var classes = {
        users: '_539vh',
        user: '_cx1ua',
        name: '_2uju6',
        alias: '_4zhc5',
        avatar: '_a012k'
    };

    var users = document.getElementsByClassName(classes.users)[0].getElementsByClassName(classes.user);

    for(var i in users) {
        if (users.hasOwnProperty(i)) {
            var user = users[i];

            if (user.getElementsByClassName) {
                var userName = user.getElementsByClassName(classes.name)[0].textContent;
                //console.log(userName);

                var userAlias = user.getElementsByClassName(classes.alias)[0].textContent;
                //console.log(userAlias);

                //var userAvatar = user.getElementsByClassName(classes.avatar)[0].src;
                //console.log(userAvatar);

                json[userAlias] = {
                    alias: userAlias,
                    name: userName
                    //avatar: userAvatar
                };
            }
        }
    }

    console.log(JSON.stringify(json));
})();