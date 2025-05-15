const recruiting_search_url = 'https://www.whatifsports.com/gd/recruiting/Search.aspx';
const recruit_page_url = 'https://www.whatifsports.com/gd/RecruitProfile/';
// const parser = new DOMParser();

// Wrapping the code in an async IIFE (Immediately Invoked Function Expression)
(async function initialize() {
    // Fetch the active school ID from the page
    const active_school_id = document.getElementById('pagetid')['value'];

    // Fetch school data using the active school ID
    const schoolData = await get_school_data(active_school_id);
    const world = schoolData['world'];
    const division = schoolData['division'];

    // Construct the map URL prefix using the world and division
    const map_url_prefix = `https://www.thenextguess.com/gdanalyst/${world}/${division}/mapLocation?town=`;

    // Locate the parent div for further DOM manipulation
    let parentDiv = document.getElementById('Anthem_ctl00_ctl00_ctl00_Main_Main_Main_apIcons__'); 

    // Check if the current URL matches the recruiting search page
    if (url.includes(recruiting_search_url)) {
        // Recruiting Search page logic
        let gv = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divGeneral');
        let rv = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divRatings'); 
        
        if (gv) {
            console.debug('Found General View');
            updateGeneralView(gv, parentDiv, map_url_prefix, active_school_id); // Pass active_school_id here
        } else if (rv) {
            console.debug('Found Rating View');
            updateRatingsView(rv, parentDiv);
        } else {
            console.debug('No view found');
        }
    } else if (url.startsWith(recruit_page_url)) {
        // Recruit Page logic
        console.debug('Found a Recruit Profile Page');
        try {
            const section = document.getElementById('ctl00_ctl00_ctl00_Main_Main_homeTown');
            let hometown = section.textContent;
            console.debug(`Recruit's hometown is ${hometown}`);
            let map_url_full = map_url_prefix + hometown;
            section.innerHTML = '';
            let html_to_insert = parser.parseFromString(`<a href="${map_url_full}" style="color: yellow" target="_blank">+${hometown}</a>`, "text/html");
            section.appendChild(html_to_insert.body.firstChild);
        } catch (err) {
            console.debug(err);
            console.debug('Error finding hometown on Recruit Page.');
        }
    } else {
        console.debug('Page is not recognized as having any Hometown information to update.');
    }
})();

/** This function should be called to update the page when the General View is
 * used on the Recruiting Search page. This function gets the table element
 * first. It then determines which column contains the 'Hometown' data. This is
 * necessary because the 'Hometown' column changes depending on the search
 * criteria selected. It then calls a function to parse all the table rows
 * and add map link for each hometown. It then calls a function to parse all the
 * table rows to alter background color for certain rows. Finally, it calls a
 * an 'observer' function to monitor the page for changes.
 */
function updateGeneralView(v, parentDiv, map_url_prefix, active_school_id) { // Accept active_school_id as a parameter
  try {
    const table_section = v.getElementsByTagName('tbody');
    let t = table_section[0];
    // Determine if hometown column exits and which col number
    let hometown_exists = htowncol(t);
    if (hometown_exists !== null){
      // Parses all rows of recruit search table and adds GD link to hometown
      addMapLinks(t, hometown_exists, map_url_prefix); // Pass map_url_prefix here
      console.debug('Updated Hometowns with URL links.')
      highlightRows(t, active_school_id); // Pass active_school_id here
    } else {
      console.debug('Hometown column does not exist.')
    }
  } catch (err) {
    console.debug(err);
    console.debug('Recruiting search page is empty so unable to add map URLs.')
  }
  // After updating page links, start observer to look for updates
  createObserver(parentDiv, 'gv', map_url_prefix, active_school_id);
}

/** This function should be called to update the page when the Ratings View is 
 * used on the Recruiting Search page. This function gets the table element
 * first. There is no 'Hometown' in this view. It only calls a function to parse
 * all table rows to alter the background color for certain rows. Finally, it
 * calls an 'observer' to monitor the page for changes.
 */
function updateRatingsView(v, parentDiv) { // Accept parentDiv as a parameter
  try {
    const table_section = v.getElementsByTagName('tbody');
    let t = table_section[0];
    highlightRows(t);
  } catch (err) {
    console.debug(err);
  }
  // After updating page links, start observer to look for updates
  createObserver(parentDiv, 'rv');
}

/** This 'observer' function is needed in order to monitor for mutations made to
 * the DOM. Certain user actions taken on the page will result in a portion of
 * the page getting 'refreshed'. Certain div is removed and added back without
 * reloading the page which then clears the updates made by this extension. This
 * 'observer' will detect a change was made and call the appropriate update
 * function again. * 
 */
