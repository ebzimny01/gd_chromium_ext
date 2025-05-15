# GD Helper for WIS Gridiron Dynasty (Browser Extension)
Chrome Extension for mapping recruit hometowns using GDAnalyst website

## Description
This extension is for coaches who play Gridiron Dynasty on Whatifsports.com (WIS).

When you search for recruits, the web page displays the recruits hometown (City, ST). This extension modifies the hometown to be a URL that opens The Next Guess website (www.thenextguess.com) and leverages its mapping capability to show you where the recruit is located compared to all human coaches in that world and division.

The extension also inserts links to the respective Next Guess page for the currently active team, the previouos game's opponent, and the current game's home/away teams. And it also adds an "Analyze" link to the current and previouos games which will analyze the box score using The Next Guess game analyzer.

## How To Install
### Firefox (v109 or newer)
1. Install the extension from the Firefox Add-on site [here](https://addons.mozilla.org/en-US/firefox/addon/wis-gridiron-dynasty-helper/).
2. By default it will only run when you click the Extension Icon. You can change the extension to "Always Allow on Whatifsports.com", and it will then work automatically.

### Chromium Extension (Google Chrome and Microsoft Edge)
1. Chrome extension is available from Chrome Web Store [here](https://chrome.google.com/webstore/detail/city-mapper-for-wis-gridi/elfljjgjfjddifffclgoifgnliibnlll).

## How to Use
1. Do a "Recruiting Search" on WIS GD.
2. The recruits' hometowns should be modified with a + sign in front and have a hyperlink.
3. Click on each hometown link and it will open a new tab and map the recruits location relative to human coaches in your world and division.
4. ALso, if you open a Recruit's Profile Page, the hometown will be hyperlinked and map the recruits location.
5. On your team's schedule page, you can click the Link to GDAnalyst Page to open GDAnalyst game analyse/schedule page for your team.
6. On your team's schedule page, next to each box score is a green + icon. Click it and GDAnalyst website will analyze the box score for you.
7. On your team's main page, the Previous Game includes an "Analyze" link which will analyze that box score using GDAnalyst.
8. On your team's main page, underneath the Current Game section, there are links to GUESS and GDAnalyst Schedule page for the Home and Away teams. At half-time of the current game, there will also be an "Analuyze Box Score" link.

## Release Notes
### v2.0.0.2
1. Fixed broken location link after adding a recruit to watch list.

### v2.0.0.1
1. Fixed missing box score analysis link.

### v2.0.0.0
1. Migrated the extension to use The Next Guess website.


### v1.0.0.3
1. Fixed minor queryselector issue.
 
### v1.0.0.2
1. Fixes an issue where sometimes the order of 2 elements were not rendered the same on different browsers, the logic would pick the wrong element to update, and would fail to insert the links.

### v1.0.0.1
1. Fixed issue where the links stopped getting inserted after the new upcoming is shown on main office page.
2. Added GDAnalyst schedule link and GUESS link for the previous opponent.
   
### v1.0.0.0
1. Added links to GDAnalyst Schedule Page and GUESS page for the Active Team in the upper right corner. 
2. Added GDAnalyst Analyze link for the previous game's box score.
3. Added GDAnalyst Schedule Page and GUESS page links for the current game's Home and Away teams.
4. Added GDAnalyst Analyze link for the current game's box score. (Only visible at half-time of current game).

   ![](https://github.com/ebzimny01/gd_chromium_ext/blob/master/wiki/v1-0-0-0.jpg)
   
5. On the Recruit Profile page, GDAnalyst Hometown link will now show on every tab of the Recruit Profile page.

   ![](https://github.com/ebzimny01/gd_chromium_ext/blob/master/wiki/recruitprofile.jpg)
   
### v0.0.2.0
1. In the active team's schedule page, as well as the team's profile schedule tab, the extension will insert a link to the active team's schedule/game analysis page on GDAnalyst website.
2. Next to each boxscore link, the extension will insert a small green plus icon that is hyperlinked to GDAnalyst game analysis. Clicking the green plus icon will open GDAnalyst in a new tab and analyze the boxscore.

     ![](https://github.com/ebzimny01/gd_chromium_ext/blob/master/wiki/teamschedule.jpg)

### v0.0.1.2
1. Resolves an issue where the page updates made by the extension may disappear if certain actions are taken on the page (e.g. clicking check box to add a recruit to your watchlist or changing some of the search filter options at the top).
2. Restructured the code into multiple functions.
3. Added more code comments.

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
