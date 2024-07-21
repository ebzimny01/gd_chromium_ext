/*
The purpose of this script is to do the following:

For the previous game, insert a link to the GD Analyst page next to the 
WISCast link. Also, insert a link to the opponent's GD Analyst Game Results
page. Also, insert a link to the opponent's Guess page for the current season.

For the current game, insert a link to the GD Analyst page next to the
Box Score link. Also, insert a link to each team's Game Results page.
Also, insert a link to each team's Guess page for the current season.

*/

if (url === main_office_page || url === main_office_default_page || url === main_office_default_page_lower) {
    console.log('Found Main GD Office page. Trying to insert GD Analyst and Guess links. . .');
    const active_tid = getActiveTeamId();
    if (active_tid !== null) {
        insertLinksPreviousGame(active_tid);
    }
}

async function insertLinksPreviousGame(active_tid) { // Ensure this function is marked as async
    try {
        // Wait for getSeason to resolve
        const season = await getSeason(active_tid);

        // Find the previous opponent's team ID.
        const opp_tid = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('teamProfileLink')[1]
            .getAttribute('href')
            .match(/OpenTeamProfile\((\d{5})/)[1];
        if (!opp_tid) {
            console.error('No elements opponent team ID found.');
            return null;
        } else {
            console.log('Opponent Team ID: ', opp_tid);
        }

        // Find box score id.
        let bs_id = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .querySelectorAll("a.boxscoreLink")[0]
            .getAttribute('href').match(/OpenBoxscore\((\d{7,8})\)/)[1];
        if (!bs_id) {
            console.error('No previous game box score ID found.');
            return null;
        } else {
            console.log('Previous Game Box Score ID: ', bs_id);
        }

        // Find WISCast section
        // This should be a <td> element with class 'wisCastRow'
        const wis_section = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('wisCastRow')[0]
            .setAttribute('colSpan', '1'); // Change the colSpan attribute to 1
        
        const gdanalyst_team_schedule_page = getGDAnalystTeamSchedulePage(active_tid);
        let boxscoreurl = `${gdanalyst_team_schedule_page}/all?gameids=${bs_id}`;

        // Create a new <td> element after the WISCast section
        const newTd = document.createElement('td');
        newTd.setAttribute('colSpan', '1');
        newTd.setAttribute('style', 'text-align:center; display: flex; align-items: center; justify-content: center;');

        // Create <a> element
        const anchor = document.createElement('a');
        anchor.setAttribute('href', boxscoreurl);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('style', 'color:blue; display:flex; align-items:center; justify-content:center;');

        // Create <img> element
        const img = document.createElement('img');
        img.setAttribute('src', imageurl); // Ensure `imageurl` is defined and valid
        img.setAttribute('alt', 'Analyze');
        img.setAttribute('width', '20');
        img.setAttribute('height', '20');
        img.setAttribute('style', 'margin-right: 5px;'); // Adds a 5px right margin to the image

        // Append <img> to <a>
        anchor.appendChild(img);
        anchor.append(' Analyze'); // Add text next to the image

        // Append <a> to newTd
        newTd.appendChild(anchor);

        // Insert newTd into the document
        document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('wisCastRow')[0]
            .insertAdjacentElement('afterend', newTd);

        
    } catch (error) {
        console.error('Error inserting GD Analyst and Guess links:', error);
    }
}