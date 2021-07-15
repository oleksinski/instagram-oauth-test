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

    let json = {};

    const classes = {
        users: 'PZuss',
        user: 'wo9IH',
        userNameAliasId: 'enpQJ',
        name: 'wFPL8',
        alias: '_0imsa',
        avatar: '_6q-tv'
    };

    const users = document.getElementsByClassName(classes.users)[0].getElementsByClassName(classes.user);

    for(var i in users) {
        if (users.hasOwnProperty(i)) {
            const userNode = users[i];
            const userNameAliasNode = userNode.getElementsByClassName(classes.userNameAliasId);
            const user = userNameAliasNode[0];

            const userAlias = user.getElementsByClassName(classes.alias)[0].textContent;
            const userName = user.getElementsByClassName(classes.name)[0].textContent;

            json.push([userAlias, userName]);
        }
    }

    console.log(JSON.stringify(json));
})();
