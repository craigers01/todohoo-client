<?php
// Utility function to call php outside of public_html
require_once("/home/todohoo/php/todohoo_config.php"); 
$modelName = $_GET["model"];
require_once($GLOBALS['phpPath'] . "/" . $modelName . ".php"); 
?>