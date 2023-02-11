/** Goals for this enhancement are as follows:
 * 1. Create a link to the team's GDAnalyst game analysis schedule page.
 * 2. Create individual analysis links next to each box score link.
 * 3. Do 1 and 2 for main schedule page.
 * 4. Do 1 and 2 for team profile page schedule tab.
 */

let url = window.location.href;
const main_schedule_page = 'https://www.whatifsports.com/gd/schedule';
const teamId_schedule_page = 'https://www.whatifsports.com/gd/TeamProfile/Schedule.aspx?tid=';
const teamId_gamelog_page = 'https://www.whatifsports.com/gd/TeamProfile/GameLog.aspx?tid=';
// Get the active teamId
const active_school_id = document.getElementById('pagetid')['value'];
let gdanalyst_team_schedule_page = `https://gdanalyst.herokuapp.com/${active_school_id}/schedule`;
const parser = new DOMParser();

// Regular team schedule page or team profile schedule tab
// Want to insert link to this team's game analysis page on GDAnalyst
if (url.startsWith(main_schedule_page) || url.startsWith(teamId_schedule_page)) {
    if (url.startsWith(teamId_schedule_page)) {
        /** For any team profile page that is opened, need to get the teamId.
         * Grabs the correct 'div' and then child 'a' while using a regex
         * to find the 5-digit teamId within the 'href' attribute.
         */
        const d0 = document.getElementsByClassName('teamInfoSec');
        const regex = /OpenTeamProfile\((\d{5})/;
        const tid = d0[0].getElementsByTagName('a')[0].getAttribute('href').match(regex)[1];
        gdanalyst_team_schedule_page = `https://gdanalyst.herokuapp.com/${tid}/schedule`;
    }
    const d1 = document.getElementsByClassName('TeamScheduleCtl');
    const d2 = d1[0].getElementsByClassName('ContentBoxHeader');
    const newDiv = document.createElement('div');
    newDiv.setAttribute('style', 'text-align:center');
    let html_to_insert = parser.parseFromString(`<h3><a href="${gdanalyst_team_schedule_page}" target="_blank" style="color:blue">Link to GDAnalyst Analysis Page</a></h3>`, "text/html");
    newDiv.appendChild(html_to_insert.body.firstChild);
    d2[0].insertAdjacentElement('afterend',newDiv);

    // gets all cells with box score link
    let r = d1[0].querySelectorAll("a.boxscoreLink");
    // regex that finds each boxscore ID
    let regex = /OpenBoxscore\((\d{7})\)/;

    /** Iterates through each row element to add plus icon and box score analysis
     * analysis URL in front of each box score link.
     * When the user clicks on the plus icon, it will open GDAnalyst website
     * and analyze that specific boxscore.
     */
    r.forEach(element => {
        element.setAttribute('style','vertical-align:middle;');
        let boxscoreid = element.getAttribute('href').match(regex);
        let boxscoreurl = `${gdanalyst_team_schedule_page}/all?gameids=${boxscoreid[1]}`;
        let newlink = document.createElement('a');
        newlink.setAttribute('href',boxscoreurl);
        newlink.setAttribute('target',"_blank");
        let imagefile = 'images/plus-icon.png';
        let imageurl = chrome.runtime.getURL(imagefile);
        let html_to_insert = parser.parseFromString(`<img src="${imageurl}" height="12px" width="12px" style="vertical-align:middle; margin-right:3px"></img>`, "text/html");
        newlink.appendChild(html_to_insert.body.firstChild);
        element.insertAdjacentElement("beforebegin", newlink);
    })
};