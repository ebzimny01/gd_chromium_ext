// This script is a common utility script that can be used across multiple scripts.
// As long as the other scripts are loaded after this script, they can use the
// functions and variables defined here.

let url = window.location.href;
const imagefile = 'images/plus-icon.png';
const imageurl = chrome.runtime.getURL(imagefile);

const general_gd_page = 'https://www.whatifsports.com/gd/';
const main_schedule_page = 'https://www.whatifsports.com/gd/schedule';
const teamId_schedule_page = 'https://www.whatifsports.com/gd/TeamProfile/Schedule.aspx?tid=';
const teamId_gamelog_page = 'https://www.whatifsports.com/gd/TeamProfile/GameLog.aspx?tid=';
const main_office_page = 'https://www.whatifsports.com/gd/office/';
const main_office_default_page = 'https://www.whatifsports.com/gd/Office/Default.aspx';
const main_office_default_page_lower = 'https://www.whatifsports.com/gd/office/default.aspx';
const gameplan_offense_page = 'https://www.whatifsports.com/gd/Coaching/OGamePlans.aspx';
const gameplan_defense_page = 'https://www.whatifsports.com/gd/Coaching/DGamePlans.aspx';
const gameplan_specialteams_page = 'https://www.whatifsports.com/gd/Coaching/SGamePlans.aspx';

// Get the active teamId
const parser = new DOMParser();

// Build the GUESS page URL.
async function buildGuessPageUrl(active_tid, season) {
    try {
      const school_data = await fetchSchoolsAndLookup(active_tid);
      const world = school_data['world'];
      const world_upper = world.toUpperCase();
      const division = school_data['division'];
      const guess_page = `https://thenextguess.com/${world_upper}/${season}/${division}/team/${active_tid}`;
      console.log('Guess Page: ', guess_page);
      return guess_page;
    } catch (error) {
      console.error('Error building the guess page URL:', error);
    }
  }

// Modify the fetching of schools to be inside an async function
async function fetchSchoolsAndLookup(tid) {
    // Get schools.json file
    const filePath = 'data/schools.json';
    const fileURL = chrome.runtime.getURL(filePath);

    try {
      const response = await fetch(fileURL); // Wait for the fetch to complete
      const data = await response.json(); // Wait for the JSON conversion to complete
      // console.log(data); // Log the fetched data
  
      // Now that data is available, you can proceed with dependent operations
      // Lookup the teamId in the fetched schools data
      const school_data = data[tid]; // Adjust the condition as necessary
      console.log('School Data: ', school_data);
      return school_data;
    } catch (error) {
      console.error('Error fetching the file:', error);
    }
  }
  
async function getSeason(tid) {
    const page = `https://www.whatifsports.com/gd/TeamProfile/History.aspx?tid=${tid}`;
    try {
        const response = await fetch(page); // Wait for the fetch to complete
        const text = await response.text(); // Get the response text
        const seasonParser = new DOMParser();
        const doc = seasonParser.parseFromString(text, 'text/html'); // Parse the text as HTML
        const d0 = doc.getElementsByClassName('teamHistoryCtl')[1]; // Get the second element with class teamHistoryCtl
        const row = d0.getElementsByTagName('tr')[1]; // Get the second row
        const season = row.getElementsByClassName('season')[0].textContent; // Corrected to access the first element's textContent
        console.log('Season: ', season);
        return season;
      } catch (error) {
        console.error('Error fetching the page:', error);
      }
    }

function getActiveTeamId() {
    const d0 = document.getElementsByClassName('teamInfoSec');
    if (d0.length === 0) {
        console.error('No elements with class teamInfoSec found.');
        return null;
    }
    const anchors = d0[0].getElementsByTagName('a');
    if (anchors.length === 0) {
        console.error('No anchor tags found within teamInfoSec element.');
        return null;
    }
    const href = anchors[0].getAttribute('href');
    const match = href.match(/OpenTeamProfile\((\d{5})/);
    if (!match) {
        console.error('No matching team ID found in href.');
        return null;
    }
    const tid = match[1];
    console.log('Active Team ID: ', tid);
    return tid;
};


function getGDAnalystTeamSchedulePage(tid) {
    const gdanalyst_team_schedule_page = `https://gdanalyst.herokuapp.com/${tid}/schedule`;
    console.log('GD Analyst Team Schedule Page: ', gdanalyst_team_schedule_page);
    return gdanalyst_team_schedule_page;
}

// Build the GUESS page URL.
async function buildGuessPageUrl(active_tid, season) {
    try {
      const school_data = await fetchSchoolsAndLookup(active_tid);
      const world = school_data['world'];
      const world_upper = world.toUpperCase();
      const division = school_data['division'];
      const guess_page = `https://thenextguess.com/${world_upper}/${season}/${division}/team/${active_tid}`;
      console.log('Guess Page: ', guess_page);
      return guess_page;
    } catch (error) {
      console.error('Error building the guess page URL:', error);
    }
  }