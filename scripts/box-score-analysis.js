/** Goals for this extension are as follows:
 * 1. Create a link to the team's GDAnalyst game analysis schedule page.
 * 2. Create individual analysis links next to each box score link.
 * 3. Do 1 and 2 for main schedule page.
 * 4. Do 1 and 2 for team profile page schedule tab.
 * 5. Do 1 and 2 for team profile page gamelog tab.
 */

let url = window.location.href;
const main_schedule_page = 'https://www.whatifsports.com/gd/schedule';
const teamId_schedule_page = 'https://www.whatifsports.com/gd/TeamProfile/Schedule.aspx?tid=';
const teamId_gamelog_page = 'https://www.whatifsports.com/gd/TeamProfile/GameLog.aspx?tid=';
const active_school_id = document.getElementById('pagetid')['value'];
const gdanalyst_team_schedule_page = `https://gdanalyst.herokuapp.com/${active_school_id}/schedule`;
const parser = new DOMParser();

// Regular team schedule page or team profile schedule tab
// Want to insert link to this team's game analysis page on GDAnalyst
if (url.startsWith(main_schedule_page) || url.startsWith(teamId_schedule_page)) {
    const d1 = document.getElementsByClassName('TeamScheduleCtl');
    const d2 = d1[0].getElementsByClassName('ContentBoxHeader');
    const newDiv = document.createElement('div');
    newDiv.setAttribute('style', 'text-align:center');
    //newDiv.setHTML(`<h3><a href="${gdanalyst_team_schedule_page}" target="_blank" style="color:blue">Link to GDAnalyst Analysis Page</a></h3>`);
    let html_to_insert = parser.parseFromString(`<h3><a href="${gdanalyst_team_schedule_page}" target="_blank" style="color:blue">Link to GDAnalyst Analysis Page</a></h3>`, "text/html");
    newDiv.appendChild(html_to_insert.body.firstChild);
    d2[0].insertAdjacentElement('afterend',newDiv);

    // gets all cells with box score link
    let r = d1[0].querySelectorAll("a.boxscoreLink");
    let regex = /OpenBoxscore\((\d{7})\)/;
    r.forEach(element => {
        element.setAttribute('style','vertical-align:middle;');
        let boxscoreid = element.getAttribute('href').match(regex);
        let boxscoreurl = `${gdanalyst_team_schedule_page}/all?gameids=${boxscoreid[1]}`;
        let newlink = document.createElement('a');
        newlink.setAttribute('href',boxscoreurl);
        newlink.setAttribute('target',"_blank");
        let html_to_insert = parser.parseFromString(`<img src="https://freesvg.org/img/1430954247.png" height="16px" width="16px" style="vertical-align:middle; margin-right:3px"></img>`, "text/html");
        newlink.appendChild(html_to_insert.body.firstChild);
        element.insertAdjacentElement("beforebegin", newlink);
    })
};