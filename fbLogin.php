<?php

define('ToDoHOO', 'ToDoHOO');

//uses the PHP SDK.  Download from https://github.com/facebook/facebook-php-sdk
require_once("/home/todohoo/php/todohoo_config.php"); 
require_once($GLOBALS['phpPath'] . "/facebook.php"); 

$facebook = new Facebook(array(
  'appId'  => 185771901575410,
  'secret' => '2ec06c460d9e0b4cf6c7ee4b4848b1ae',
));

$userId = $facebook->getUser();

?>

<html>
  <body>
    <div id="fb-root"></div>
    <?php if ($userId) { 
      $userInfo = $facebook->api('/' . $userId); ?>
      Welcome <?= $userInfo['name'] ?>
    <?php } else { ?>
    <fb:login-button></fb:login-button>
    <?php } ?>


        <div id="fb-root"></div>
        <script>
          window.fbAsyncInit = function() {
            FB.init({
              appId      : 'ToDoHOO', // App ID
              channelUrl : '//WWW.ToDoHOO.COM/channel.html', // Channel File
              status     : true, // check login status
              cookie     : true, // enable cookies to allow the server to access the session
              xfbml      : true  // parse XFBML
            });
        FB.Event.subscribe('auth.login', function(response) {
          window.location.reload();
        });
          };
          // Load the SDK Asynchronously
          (function(d, s, id){
             var js, fjs = d.getElementsByTagName(s)[0];
             if (d.getElementById(id)) {return;}
             js = d.createElement(s); js.id = id;
             js.src = "//connect.facebook.net/en_US/all.js";
             fjs.parentNode.insertBefore(js, fjs);
           }(document, 'script', 'facebook-jssdk'));
        </script>

  </body>
</html>