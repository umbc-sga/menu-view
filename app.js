const app = angular.module("food-notify", ["ngRoute"]);

/**
 * Routing for SPA functionality.
 */
app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
    .when("/", {
        templateUrl: "templates/home.html",
        controller: 'HomeCtrl'
    })
    .when("/register", {
        templateUrl: "templates/register.html",
        controller: 'RegisterCtrl'
    })
    .when("/login", {
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })
    .otherwise({
        redirectTo: "/"
    });
}]);

/**
* Allow for the User object to be updated live and be passed through controllers.
*/
app.service("CurrentUserService", function() {
    // Create everything as local variables
    var currentUser = null, setUser, getUser, updateFavorites;

    /**
    * Set the current user.
    */
    setUser = function(user) {
        currentUser = user;
    };

    /**
    * Get the current user.
    */
    getUser = function() {
        return currentUser;
    }

    updateFavorites = function(favorites) {
        currentUser.favorites = favorites;
    }

    // Export the functions
    return {
        setUser: setUser,
        getUser: getUser,
        updateFavorites: updateFavorites
    };
});

/**
* Manage User logins and registrations.
*/
app.factory("AuthService", ["$http", function($http) {
    return {
        createUser: function(email, password) {
            return $http.post("/create-user", {
                email: email,
                password: password
            });
        },
        login: function(email, password) {
            return $http.post("/login", {
                email: email,
                password: password
            });
        }
    };
}]);

/**
* Allow user to favorite and unfavorite things.
*/
app.factory("UserActionService", ["$http", function($http) {
    return {
        favorite: function(email, item){
            return $http.post("/favorite", {
                email: email,
                item: item
            });
        },
        unfavorite: function(email, item){
            return $http.post("/unfavorite", {
                email: email,
                item: item
            });
        }
    };
}]);

app.controller("HomeCtrl", function($scope, UserActionService, CurrentUserService) {
    const SAME_EVERYDAY = ["FRESH MARKET", "BAKER'S CRUST DELI", "CONDIMENTS", "MY PANTRY"];

    $scope.menu = null;
    $scope.location = "True Grit's";

    // Set the default menu date to be today
    $scope.menuDate = new Date();

    // Attach change listeners to inputs
    $scope.$watch('menuDate', getMenu);
    $scope.$watch('location', getMenu);

    /**
     * Get the menu for the location
     */
    function getMenu() {
        $scope.menu = null;

        let locationString = "";

        if ($scope.location == "True Grit's") {
            locationString = "dhall";

            // automatically show current meal period
            $('[href="#' + getMealPeriod() + '"]').tab('show');
        }
        else if ($scope.location == "Skylight") {
            locationString = "skylight";

            // skylight only serves lunch, so autoshow lunch
            $('[href="#lunch"]').tab('show');
        }
        else if ($scope.location == "Admin") {
            locationString = "admin";

            $('[href="#' + getMealPeriod() + '"]').tab('show');
        }

        // build date string
        let dateString = $scope.menuDate.getFullYear() + "-";
        dateString += ($scope.menuDate.getMonth() + 1) + "-";
        dateString += $scope.menuDate.getDate();
        
        fetch(`https://api.sga.umbc.edu/menus/${locationString}/${dateString}`)
            .then(response => response.json())
            .then(data => {
                    $scope.menu = {};

                    if (data.status == "error") {
                        // if there is a menu loading error, its becaus skylight isn't open that day
                        $scope.menu["Lunch"] = {"No Menu Today, Skylight Closed": []};

                        // Update the angular scope to display on homepage
                        $scope.$apply();

                        // do not advance
                        return;
                    }

                    // go through every meal period in menu
                    for (let period of data.periods) {
                        $scope.menu[period.name] = {};

                        // For each DHall subsection
                        for (let category of period.categories)  
                            if (!SAME_EVERYDAY.includes(category.name))
                                $scope.menu[period.name][category.name] = category.items;  
                    }

                    // Update the angular scope to display on homepage
                    $scope.$apply();
            });
    }

    /**
     * Get the current meal period.
     */
   function getMealPeriod() {
        let currentHour = new Date().getHours();
                
        // Get the current meal period
        let currentMealPeriod;
        // Breakfast 6am - 10am
        if ([6, 7, 8, 9, 10].includes(currentHour))
            currentMealPeriod = "breakfast";
        // Lunch 11am - 2pm
        else if ([11, 12, 13, 14].includes(currentHour))
            currentMealPeriod = "lunch";
        // Dinner 4pm - 8pm
        else if ([16, 17, 18, 19, 20].includes(currentHour))
            currentMealPeriod = "dinner";
        // Late Night 9pm - 2am
        else if ([21, 22, 23, 24, 1, 2].includes(currentHour))
            currentMealPeriod = "latenight";
        else
            currentMealPeriod = "N/A";

        return currentMealPeriod;
    }
});

app.controller("LoginCtrl", function($scope) {
    $scope.login = function() {
        $.ajax({
            type: "POST",
            url: "ajax/login.php",
            data: {
                email: $scope.email,
                password: $scope.password
            },
            success: function(data) {
                console.log(data);
            }
        });
    }
});

app.controller("RegisterCtrl", function($scope) {
    $scope.register = function() {
        if ($scope.password != $scope.confirmPassword) {
            $scope.error = "Passwords do not match.";
            
            return;
        }
        
        $.ajax({
            type: "POST",
            url: "ajax/register.php",
            data: {
                name: $scope.name,
                email: $scope.email,
                password: $scope.password
            },
            success: function(data) {
                console.log(data);
            }
        });
    }
});
