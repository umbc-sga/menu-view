<?php
    // get filename for today's menu from POST request
    $formatted_date = $_POST["menuDate"];

    // convert the / to - for DineOnCampus formatting
    $formatted_date = str_replace("/", "-", $formatted_date);

    // create filename for menu data
    $file_name = $formatted_date . ".json";

    // Walk directory for menus which their days have passed
    foreach (scandir('.') as $file) {
        // if is a date formatted file (has dash)
        if (strpos($file, 'php') == false) {
            // get today's date
            $today = date("Y-m-d");

            // get file name without extension (so just date)
            $basename = basename($file, ".json");
            $fileDate = substr($basename, strrpos($basename, "_") + 1);

            // convert date from file into date object
            $fileDate = date("Y-m-d", strtotime($fileDate));

            // If file date has passed, delete from cache
            if ($today > $fileDate) {
                unlink($file);
            }
        }
    }

    // add location to filename
    $file_name = $_POST["location"] . "_" . $file_name;

    // if the file is not cached, retrieve from DineOnCampus
    if (file_exists($file_name) == false) {
        if ($_POST["location"]  == "dhall") {
            $locationURL = "https://api.dineoncampus.com/v1/location/menu?site_id=5751fd3690975b60e04893e2&platform=0&location_id=5873e39e3191a200fa4e8399&date=";
        }
        elseif ($_POST["location"]  == "skylight") {
            $locationURL = "https://api.dineoncampus.com/v1/location/menu?site_id=5751fd3690975b60e04893e2&platform=0&location_id=5b97c25e1178e90d90a74099&date=";
        }
        else if($_POST["location"]  == "admin") {
            $locationURL = "https://api.dineoncampus.com/v1/location/menu?site_id=5751fd3690975b60e04893e2&platform=0&location_id=586bcfa12cc8da3d267f4682&date=";
        }

        $url = $locationURL . $formatted_date;
        
        // put the contents of the file into a variable
        $data = file_get_contents($url); 
        
        // write the file contents to cache
        file_put_contents($file_name, $data);

        // return the data as response
        echo file_get_contents($file_name);
    }
    else {
        // return the cached data as response
        echo file_get_contents($file_name);
    }
?>