function createObserver(p, x, map_url_prefix, active_school_id) {
  console.debug('Starting observer...');
  console.debug(p);
  
  /* Use this for debugging observer
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length) {
        console.debug('Added', mutation.addedNodes[0])
      }
      if (mutation.removedNodes.length) {
        console.debug('Removed', mutation.removedNodes[0])
      }})});
  */

  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.addedNodes.length) {
        console.debug('Added', mutation.addedNodes[0]);
        if (x === 'gv') {
          // Get the updated General View div
          let g = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divGeneral');
          if (g) {
            observer.disconnect(); // Disconnect to avoid infinite loops
            console.debug('Observer disconnecting and updating General View...');
            updateGeneralView(g, p, map_url_prefix, active_school_id); // Re-apply logic
          }
        } else if (x === 'rv') {
          // Get the updated Ratings View div
          let r = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divRatings');
          if (r) {
            observer.disconnect(); // Disconnect to avoid infinite loops
            console.debug('Observer disconnecting and updating Ratings View...');
            updateRatingsView(r, p);
          }
        }
      }
    }
  });

  observer.observe(p, {
    attributes: true,
    childList: true,
    subtree: true,
  });
}

/** Establishes the column number for 'Hometown' by searching 1st row of table.
 * Returns null if hometown not found.
 * Returns column # of hometown found.
 */
function htowncol (t) {
  let h = null
  for (let c = 0; c < t.rows[0].cells.length; c++) {
    if (t.rows[0].cells[c].textContent==="Hometown") {
      h = c; 
      console.debug(`Hometown is column number ${h}`);
    } else {
      console.debug('Could not find Hometown column number.');
    }
  }
  return h;
}

/** This function accepts the table passed to it as well as the column number
 * that contains 'Hometown' data. The functions iterates through each table row
 * (skipping the header row which is index 0). It then formulates a URL that
 * points to GDAnalyst website town mapping feature, and then applies this URL
 * as an HREF link to the hometown.
 */
function addMapLinks(t, h, map_url_prefix) { // Accept map_url_prefix as a parameter
  for (let r = 1; r < t.rows.length; r++) {
    let cell = t.rows[r].cells[h].innerHTML;
    if (cell != "Hometown") { // Skips over the table header rows
      console.debug('Row:', r, 'Hometown:', cell);
      
      // Remove the space between "city," and "ST" for the URL
      let sanitizedCell = cell.replace(/, /, ',');
      let map_url_full = map_url_prefix + sanitizedCell;

      console.debug('Map URL:', map_url_full);
      t.rows[r].cells[h].innerHTML = '';
      let html_to_insert = parser.parseFromString(`<a href="${map_url_full}" target="_blank">+${cell}</a>`, "text/html");
      t.rows[r].cells[h].appendChild(html_to_insert.body.firstChild).setAttribute('style', 'background-color: transparent');
      console.debug('Final HTML update:', t.rows[r].cells[h].innerHTML);
    }
  }
}

/** This function accepts the table passed to it as input. The function is doing
 * two things. It is find all rows (recruits) that are being 'watched' and
 * highlights the backgroun of this row 'BLUE'. It then searches each table row
 * for the teamId. If it finds the teamId, this means the recruit is considering
 * signing with this team. It then determines if the recruit is considering this
 * teamId alone or is considering this teamId along with other schools. If 
 * 'alone' then it changes background color to 'GREEN'. If 'others' then it
 * changes backgroun color to 'YELLOW'.
 */
function highlightRows (t, active_school_id) { // Accept active_school_id as a parameter
  const id_search_pattern = `javascript:OpenTeamProfile(${active_school_id},0)`;
  const r = t.querySelectorAll('tr'); // get all rows from table
  for (let index = 0; index < r.length; index++) {
    // If recruit is being Watched then highlight background color light blue
    if (r[index].getElementsByClassName('ContactedRecruit').length !== 0) {
      console.debug(`Row ${index} is a Watched Recruit`);
      r[index].setAttribute('style', 'background-color:lightblue');
    };
    // Find recruit rows that have the current school Id in considering field
    // If considering school + other schooles then highlight yellow
    // If consider school alone then highlight light green
    if (r[index].innerHTML.includes(id_search_pattern)) {
      console.debug('TeamId found',active_school_id, `Row ${index}`);
      if (r[index].querySelectorAll("a[href^='javascript:OpenTeamProfile(']").length !== 1) {
        // battle shows yellow background
        console.debug('Recruiting battle', true,'Setting background to yellow')
        r[index].setAttribute('style', 'background-color:yellow');
      } else {
        // no battle shows green
        console.debug('Recruiting battle', false, 'setting background to green')
        r[index].setAttribute('style', 'background-color:lightgreen');
      }
    }
  };
}



/** This function fetches the JSON data array for every school in WhatIfSports
 * Gridiron Dynasty from the schools.json file. It is indexed by the teamId.
 * The teamId is used to find the correct world and division.
 */
async function get_school_data(wisid) {
  const filePath = 'data/schools.json'; // Path to the schools.json file
  const fileURL = chrome.runtime.getURL(filePath);

  try {
      const response = await fetch(fileURL); // Fetch the JSON file
      if (!response.ok) {
          throw new Error(`Failed to fetch schools.json: ${response.statusText}`);
      }
      const data = await response.json(); // Parse the JSON data
      console.log('Fetched school data.');
      // Lookup the teamId in the fetched schools data
      const school_data = data[wisid]; // Adjust the condition as necessary
      if (!school_data) {
          throw new Error(`No data found for teamId: ${wisid}`);
      }
      console.log('School Data: ', school_data);
      return school_data; // Return the school data
  } catch (error) {
      console.error('Error fetching school data:', error);
      return {}; // Return an empty object in case of an error
  }
}