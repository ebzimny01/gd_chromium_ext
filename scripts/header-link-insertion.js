/*
The goal for this script is to insert GD Analyst and Guess links into the header
of each GD page next to the coach name.
*/

if (url.startsWith(general_gd_page) && !url.includes('RecruitProfile')) {
    console.log('Found General GD page. Trying to insert GD Analyst and Guess links. . .');
    const active_tid = getActiveTeamId();
    if (active_tid !== null) {
        insertHyperlinks(active_tid);
    }
}

async function insertHyperlinks(active_tid) { // Ensure this function is marked as async
    try {
        // Wait for getSeason to resolve
        const season = await getSeason(active_tid);
        // Create the GDAnalyst team schedule page URL.
        const gdanalyst_team_schedule_page = getGDAnalystTeamSchedulePage(active_tid);

        // Get DOM class element teamInfoBar.
        const teamInfoBar = document.getElementsByClassName('teamInfoBar');

        // This DOM element contains 4 child <p> elements.
        // I want to insert a new <p> element after the 3rd child <p> element.
        const newP = document.createElement('p');
        newP.setAttribute('style', 'text-align:center');
        let html_to_insert = parser.parseFromString(`<a href="${gdanalyst_team_schedule_page}" title="GDAnalyst Schedule Page" target="_blank" style="color:blue">GDAnalyst</a>`, "text/html");
        newP.appendChild(html_to_insert.body.firstChild);
        teamInfoBar[0].insertAdjacentElement('beforeend', newP);
        const newP2 = document.createElement('p');
        
        // Wait for buildGuessPageUrl to resolve
        const g_page = await buildGuessPageUrl(active_tid, season);
        console.log('g_page:', g_page);

        console.log('Guess URL:', g_page);
        html_to_insert = parser.parseFromString(`<a href="${g_page}" title="GUESS Page"target="_blank" style="color:blue">GUESS</a>`, "text/html");
        newP2.appendChild(html_to_insert.body.firstChild);
        teamInfoBar[0].insertAdjacentElement('beforeend', newP2);
        
    } catch (error) {
        console.error('Error inserting GD Analyst and Guess links:', error);
    }
}