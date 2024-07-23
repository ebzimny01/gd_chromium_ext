/*
The purpose of this script is to do the following:

For the previous game, insert a link to the GD Analyst page next to the 
WISCast link. Also, insert a link to the opponent's GD Analyst Game Results
page. Also, insert a link to the opponent's Guess page for the current season.

For the current game, insert a link to the GD Analyst page next to the
Box Score link. Also, insert a link to each team's Game Results page.
Also, insert a link to each team's Guess page for the current season.

*/

// Wrap the code block in an async function
async function initializeLinks() {
    if (url === main_office_page || url === main_office_default_page || url === main_office_default_page_lower) {
        console.log('Found Main GD Office page. Trying to insert GD Analyst and Guess links. . .');
        const active_tid = getActiveTeamId();
        const season = await getSeason(active_tid);
        // Check if the active team ID is found and the Last Game and Next Game sections are available.
        if (active_tid !== null && 
                document
                    .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox') &&
                (document
                    .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_noUpcomingGames') ||
                document
                    .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox'))) {
            insertLinksPreviousGame(active_tid, season).then(() => {
                insertLinksCurrentGame(active_tid, season);
            });            
        }
    }
}

async function insertLinksCurrentGame(active_tid, season) { // Ensure this function is marked as async
    try {
        // Step 1: Select the <div> with the className "standings"
        const nextGameDiv = document.getElementById('gd_helper_extension_nextGame');

        // Check for id ctl00_ctl00_ctl00_Main_Main_Main_NextGame_noUpcomingGames.
        // If no games found then do not need to include the home/away links.
        if (document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_noUpcomingGames')) {
            console.debug('No upcoming games found.');
        } else if (document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')) {
            console.debug('Found upcoming game.');
            
            // Find the current games home and away team IDs.
            const away_tid = document
                .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')
                .getElementsByClassName('teamProfileLink')[0]
                .getAttribute('href')
                .match(/OpenTeamProfile\((\d{5})/)[1];
            
            if (!away_tid) {
                console.debug('No current game away team ID found.');
            } else {
                console.log('Away Team ID: ', away_tid);
            }

            const home_tid = document
                .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')
                .getElementsByClassName('teamProfileLink')[1]
                .getAttribute('href')
                .match(/OpenTeamProfile\((\d{5})/)[1];
            
            if (!home_tid) {
                console.debug('No current game home team ID found.');
            } else {
                console.log('Home Team ID: ', home_tid);
            }

            // Find box score id.
            let bs_id = "";
            try {
                bs_id = document
                    .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')
                    .querySelectorAll("a.boxscoreLink")[0]
                    .getAttribute('href').match(/OpenBoxscore\((\d{7,8})\)/)[1];

                console.log('Current Game Box Score ID: ', bs_id);
            } catch (error) {
                console.debug('No Current Game box score ID found.');
                bs_id = "";
            }

            // Active team GD Analyst team schedule page
            const gdanalyst_active_team_schedule_page = getGDAnalystTeamSchedulePage(active_tid);
            const boxscoreurl = `${gdanalyst_active_team_schedule_page}/all?gameids=${bs_id}`;

            // Current Game away GD Analyst team schedule page and Guess page
            let gdanalyst_away_team_schedule_page = "";
            if (away_tid === active_tid) {
                gdanalyst_away_team_schedule_page = gdanalyst_active_team_schedule_page;
            } else {
                gdanalyst_away_team_schedule_page = getGDAnalystTeamSchedulePage(away_tid);
            }

            const away_guess_page = await buildGuessPageUrl(away_tid, season);

            const away_team_name = document
                .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')
                .getElementsByClassName('awaypreview')[0]
                .getElementsByTagName('a')[0]
                .textContent;

            // Current Game home GD Analyst team schedule page and Guess page
            let gdanalyst_home_team_schedule_page = "";
            if (home_tid === active_tid) {
                gdanalyst_home_team_schedule_page = gdanalyst_active_team_schedule_page;
            } else {
                gdanalyst_home_team_schedule_page = getGDAnalystTeamSchedulePage(home_tid);
            }
            
            const home_guess_page = await buildGuessPageUrl(home_tid, season);

            const home_team_name = document
                .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_NextGame_upcomingGameOverviewCtlContentBox')
                .getElementsByClassName('homepreview')[0]
                .getElementsByTagName('a')[0]
                .textContent;

            // If boxscore ID is found, create the boxscore structure
            let boxscoreStructure = "";
            if (bs_id !== "") {
                boxscoreStructure = `
                        <a href="${boxscoreurl}" target="_blank" title="Analyze using GDAnalyst" style="color:blue; display:flex; align-items:center; justify-content:center;">
                            <img src="${imageurl}" alt="Analyze" width="20" height="20" style="margin-right: 5px;">
                            Analyze Box Score
                        </a>`;
            } else {
                boxscoreStructure = '';
            }

            // Step 2: Define the new structure as an HTML string with added CSS for even column division
            const newNextGameTableStructure = `
                <table style="width: 100%; table-layout: fixed; border: 2px solid red; background: white">
                    <tbody>
                        <tr>
                            <td style="width: 33.33%;">
                                <a href="${gdanalyst_away_team_schedule_page}" target="_blank" title="GDAnalyst Schedule Page for ${away_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                    ${away_team_name} GDAnalyst
                                </a>
                            </td>
                            <td style="width: 33.33%;" rowspan="2">
                                ${boxscoreStructure}
                            </td>
                            <td style="width: 33.33%;">
                                <a href="${gdanalyst_home_team_schedule_page}" target="_blank" title="GDAnalyst Schedule Page for ${home_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                    ${home_team_name} GDAnalyst
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 33.33%;">
                                <a href="${away_guess_page}" target="_blank" title="GUESS page for ${away_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                    ${away_team_name} GUESS
                                </a>
                            </td>
                            <td style="width: 33.33%;">
                                <a href="${home_guess_page}" target="_blank" title="GUESS page for ${home_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                    ${home_team_name} GUESS
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;

            // Append the above structure as a child of the nextGameDiv
            nextGameDiv.innerHTML = newNextGameTableStructure;
        
        }        

        } catch (error) {
            console.debug('Could not insert Current Game GD Analyst and Guess links:', error);
        }
}

async function insertLinksPreviousGame(active_tid, season) { // Ensure this function is marked as async
    try {
        // Step 1: Select the <div> with the className "standings"
        const standingsDiv = document.querySelector('div.standings');

        // Find the previous opponent's team ID.
        const opp_tid = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('teamProfileLink')[1]
            .getAttribute('href')
            .match(/OpenTeamProfile\((\d{5})/)[1];
        if (!opp_tid) {
            console.debug('No elements opponent team ID found.');
        
        } else {
            console.log('Opponent Team ID: ', opp_tid);
        }

        // Find box score id.
        let bs_id = "";
            try {
                bs_id = document
                    .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
                    .querySelectorAll("a.boxscoreLink")[0]
                    .getAttribute('href').match(/OpenBoxscore\((\d{7,8})\)/)[1];
                
                console.debug('Previous Game Box Score ID: ', bs_id);
            } catch (error) {
                console.debug('No Previous Game box score ID found.');
                bs_id = "";
            }
        
        // Find WISCast section
        // This should be a <td> element with class 'wisCastRow'
        document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('wisCastRow')[0]
            .setAttribute('colSpan', '1'); // Change the colSpan attribute to 1
        
        const gdanalyst_team_schedule_page = getGDAnalystTeamSchedulePage(active_tid);
        const boxscoreurl = `${gdanalyst_team_schedule_page}/all?gameids=${bs_id}`;

        // Create a new <td> element after the WISCast section
        const newTd = document.createElement('td');
        newTd.setAttribute('colSpan', '1');
        newTd.setAttribute('style', 'text-align:center; display: flex; align-items: center; justify-content: center;');

        // Create <a> element
        const anchor = document.createElement('a');
        anchor.setAttribute('href', boxscoreurl);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('style', 'color:blue; display:flex; align-items:center; justify-content:center;');
        anchor.setAttribute('title', 'Analyze using GDAnalyst');

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

        const prior_opp_team_name = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('teamProfileLink')[1]
            .textContent;

        const prior_opp_tid = document
            .getElementById('ctl00_ctl00_ctl00_Main_Main_Main_LastGame_contentBox')
            .getElementsByClassName('teamProfileLink')[1]
            .getAttribute('href')
            .match(/OpenTeamProfile\((\d{5})/)[1];

        const gdanalyst_opp_team_schedule_page = getGDAnalystTeamSchedulePage(prior_opp_tid);
        const opp_guess_page = await buildGuessPageUrl(prior_opp_tid, season);

        const newStructure = `
            <div id="gd_helper_extension_insert_links">
                <div class="lastGame">
                    <table style="width: 100%; table-layout: fixed; margin-top: 5px; border: 2px solid red; background: white">
                        <tbody>
                            <tr>
                                <td>
                                    <a href="${gdanalyst_opp_team_schedule_page}" target="_blank" title="GDAnalyst Schedule Page for ${prior_opp_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                            ${prior_opp_team_name} GDAnalyst
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <a href="${opp_guess_page}" target="_blank" title="GUESS page for ${prior_opp_team_name}" style="color:blue; display:flex; align-items:center; justify-content:center;">
                                            ${prior_opp_team_name} GUESS
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="nextGame" id="gd_helper_extension_nextGame">

                </div>
            </div>`;

        standingsDiv.insertAdjacentHTML('beforebegin', newStructure);
        
    } catch (error) {
        console.debug('Could not insert Previous Game GD Analyst and Guess links:', error);
    }
}

// Call the async function
initializeLinks().catch(console.error);