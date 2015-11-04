// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var todoApp = angular.module('starter', ['ionic', 'ngCordova']);
var db = null;

todoApp.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

todoApp.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state("config", {
      url: "/config",
      templateUrl: "templates/config.html",
      controller: "ConfigController"
    })
  $stateProvider
    .state("categories", {
      url: "/categories",
      templateUrl: "templates/categories.html",
      controller: "CategoriesController"
    })
  $stateProvider
    .state("lists", {
      url: "/lists/:categoryId",
      templateUrl: "templates/lists.html",
      controller: "ListsController"
    })
  $stateProvider
    .state("items", {
      url: "/items/:listId",
      templateUrl: "templates/items.html",
      controller: "ItemsController"
    });
  $urlRouterProvider.otherwise("/config");
});

var db = null;

todoApp.controller("ConfigController", function($scope, $ionicPlatform, $ionicLoading, $location, $ionicHistory, $cordovaSQLite) {
  $ionicHistory.nextViewOptions({
    disableAnimate: true,
    disableBack: true
  });

  $ionicPlatform.ready(function() {
    $ionicLoading.show({ template: 'Loading...' });
    if(window.cordova) {
      window.plugins.sqlDB.copy("populated.db", function() {
        db = $cordovaSQLite.openDB("populated.db");
        $location.path("/categories");
        $ionicLoading.hide();
      }, function(error) {
        console.error("There was an error copying the database: " + error);
        db = $cordovaSQLite.openDB("populated.db");
        $location.path("/categories");
        $ionicLoading.hide();
      });

    } else {
      db = openDatabase("websql.db", '1.0', "My WebSQL Database", 2 * 1024 * 1024);
      db.transaction(function (tx) {
        tx.executeSql("DROP TABLE IF EXISTS tblCategories");
        tx.executeSql("CREATE TABLE IF NOT EXISTS tblCategories (id integer primary key, category_name text)");
        tx.executeSql("CREATE TABLE IF NOT EXISTS tblTodoLists (id integer primary key, category_id integer, todo_list_name text)");
        tx.executeSql("CREATE TABLE IF NOT EXISTS tblTodoListItems (id integer primary key, todo_list_id integer, todo_list_item_name text)");
        tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["Shopping"]);
        tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["Chores"]);
        tx.executeSql("INSERT INTO tblCategories (category_name) VALUES (?)", ["School"]);
      });
      $location.path("/categories");
      $ionicLoading.hide();
    }
  });
});

todoApp.controller("CategoriesController", function ($scope, $ionicPlatform, $cordovaSQLite) {
  $scope.categories=[];
  $ionicPlatform.ready(function() {
    var query = "SELECT id, category_name FROM tblCategories";
    $cordovaSQLite.execute(db, query, []).then(function(res){
      if(res.rows.length > 0) {
        for(var i = 0; i < res.rows.length; i++) {
          $scope.categories.push({id: res.rows.item(i).id, category_name: res.rows.item(i).category_name});
        }
      }

    }, function(error) {
        console.error(error);
    });

  })

});

todoApp.controller("ListsController", function ($scope, $ionicPlatform, $cordovaSQLite, $stateParams, $ionicPopup) {
  $scope.lists=[];
  $ionicPlatform.ready(function() {
    var query = "SELECT id, category_id, todo_list_name FROM tblTodoLists WHERE category_id = ?";
    $cordovaSQLite.execute(db, query, [$stateParams.categoryId]).then(function(res){
      if(res.rows.length > 0) {
        for(var i = 0; i < res.rows.length; i++) {
          $scope.categories.push({id: res.rows.item(i).id, category_id: res.rows.item(i).category_id, todo_list_name: res.rows.item(i)});
        }
      }

    }, function(error) {
      console.error(error);
    });
  });

  $scope.insert = function() {
    $ionicPopup.prompt({
      title: "Enter a new TODO list",
      inputType: "text"
    })
      .then(function(result) {
        if(result !==undefined) {
          var query = "INSERT INTO tblTodoLists (category_id, todo_list_name) VALUES (?, ?)";
          $cordovaSQLite.execute(db, query, [$stateParams.categoryId, result]).then(function(res) {
            $scope.lists.push({id: res.insertId, category_id: $stateParams.categoryId, todo_list_name: result});
          }, function (error) {
            console.error(error);
          });
        } else {
          console.log("Action not completed")
        }
      })
  }
});

todoApp.controller("ItemsController", function ($scope, $ionicPlatform, $cordovaSQLite, $stateParams, $ionicPopup) {
  $scope.items=[];
  $ionicPlatform.ready(function() {
    var query = "SELECT id, todo_list_id, todo_list_item_name FROM tblTodoListItems WHERE todo_list_id = ?";
    $cordovaSQLite.execute(db, query, [$stateParams.categoryId]).then(function(res){
      if(res.rows.length > 0) {
        for(var i = 0; i < res.rows.length; i++) {
          $scope.lists.push({id: res.rows.items(i).id, todo_list_id: res.rows.items(i).todo_list_id, todo_list_item_name: res.rows.items(i).todo_list_item_name});
        }
      }

    }, function(error) {
      console.error(error);
    });
  });
  $scope.insert = function() {
    $ionicPopup.prompt({
      title: "Enter a new TODO list item",
      inputType: "text"
    })
      .then(function(result) {
        if(result !==undefined) {
          var query = "INSERT INTO tblTodoListItems (todo_list_id, todo_list_item_name) VALUES (?, ?)";
          $cordovaSQLite.execute(db, query, [$stateParams.listId, result]).then(function(res) {
            $scope.lists.push({id: res.insertId, todo_list_id: $stateParams.listId, todo_list_item_name: result});
          }, function (error) {
            console.error(error);
          });
        } else {
          console.log("Action not completed")
        }
      })
  }
});

