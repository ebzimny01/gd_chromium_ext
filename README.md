# City Mapper for WIS Gridiron Dynasty (Chrome Extension)
Chrome Extension for mapping recruit hometowns using GDAnalyst website

## Description
This extension is for coaches who play Gridiron Dynasty on Whatifsports.com (WIS). When you search for recruits, the web page displays the recruits hometown (City, ST). This extension modifies the hometown to be a URL that opens the GDAnalyst website (gdanalyst.herokuapp.com) and leverages its mapping capability to show you where the recruit is located compared to all human coaches in that world and division.

## How To Install
### Firefox (v109 or newer)
1. Install the extension from the Firefox Add-on site [here](https://addons.mozilla.org/en-US/firefox/addon/wis-gridiron-dynasty-mapper/).
2. By default it will only run when you click the Extension Icon. You can change the extension to "Always Allow on Whatifsports.com", and it will then work automatically.

### Chromium Extension (Google Chrome and Microsoft Edge)
I am currently waiting on the Chrome Extension to be approved and published. In the meantime, here are instructions on how to load the unpacked extension manually.

1. [Download the .zip file](https://github.com/ebzimny01/gd_chromium_ext/blob/master/gd_chromium_ext.zip) from the repository
2. Unzip the downloaded file to a folder location of your choice
3. Open a Chromium-based browser - e.g. Chrome or Edge
4. Enter "chrome://extensions" in the address bar and hit "ENTER" key (or "edge://extensions" if using Edge browser)
5. Enable "Developer Mode" (there is a toggle on left side of page).
6. elect "Load Unpacked Extension" (button near top of page)
7. Select the folder that you unzipped the files to in step #2 above

## How to Use
1. Do a "Recruiting Search" on WIS GD.
2. The recruits' hometowns should be modified with a + sign in front and have a hyperlink.
3. Click on each hometown link and it will open a new tab and map the recruits location relative to human coaches in your world and division.

## Release Notes
### v0.0.1.1
1. Enhancement - When you perform a Recruiting Search, if a recruit is "yellow" for your school, the recruit's row background will be YELLOW, and if a recruit is "green" for your school, the recruit's row background will be GREEN.

### v0.0.1.0
1. Enhancement - When you open a recruit's profile page, the hometown will now be linked to map location on GDAnalyst website.

### v0.0.0.5
1. Ok, this time I really fixed the issue where URLs were not working correctly for certain schools. (pretty sure at least)

### v0.0.0.4
1. Fixed issue where the URLs were not working correctly for certain schools.

### v0.0.0.3
1. Resolved bug when changing Recruit Search to use the Ratings View where there is no Hometown column.

### v0.0.0.2
1. Updated manifest file to support Firefox v109 or newer. Note: Extension is pending approval by Mozilla.
2. Resolved a bug where the Hometown column was not getting selected correctly, which was resulting in incorrectly updating the page content/URLs.
