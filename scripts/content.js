const url = getCurrentURL()
const recruiting_search_url = 'https://www.whatifsports.com/gd/recruiting/Search.aspx';
const recruit_page_url = 'https://www.whatifsports.com/gd/RecruitProfile/Ratings.aspx';
const parser = new DOMParser();
const schools = get_school_data();
const active_school_id = document.getElementById('pagetid')['value'];
// const re = new RegExp('javascript:OpenTeamProfile\(\d{5},0\);');
const world = schools[active_school_id]['world'];
const division = schools[active_school_id]['division'];
const map_url_prefix = `https://gdanalyst.herokuapp.com/world/${world}/${division}/town?town=`;
if (url.includes(recruiting_search_url)) {
  // This section is for Recruiting Search page
  const parentDiv = document.getElementById('Anthem_ctl00_ctl00_ctl00_Main_Main_Main_apIcons__'); // get the parent element that we will observe for changes
  const gv = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divGeneral'); // get table from General View
  const rv = document.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divRatings'); // get table from Rating View
  
  // First add map links for hometowns only for General View
  if (gv) {
    console.log('Found General View');
    updateGeneralView(gv);
    //! This observer part is not working correctly.
    createObserver(gv);
  } else if (rv) {
    console.log('Found Rating View');
    updateRatingsView(rv);
    //! This observer part is not working correctly.
    createObserver(rv);
  } else {
    console.log('No view found');
  }
  
} else if (url.includes(recruit_page_url)) {
    // This section is for the Recruit Page
    try {
      const section = document.getElementById('ctl00_ctl00_ctl00_Main_Main_homeTown');
      let hometown = section.textContent;
      console.log(`Recruit's hometown is ${hometown}`);
      let map_url_full = map_url_prefix + hometown;
      section.innerHTML = '';
      let html_to_insert = parser.parseFromString(`<a href="${map_url_full}" style="color: yellow" target="_blank">+${hometown}</a>`, "text/html");
      section.appendChild(html_to_insert.body.firstChild);
    } catch (err) {
      console.log(err);
      console.log('Error finding hometown on Recruit Page.')
    }
} else {
    console.log('Page is not recognized as having any Hometown information to update.')
}


function updateGeneralView(v) {
  try {
    const table_section = v.getElementsByTagName('tbody');
    let t = table_section[0];
    // determine if hometown column exits and which col number
    let hometown_exists = htowncol(t);
    if (hometown_exists !== null){
      // Parses all rows of recruit search table and adds GD link to hometown
      addMapLinks(t, hometown_exists);
      console.log('Updated Hometowns with URL links.')
      highlightRows(t);
    } else {
      console.log('Hometown column does not exist.')
    }
  } catch (err) {
    console.log(err);
    console.log('Recruiting search page is empty so unable to add map URLs.')
  }
}


function updateRatingsView(v) {
  try {
    const table_section = v.getElementsByTagName('tbody');
    let t = table_section[0];
    highlightRows(t);
  } catch (err) {
    console.log(err);
  }
}

function createObserver(target) {
  console.log('Starting observer...');
  //const target = document.querySelector('Anthem_ctl00_ctl00_ctl00_Main_Main_Main_apIcons__');
  console.log(target);
  const observer = new MutationObserver((mutationsList, observer) => {
    for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('A child node has been added or removed.');
            const gv = target.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divGeneral'); // get table from General View
            const rv = target.getElementById('ctl00_ctl00_ctl00_Main_Main_Main_divRatings'); // get table from Rating View
            if (target === gv) {
              console.log('Observer updating General View...');
              updateGeneralView(target);
            } else if (target === rv) {
              console.log('Observer updating Ratings View...');
              updateRatingsView(target);
            } else {
              console.log('Observer failed to find anything to update!');
            }
            //const nodes = mutation.addedNodes;
            //nodes.forEach(node => {
            //    console.log(node);
            //});
        } else {
          console.log('No mutation type found!')
        }
    }
  });
  observer.observe(target, { 
      attributes: true, 
      childList: true, 
      subtree: true }
  );
}

// establishes the column number for 'Hometown' by searching 1st row of table
// returns null if hometown not found
// returns column # of hometown found
function htowncol (t) {
  let h = null
  for (let c = 0; c < t.rows[0].cells.length; c++) {
    if (t.rows[0].cells[c].textContent==="Hometown") {
      h = c; 
      console.log(`Hometown is column number ${h}`);
    } else {
      console.log('Could not find Hometown column number.');
    }
  }
  return h;
}


function addMapLinks (t,h) {
  for (let r = 1; r < t.rows.length; r++) {
    let cell = t.rows[r].cells[h].innerHTML;
    if (cell!="Hometown"){ // Skips over the table header rows
      // console.log(cell);
      let map_url_full = map_url_prefix + cell;
      // console.log(map_url_full);
      t.rows[r].cells[h].innerHTML = '';
      let html_to_insert = parser.parseFromString(`<a href="${map_url_full}"target="_blank">+${cell}</a>`, "text/html");
      t.rows[r].cells[h].appendChild(html_to_insert.body.firstChild).setAttribute('style','background-color: transparent');
      // console.log(t.rows[r].cells[h].innerHTML);
    }
  }
}


function highlightRows (t) {
  const id_search_pattern = `javascript:OpenTeamProfile(${active_school_id},0)`;
  const r = t.querySelectorAll('tr'); // get all rows from table
  for (let index = 0; index < r.length; index++) {
    // If recruit is being Watched then highlight background color light blue
    if (r[index].getElementsByClassName('ContactedRecruit').length !== 0) {
      console.log(`Row ${index} is a Watched Recruit`);
      r[index].setAttribute('style', 'background-color:lightblue');
    };
    // Find recruit rows that have the current school Id in considering field
    // If considering school + other schooles then highlight yellow
    // If consider school alone then highlight light green
    if (r[index].innerHTML.includes(id_search_pattern)) {
      console.log('TeamId found',active_school_id, `Row ${index}`);
      if (r[index].querySelectorAll("a[href^='javascript:OpenTeamProfile(']").length !== 1) {
        // battle shows yellow background
        console.log('Recruiting battle', true,'Setting background to yellow')
        r[index].setAttribute('style', 'background-color:yellow');
      } else {
        // no battle shows green
        console.log('Recruiting battle', false, 'setting background to green')
        r[index].setAttribute('style', 'background-color:lightgreen');
      }
    }
  };
}

function getCurrentURL () {
  return window.location.href
}


function get_school_data() {
  const a = {
    "49048": {
      "school_short": "Alabama A&M",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49050": {
      "school_short": "Alcorn State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49486": {
      "school_short": "American International",
      "world": "rockne",
      "division": "D-II"
    },
    "49267": {
      "school_short": "Averett",
      "world": "rockne",
      "division": "D-III"
    },
    "49559": {
      "school_short": "Bethel",
      "world": "rockne",
      "division": "D-III"
    },
    "49214": {
      "school_short": "Bowdoin",
      "world": "rockne",
      "division": "D-III"
    },
    "49097": {
      "school_short": "Augustana",
      "world": "rockne",
      "division": "D-II"
    },
    "49147": {
      "school_short": "Aurora",
      "world": "rockne",
      "division": "D-III"
    },
    "49385": {
      "school_short": "Ball State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49172": {
      "school_short": "Baylor",
      "world": "rockne",
      "division": "D-IA"
    },
    "49418": {
      "school_short": "Bethune-Cookman",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49023": {
      "school_short": "Brown",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49031": {
      "school_short": "Bucknell",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49183": {
      "school_short": "Buena Vista",
      "world": "rockne",
      "division": "D-III"
    },
    "49225": {
      "school_short": "Buffalo",
      "world": "rockne",
      "division": "D-III"
    },
    "53105": {
      "school_short": "Ripon",
      "world": "warner",
      "division": "D-III"
    },
    "48986": {
      "school_short": "Arkansas State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49558": {
      "school_short": "Augsburg",
      "world": "rockne",
      "division": "D-III"
    },
    "49381": {
      "school_short": "Bowling Green",
      "world": "rockne",
      "division": "D-IA"
    },
    "49401": {
      "school_short": "Butler",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49477": {
      "school_short": "Albany State",
      "world": "rockne",
      "division": "D-II"
    },
    "49478": {
      "school_short": "Benedict",
      "world": "rockne",
      "division": "D-II"
    },
    "49534": {
      "school_short": "Capital",
      "world": "rockne",
      "division": "D-III"
    },
    "49564": {
      "school_short": "Carleton",
      "world": "rockne",
      "division": "D-III"
    },
    "49552": {
      "school_short": "Carroll",
      "world": "rockne",
      "division": "D-III"
    },
    "48961": {
      "school_short": "Central Michigan",
      "world": "rockne",
      "division": "D-IA"
    },
    "49255": {
      "school_short": "Centre",
      "world": "rockne",
      "division": "D-III"
    },
    "49295": {
      "school_short": "Clark Atlanta",
      "world": "rockne",
      "division": "D-II"
    },
    "49035": {
      "school_short": "Coastal Carolina",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49032": {
      "school_short": "Colgate",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49459": {
      "school_short": "Adams State",
      "world": "rockne",
      "division": "D-II"
    },
    "49122": {
      "school_short": "Chadron State",
      "world": "rockne",
      "division": "D-II"
    },
    "48999": {
      "school_short": "Boise State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49231": {
      "school_short": "Allegheny",
      "world": "rockne",
      "division": "D-III"
    },
    "49110": {
      "school_short": "Bloomsburg",
      "world": "rockne",
      "division": "D-II"
    },
    "49492": {
      "school_short": "Assumption",
      "world": "rockne",
      "division": "D-II"
    },
    "49532": {
      "school_short": "Blackburn",
      "world": "rockne",
      "division": "D-III"
    },
    "49049": {
      "school_short": "Alabama State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49487": {
      "school_short": "Bentley",
      "world": "rockne",
      "division": "D-II"
    },
    "49197": {
      "school_short": "Alma",
      "world": "rockne",
      "division": "D-III"
    },
    "49213": {
      "school_short": "Bates",
      "world": "rockne",
      "division": "D-III"
    },
    "49201": {
      "school_short": "Bridgewater State",
      "world": "rockne",
      "division": "D-III"
    },
    "49251": {
      "school_short": "Bluffton",
      "world": "rockne",
      "division": "D-III"
    },
    "49208": {
      "school_short": "Colby",
      "world": "rockne",
      "division": "D-III"
    },
    "49407": {
      "school_short": "Austin Peay",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48980": {
      "school_short": "Auburn",
      "world": "rockne",
      "division": "D-IA"
    },
    "49543": {
      "school_short": "Mount St. Joseph",
      "world": "rockne",
      "division": "D-III"
    },
    "49024": {
      "school_short": "Columbia",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49496": {
      "school_short": "Concord",
      "world": "rockne",
      "division": "D-II"
    },
    "49305": {
      "school_short": "McMurry",
      "world": "rockne",
      "division": "D-III"
    },
    "49149": {
      "school_short": "Clemson",
      "world": "rockne",
      "division": "D-IA"
    },
    "49117": {
      "school_short": "Clarion",
      "world": "rockne",
      "division": "D-II"
    },
    "48968": {
      "school_short": "Arizona State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49324": {
      "school_short": "Albright",
      "world": "rockne",
      "division": "D-III"
    },
    "49034": {
      "school_short": "Charleston Southern",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49036": {
      "school_short": "Appalachian State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49312": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "rockne",
      "division": "D-III"
    },
    "49250": {
      "school_short": "Anderson",
      "world": "rockne",
      "division": "D-III"
    },
    "49004": {
      "school_short": "Fresno State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49226": {
      "school_short": "Chapman",
      "world": "rockne",
      "division": "D-III"
    },
    "49498": {
      "school_short": "Bemidji State",
      "world": "rockne",
      "division": "D-II"
    },
    "49207": {
      "school_short": "Amherst",
      "world": "rockne",
      "division": "D-III"
    },
    "48967": {
      "school_short": "BYU",
      "world": "rockne",
      "division": "D-IA"
    },
    "49196": {
      "school_short": "Albion",
      "world": "rockne",
      "division": "D-III"
    },
    "49160": {
      "school_short": "Boston",
      "world": "rockne",
      "division": "D-IA"
    },
    "49307": {
      "school_short": "Austin",
      "world": "rockne",
      "division": "D-III"
    },
    "49311": {
      "school_short": "California Lutheran",
      "world": "rockne",
      "division": "D-III"
    },
    "49482": {
      "school_short": "Central Washington",
      "world": "rockne",
      "division": "D-II"
    },
    "49488": {
      "school_short": "Bryant",
      "world": "rockne",
      "division": "D-II"
    },
    "49181": {
      "school_short": "Augustana (IL)",
      "world": "rockne",
      "division": "D-III"
    },
    "49142": {
      "school_short": "Alfred",
      "world": "rockne",
      "division": "D-III"
    },
    "49545": {
      "school_short": "Bridgewater",
      "world": "rockne",
      "division": "D-III"
    },
    "49096": {
      "school_short": "Cheyney",
      "world": "rockne",
      "division": "D-II"
    },
    "49061": {
      "school_short": "Arkansas Tech",
      "world": "rockne",
      "division": "D-II"
    },
    "49336": {
      "school_short": "Beloit",
      "world": "rockne",
      "division": "D-III"
    },
    "49177": {
      "school_short": "Benedictine",
      "world": "rockne",
      "division": "D-III"
    },
    "49195": {
      "school_short": "Adrian",
      "world": "rockne",
      "division": "D-III"
    },
    "49148": {
      "school_short": "Concordia (WI)",
      "world": "rockne",
      "division": "D-III"
    },
    "49104": {
      "school_short": "Concordia",
      "world": "rockne",
      "division": "D-II"
    },
    "49570": {
      "school_short": "Curry",
      "world": "rockne",
      "division": "D-III"
    },
    "49414": {
      "school_short": "Delaware State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49325": {
      "school_short": "Delaware Valley",
      "world": "rockne",
      "division": "D-III"
    },
    "49256": {
      "school_short": "DePauw",
      "world": "rockne",
      "division": "D-III"
    },
    "49402": {
      "school_short": "Drake",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49238": {
      "school_short": "Earlham",
      "world": "rockne",
      "division": "D-III"
    },
    "49073": {
      "school_short": "East Central",
      "world": "rockne",
      "division": "D-II"
    },
    "49111": {
      "school_short": "East Stroudsburg",
      "world": "rockne",
      "division": "D-II"
    },
    "49184": {
      "school_short": "Central",
      "world": "rockne",
      "division": "D-III"
    },
    "49189": {
      "school_short": "Coe",
      "world": "rockne",
      "division": "D-III"
    },
    "49067": {
      "school_short": "Delta State",
      "world": "rockne",
      "division": "D-II"
    },
    "49465": {
      "school_short": "Carson-Newman",
      "world": "rockne",
      "division": "D-II"
    },
    "49290": {
      "school_short": "Carthage",
      "world": "rockne",
      "division": "D-III"
    },
    "49430": {
      "school_short": "Central Connecticut",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49237": {
      "school_short": "Denison",
      "world": "rockne",
      "division": "D-III"
    },
    "49411": {
      "school_short": "Fordham",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49548": {
      "school_short": "Guilford",
      "world": "rockne",
      "division": "D-III"
    },
    "49118": {
      "school_short": "Edinboro",
      "world": "rockne",
      "division": "D-II"
    },
    "49330": {
      "school_short": "Fairleigh Dickinson",
      "world": "rockne",
      "division": "D-III"
    },
    "49497": {
      "school_short": "Fairmont State",
      "world": "rockne",
      "division": "D-II"
    },
    "49460": {
      "school_short": "Fort Lewis",
      "world": "rockne",
      "division": "D-II"
    },
    "49291": {
      "school_short": "Fort Valley State",
      "world": "rockne",
      "division": "D-II"
    },
    "49217": {
      "school_short": "Framingham State",
      "world": "rockne",
      "division": "D-III"
    },
    "49252": {
      "school_short": "Franklin",
      "world": "rockne",
      "division": "D-III"
    },
    "49528": {
      "school_short": "Frostburg State",
      "world": "rockne",
      "division": "D-III"
    },
    "49037": {
      "school_short": "Furman",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49053": {
      "school_short": "Gardner-Webb",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49151": {
      "school_short": "Georgia Tech",
      "world": "rockne",
      "division": "D-IA"
    },
    "49473": {
      "school_short": "Glenville",
      "world": "rockne",
      "division": "D-II"
    },
    "49054": {
      "school_short": "Grambling State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49174": {
      "school_short": "Greenville",
      "world": "rockne",
      "division": "D-III"
    },
    "49568": {
      "school_short": "Grove City",
      "world": "rockne",
      "division": "D-III"
    },
    "49527": {
      "school_short": "Eastern Oregon",
      "world": "rockne",
      "division": "D-III"
    },
    "49081": {
      "school_short": "Eastern New Mexico",
      "world": "rockne",
      "division": "D-II"
    },
    "49029": {
      "school_short": "Cornell",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49507": {
      "school_short": "Elizabeth City",
      "world": "rockne",
      "division": "D-II"
    },
    "49273": {
      "school_short": "Chowan",
      "world": "rockne",
      "division": "D-III"
    },
    "49086": {
      "school_short": "Emporia State",
      "world": "rockne",
      "division": "D-II"
    },
    "49408": {
      "school_short": "Davidson",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49560": {
      "school_short": "Concordia",
      "world": "rockne",
      "division": "D-III"
    },
    "49544": {
      "school_short": "Defiance",
      "world": "rockne",
      "division": "D-III"
    },
    "49313": {
      "school_short": "Dickinson",
      "world": "rockne",
      "division": "D-III"
    },
    "49062": {
      "school_short": "Harding",
      "world": "rockne",
      "division": "D-II"
    },
    "49143": {
      "school_short": "Hartwick",
      "world": "rockne",
      "division": "D-III"
    },
    "49026": {
      "school_short": "Harvard",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49539": {
      "school_short": "Heidelberg",
      "world": "rockne",
      "division": "D-III"
    },
    "49565": {
      "school_short": "Hamline",
      "world": "rockne",
      "division": "D-III"
    },
    "49363": {
      "school_short": "East Carolina",
      "world": "rockne",
      "division": "D-IA"
    },
    "49190": {
      "school_short": "Cornell",
      "world": "rockne",
      "division": "D-III"
    },
    "49215": {
      "school_short": "Hamilton",
      "world": "rockne",
      "division": "D-III"
    },
    "49350": {
      "school_short": "Colorado State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49270": {
      "school_short": "Greensboro",
      "world": "rockne",
      "division": "D-III"
    },
    "49511": {
      "school_short": "Gannon",
      "world": "rockne",
      "division": "D-II"
    },
    "49553": {
      "school_short": "Grinnell",
      "world": "rockne",
      "division": "D-III"
    },
    "49412": {
      "school_short": "Florida A&M",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49241": {
      "school_short": "Carnegie Mellon",
      "world": "rockne",
      "division": "D-III"
    },
    "49125": {
      "school_short": "Gettysburg",
      "world": "rockne",
      "division": "D-III"
    },
    "49348": {
      "school_short": "DePaul",
      "world": "rockne",
      "division": "D-IA"
    },
    "49232": {
      "school_short": "Wooster",
      "world": "rockne",
      "division": "D-III"
    },
    "49314": {
      "school_short": "Franklin & Marshall",
      "world": "rockne",
      "division": "D-III"
    },
    "49434": {
      "school_short": "William & Mary",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49466": {
      "school_short": "Catawba",
      "world": "rockne",
      "division": "D-II"
    },
    "49155": {
      "school_short": "Florida State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49038": {
      "school_short": "Georgia Southern",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49524": {
      "school_short": "Ferris State",
      "world": "rockne",
      "division": "D-II"
    },
    "49025": {
      "school_short": "Dartmouth",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49415": {
      "school_short": "Duquesne",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49178": {
      "school_short": "Concordia (IL)",
      "world": "rockne",
      "division": "D-III"
    },
    "49124": {
      "school_short": "Fort Hays State",
      "world": "rockne",
      "division": "D-II"
    },
    "49546": {
      "school_short": "Catholic",
      "world": "rockne",
      "division": "D-III"
    },
    "49432": {
      "school_short": "Georgetown",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49150": {
      "school_short": "Duke",
      "world": "rockne",
      "division": "D-IA"
    },
    "49242": {
      "school_short": "Case Western",
      "world": "rockne",
      "division": "D-III"
    },
    "49519": {
      "school_short": "Grand Valley State",
      "world": "rockne",
      "division": "D-II"
    },
    "49395": {
      "school_short": "Eastern Kentucky",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49447": {
      "school_short": "Eastern Washington",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49419": {
      "school_short": "Hampton",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49253": {
      "school_short": "Hanover",
      "world": "rockne",
      "division": "D-III"
    },
    "49068": {
      "school_short": "Henderson State",
      "world": "rockne",
      "division": "D-II"
    },
    "49389": {
      "school_short": "Eastern Illinois",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49043": {
      "school_short": "Elon",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49130": {
      "school_short": "Hobart",
      "world": "rockne",
      "division": "D-III"
    },
    "49440": {
      "school_short": "Hofstra",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49360": {
      "school_short": "Indiana",
      "world": "rockne",
      "division": "D-IA"
    },
    "49392": {
      "school_short": "Iona",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49166": {
      "school_short": "Iowa State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49409": {
      "school_short": "Jacksonville",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49126": {
      "school_short": "Johns Hopkins",
      "world": "rockne",
      "division": "D-III"
    },
    "49513": {
      "school_short": "Johnson C. Smith",
      "world": "rockne",
      "division": "D-II"
    },
    "49316": {
      "school_short": "Kalamazoo",
      "world": "rockne",
      "division": "D-III"
    },
    "49326": {
      "school_short": "King`s",
      "world": "rockne",
      "division": "D-III"
    },
    "49554": {
      "school_short": "Knox",
      "world": "rockne",
      "division": "D-III"
    },
    "49112": {
      "school_short": "Kutztown",
      "world": "rockne",
      "division": "D-II"
    },
    "49416": {
      "school_short": "La Salle",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49555": {
      "school_short": "Lawrence",
      "world": "rockne",
      "division": "D-III"
    },
    "49332": {
      "school_short": "Lebanon Valley",
      "world": "rockne",
      "division": "D-III"
    },
    "49186": {
      "school_short": "Luther",
      "world": "rockne",
      "division": "D-III"
    },
    "49319": {
      "school_short": "Macalester",
      "world": "rockne",
      "division": "D-III"
    },
    "49254": {
      "school_short": "Manchester",
      "world": "rockne",
      "division": "D-III"
    },
    "49113": {
      "school_short": "Mansfield",
      "world": "rockne",
      "division": "D-II"
    },
    "49203": {
      "school_short": "Maine Maritime",
      "world": "rockne",
      "division": "D-III"
    },
    "49227": {
      "school_short": "Huntingdon",
      "world": "rockne",
      "division": "D-III"
    },
    "49322": {
      "school_short": "Husson",
      "world": "rockne",
      "division": "D-III"
    },
    "49051": {
      "school_short": "Jackson State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49535": {
      "school_short": "John Carroll",
      "world": "rockne",
      "division": "D-III"
    },
    "49471": {
      "school_short": "Lenoir-Rhyne",
      "world": "rockne",
      "division": "D-II"
    },
    "49571": {
      "school_short": "Endicott",
      "world": "rockne",
      "division": "D-III"
    },
    "49338": {
      "school_short": "Lake Forest",
      "world": "rockne",
      "division": "D-III"
    },
    "49185": {
      "school_short": "Loras",
      "world": "rockne",
      "division": "D-III"
    },
    "49244": {
      "school_short": "Linfield",
      "world": "rockne",
      "division": "D-III"
    },
    "49019": {
      "school_short": "Florida International",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49547": {
      "school_short": "Emory and Henry",
      "world": "rockne",
      "division": "D-III"
    },
    "49292": {
      "school_short": "Kentucky State",
      "world": "rockne",
      "division": "D-II"
    },
    "49202": {
      "school_short": "Fitchburg State",
      "world": "rockne",
      "division": "D-III"
    },
    "49315": {
      "school_short": "Hope",
      "world": "rockne",
      "division": "D-III"
    },
    "49269": {
      "school_short": "Ferrum",
      "world": "rockne",
      "division": "D-III"
    },
    "49505": {
      "school_short": "Liberty",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48981": {
      "school_short": "LSU",
      "world": "rockne",
      "division": "D-IA"
    },
    "49397": {
      "school_short": "Murray State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49321": {
      "school_short": "Martin Luther",
      "world": "rockne",
      "division": "D-III"
    },
    "49218": {
      "school_short": "MIT",
      "world": "rockne",
      "division": "D-III"
    },
    "49127": {
      "school_short": "McDaniel",
      "world": "rockne",
      "division": "D-III"
    },
    "49161": {
      "school_short": "Kansas State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49377": {
      "school_short": "Kent State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49327": {
      "school_short": "Lycoming",
      "world": "rockne",
      "division": "D-III"
    },
    "49386": {
      "school_short": "Lafayette",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49233": {
      "school_short": "Kenyon",
      "world": "rockne",
      "division": "D-III"
    },
    "49179": {
      "school_short": "Elmhurst",
      "world": "rockne",
      "division": "D-III"
    },
    "49303": {
      "school_short": "Howard Payne",
      "world": "rockne",
      "division": "D-III"
    },
    "49483": {
      "school_short": "Humboldt State",
      "world": "rockne",
      "division": "D-II"
    },
    "49011": {
      "school_short": "Illinois State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49435": {
      "school_short": "James Madison",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49180": {
      "school_short": "Illinois Wesleyan",
      "world": "rockne",
      "division": "D-III"
    },
    "49331": {
      "school_short": "Juniata",
      "world": "rockne",
      "division": "D-III"
    },
    "49396": {
      "school_short": "Jacksonville State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49173": {
      "school_short": "Eureka",
      "world": "rockne",
      "division": "D-III"
    },
    "49489": {
      "school_short": "Long Island",
      "world": "rockne",
      "division": "D-II"
    },
    "49445": {
      "school_short": "Florida Atlantic",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49296": {
      "school_short": "Lane",
      "world": "rockne",
      "division": "D-II"
    },
    "49175": {
      "school_short": "Lakeland",
      "world": "rockne",
      "division": "D-III"
    },
    "48998": {
      "school_short": "Louisiana Tech",
      "world": "rockne",
      "division": "D-IA"
    },
    "49144": {
      "school_short": "Ithaca",
      "world": "rockne",
      "division": "D-III"
    },
    "49056": {
      "school_short": "Hillsdale",
      "world": "rockne",
      "division": "D-II"
    },
    "49452": {
      "school_short": "Idaho State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49337": {
      "school_short": "Illinois",
      "world": "rockne",
      "division": "D-III"
    },
    "49119": {
      "school_short": "Indiana (PA)",
      "world": "rockne",
      "division": "D-II"
    },
    "49219": {
      "school_short": "Kean",
      "world": "rockne",
      "division": "D-III"
    },
    "49387": {
      "school_short": "Lehigh",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49247": {
      "school_short": "Hampden-Sydney",
      "world": "rockne",
      "division": "D-III"
    },
    "49561": {
      "school_short": "Gustavus Adolphus",
      "world": "rockne",
      "division": "D-III"
    },
    "49243": {
      "school_short": "Lewis and Clark",
      "world": "rockne",
      "division": "D-III"
    },
    "49520": {
      "school_short": "Mercyhurst",
      "world": "rockne",
      "division": "D-II"
    },
    "49490": {
      "school_short": "Merrimack",
      "world": "rockne",
      "division": "D-II"
    },
    "49271": {
      "school_short": "Methodist",
      "world": "rockne",
      "division": "D-III"
    },
    "49456": {
      "school_short": "Midwestern State",
      "world": "rockne",
      "division": "D-II"
    },
    "49308": {
      "school_short": "Mississippi",
      "world": "rockne",
      "division": "D-III"
    },
    "49087": {
      "school_short": "Missouri Western State",
      "world": "rockne",
      "division": "D-II"
    },
    "49424": {
      "school_short": "Monmouth",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49033": {
      "school_short": "Morehead State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49228": {
      "school_short": "Mount Ida",
      "world": "rockne",
      "division": "D-III"
    },
    "49572": {
      "school_short": "Nichols",
      "world": "rockne",
      "division": "D-III"
    },
    "49422": {
      "school_short": "NC A&T",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49156": {
      "school_short": "North Carolina State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49352": {
      "school_short": "Michigan State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49499": {
      "school_short": "Minnesota State-Moorhead",
      "world": "rockne",
      "division": "D-II"
    },
    "49349": {
      "school_short": "Marquette",
      "world": "rockne",
      "division": "D-IA"
    },
    "49335": {
      "school_short": "Salisbury",
      "world": "rockne",
      "division": "D-III"
    },
    "49289": {
      "school_short": "North Park",
      "world": "rockne",
      "division": "D-III"
    },
    "49074": {
      "school_short": "Northeastern State",
      "world": "rockne",
      "division": "D-II"
    },
    "49441": {
      "school_short": "Northeastern",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49453": {
      "school_short": "Northern Arizona",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49375": {
      "school_short": "Miami (OH)",
      "world": "rockne",
      "division": "D-IA"
    },
    "49095": {
      "school_short": "Lock Haven",
      "world": "rockne",
      "division": "D-II"
    },
    "49204": {
      "school_short": "Massachusetts Maritime",
      "world": "rockne",
      "division": "D-III"
    },
    "49514": {
      "school_short": "Livingstone",
      "world": "rockne",
      "division": "D-II"
    },
    "49461": {
      "school_short": "Mesa State",
      "world": "rockne",
      "division": "D-II"
    },
    "49467": {
      "school_short": "Mars Hill",
      "world": "rockne",
      "division": "D-II"
    },
    "49052": {
      "school_short": "Mississippi Valley State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49536": {
      "school_short": "Mount Union",
      "world": "rockne",
      "division": "D-III"
    },
    "49454": {
      "school_short": "Montana State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49421": {
      "school_short": "Morgan State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49413": {
      "school_short": "Norfolk State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49088": {
      "school_short": "Northwest Missouri State",
      "world": "rockne",
      "division": "D-II"
    },
    "49135": {
      "school_short": "Norwich",
      "world": "rockne",
      "division": "D-III"
    },
    "49398": {
      "school_short": "Samford",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49105": {
      "school_short": "Northern State",
      "world": "rockne",
      "division": "D-II"
    },
    "49240": {
      "school_short": "Ohio Wesleyan",
      "world": "rockne",
      "division": "D-III"
    },
    "48962": {
      "school_short": "Oregon State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49541": {
      "school_short": "Otterbein",
      "world": "rockne",
      "division": "D-III"
    },
    "49245": {
      "school_short": "Pacific Lutheran",
      "world": "rockne",
      "division": "D-III"
    },
    "49358": {
      "school_short": "Penn State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49055": {
      "school_short": "Prairie View",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49299": {
      "school_short": "Saint Joseph`s",
      "world": "rockne",
      "division": "D-II"
    },
    "49420": {
      "school_short": "Howard",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48992": {
      "school_short": "New Mexico State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49462": {
      "school_short": "New Mexico Highlands",
      "world": "rockne",
      "division": "D-II"
    },
    "49274": {
      "school_short": "Maranatha Baptist",
      "world": "rockne",
      "division": "D-III"
    },
    "49333": {
      "school_short": "Moravian",
      "world": "rockne",
      "division": "D-III"
    },
    "49293": {
      "school_short": "Miles",
      "world": "rockne",
      "division": "D-II"
    },
    "49128": {
      "school_short": "Muhlenberg",
      "world": "rockne",
      "division": "D-III"
    },
    "49304": {
      "school_short": "Louisiana",
      "world": "rockne",
      "division": "D-III"
    },
    "49005": {
      "school_short": "San Diego State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49393": {
      "school_short": "Marist",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49057": {
      "school_short": "Michigan Tech",
      "world": "rockne",
      "division": "D-II"
    },
    "49063": {
      "school_short": "Ouachita Baptist",
      "world": "rockne",
      "division": "D-II"
    },
    "49045": {
      "school_short": "McNeese State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49540": {
      "school_short": "Marietta",
      "world": "rockne",
      "division": "D-III"
    },
    "49549": {
      "school_short": "Monmouth (IL)",
      "world": "rockne",
      "division": "D-III"
    },
    "49176": {
      "school_short": "MacMurray",
      "world": "rockne",
      "division": "D-III"
    },
    "49017": {
      "school_short": "Missouri State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49318": {
      "school_short": "Olivet",
      "world": "rockne",
      "division": "D-III"
    },
    "49383": {
      "school_short": "Northern Illinois",
      "world": "rockne",
      "division": "D-IA"
    },
    "49209": {
      "school_short": "Middlebury",
      "world": "rockne",
      "division": "D-III"
    },
    "48987": {
      "school_short": "Middle Tennessee State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49288": {
      "school_short": "North Central",
      "world": "rockne",
      "division": "D-III"
    },
    "49275": {
      "school_short": "Maryville",
      "world": "rockne",
      "division": "D-III"
    },
    "49276": {
      "school_short": "Nebraska Wesleyan",
      "world": "rockne",
      "division": "D-III"
    },
    "49091": {
      "school_short": "Missouri Southern State",
      "world": "rockne",
      "division": "D-II"
    },
    "49426": {
      "school_short": "Sacred Heart",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49257": {
      "school_short": "Millsaps",
      "world": "rockne",
      "division": "D-III"
    },
    "49099": {
      "school_short": "North Dakota State",
      "world": "rockne",
      "division": "D-II"
    },
    "49472": {
      "school_short": "Newberry",
      "world": "rockne",
      "division": "D-II"
    },
    "49287": {
      "school_short": "Millikin",
      "world": "rockne",
      "division": "D-III"
    },
    "49353": {
      "school_short": "Northwestern",
      "world": "rockne",
      "division": "D-IA"
    },
    "49359": {
      "school_short": "Purdue",
      "world": "rockne",
      "division": "D-IA"
    },
    "49248": {
      "school_short": "Randolph-Macon",
      "world": "rockne",
      "division": "D-III"
    },
    "49229": {
      "school_short": "Rockford",
      "world": "rockne",
      "division": "D-III"
    },
    "49020": {
      "school_short": "Savannah State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49457": {
      "school_short": "Oklahoma Panhandle",
      "world": "rockne",
      "division": "D-II"
    },
    "49234": {
      "school_short": "Oberlin",
      "world": "rockne",
      "division": "D-III"
    },
    "49030": {
      "school_short": "Princeton",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49530": {
      "school_short": "Principia",
      "world": "rockne",
      "division": "D-III"
    },
    "49550": {
      "school_short": "Ripon",
      "world": "rockne",
      "division": "D-III"
    },
    "49474": {
      "school_short": "Shepherd",
      "world": "rockne",
      "division": "D-II"
    },
    "49263": {
      "school_short": "Pomona-Pitzers",
      "world": "rockne",
      "division": "D-III"
    },
    "49390": {
      "school_short": "Tennessee Tech",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48997": {
      "school_short": "Troy State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49423": {
      "school_short": "SC State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49069": {
      "school_short": "Southern Arkansas",
      "world": "rockne",
      "division": "D-II"
    },
    "49491": {
      "school_short": "Southern Connecticut",
      "world": "rockne",
      "division": "D-II"
    },
    "49013": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49022": {
      "school_short": "Southern Utah",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49500": {
      "school_short": "Southwest Minnesota State",
      "world": "rockne",
      "division": "D-II"
    },
    "49076": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "rockne",
      "division": "D-II"
    },
    "49141": {
      "school_short": "Springfield",
      "world": "rockne",
      "division": "D-III"
    },
    "49516": {
      "school_short": "St. Augustine`s",
      "world": "rockne",
      "division": "D-II"
    },
    "49145": {
      "school_short": "St. John Fisher",
      "world": "rockne",
      "division": "D-III"
    },
    "49562": {
      "school_short": "St. John`s",
      "world": "rockne",
      "division": "D-III"
    },
    "49101": {
      "school_short": "St. Cloud State",
      "world": "rockne",
      "division": "D-II"
    },
    "49272": {
      "school_short": "Shenandoah",
      "world": "rockne",
      "division": "D-III"
    },
    "49090": {
      "school_short": "Truman State",
      "world": "rockne",
      "division": "D-II"
    },
    "49494": {
      "school_short": "Saint Anselm",
      "world": "rockne",
      "division": "D-II"
    },
    "49198": {
      "school_short": "Salve Regina",
      "world": "rockne",
      "division": "D-III"
    },
    "49047": {
      "school_short": "Northwestern State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49300": {
      "school_short": "Quincy",
      "world": "rockne",
      "division": "D-II"
    },
    "49493": {
      "school_short": "Pace",
      "world": "rockne",
      "division": "D-II"
    },
    "49508": {
      "school_short": "Shaw",
      "world": "rockne",
      "division": "D-II"
    },
    "49449": {
      "school_short": "Portland State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49058": {
      "school_short": "Northwood",
      "world": "rockne",
      "division": "D-II"
    },
    "49006": {
      "school_short": "San Jose State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49021": {
      "school_short": "Southeastern Louisiana",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49357": {
      "school_short": "Ohio State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49132": {
      "school_short": "St. Lawrence",
      "world": "rockne",
      "division": "D-III"
    },
    "49451": {
      "school_short": "St. Mary`s",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49551": {
      "school_short": "St. Norbert",
      "world": "rockne",
      "division": "D-III"
    },
    "49566": {
      "school_short": "St. Olaf",
      "world": "rockne",
      "division": "D-III"
    },
    "49495": {
      "school_short": "Stonehill",
      "world": "rockne",
      "division": "D-II"
    },
    "49388": {
      "school_short": "Towson",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49370": {
      "school_short": "Tulane",
      "world": "rockne",
      "division": "D-IA"
    },
    "49323": {
      "school_short": "Brockport",
      "world": "rockne",
      "division": "D-III"
    },
    "49394": {
      "school_short": "St. Peter`s",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49009": {
      "school_short": "Stephen F. Austin",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49369": {
      "school_short": "Texas Christian",
      "world": "rockne",
      "division": "D-IA"
    },
    "49310": {
      "school_short": "Texas Lutheran",
      "world": "rockne",
      "division": "D-III"
    },
    "49187": {
      "school_short": "Simpson",
      "world": "rockne",
      "division": "D-III"
    },
    "49262": {
      "school_short": "Occidental",
      "world": "rockne",
      "division": "D-III"
    },
    "49468": {
      "school_short": "Presbyterian",
      "world": "rockne",
      "division": "D-II"
    },
    "49372": {
      "school_short": "Southern Methodist",
      "world": "rockne",
      "division": "D-IA"
    },
    "49136": {
      "school_short": "Plymouth State",
      "world": "rockne",
      "division": "D-III"
    },
    "49378": {
      "school_short": "Ohio",
      "world": "rockne",
      "division": "D-IA"
    },
    "49120": {
      "school_short": "Shippensburg",
      "world": "rockne",
      "division": "D-II"
    },
    "49258": {
      "school_short": "Rhodes",
      "world": "rockne",
      "division": "D-III"
    },
    "49169": {
      "school_short": "Oklahoma State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49425": {
      "school_short": "Robert Morris",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49089": {
      "school_short": "Pittsburg State",
      "world": "rockne",
      "division": "D-II"
    },
    "49455": {
      "school_short": "Sam Houston State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49431": {
      "school_short": "Saint Francis",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49309": {
      "school_short": "Sul Ross State",
      "world": "rockne",
      "division": "D-III"
    },
    "49259": {
      "school_short": "Rose-Hulman",
      "world": "rockne",
      "division": "D-III"
    },
    "49502": {
      "school_short": "Southern-Baton Rouge",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49277": {
      "school_short": "Thomas More",
      "world": "rockne",
      "division": "D-III"
    },
    "49170": {
      "school_short": "Texas Tech",
      "world": "rockne",
      "division": "D-IA"
    },
    "49092": {
      "school_short": "Southwest Baptist",
      "world": "rockne",
      "division": "D-II"
    },
    "49075": {
      "school_short": "SE Oklahoma-Durant",
      "world": "rockne",
      "division": "D-II"
    },
    "49364": {
      "school_short": "Rice",
      "world": "rockne",
      "division": "D-IA"
    },
    "49221": {
      "school_short": "Rowan",
      "world": "rockne",
      "division": "D-III"
    },
    "49131": {
      "school_short": "Rensselaer Tech",
      "world": "rockne",
      "division": "D-III"
    },
    "49121": {
      "school_short": "Slippery Rock",
      "world": "rockne",
      "division": "D-II"
    },
    "48976": {
      "school_short": "Florida",
      "world": "rockne",
      "division": "D-IA"
    },
    "49361": {
      "school_short": "Iowa",
      "world": "rockne",
      "division": "D-IA"
    },
    "48988": {
      "school_short": "Louisiana Lafayette",
      "world": "rockne",
      "division": "D-IA"
    },
    "49442": {
      "school_short": "Maine",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49103": {
      "school_short": "Minnesota-Duluth",
      "world": "rockne",
      "division": "D-II"
    },
    "49162": {
      "school_short": "Nebraska",
      "world": "rockne",
      "division": "D-IA"
    },
    "49428": {
      "school_short": "Albany",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48979": {
      "school_short": "Kentucky",
      "world": "rockne",
      "division": "D-IA"
    },
    "49078": {
      "school_short": "Central Oklahoma",
      "world": "rockne",
      "division": "D-II"
    },
    "49211": {
      "school_short": "Tufts",
      "world": "rockne",
      "division": "D-III"
    },
    "48983": {
      "school_short": "Alabama",
      "world": "rockne",
      "division": "D-IA"
    },
    "49523": {
      "school_short": "Indianapolis",
      "world": "rockne",
      "division": "D-II"
    },
    "49039": {
      "school_short": "Citadel",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49093": {
      "school_short": "Missouri-Rolla",
      "world": "rockne",
      "division": "D-II"
    },
    "49340": {
      "school_short": "Syracuse",
      "world": "rockne",
      "division": "D-IA"
    },
    "49164": {
      "school_short": "Kansas",
      "world": "rockne",
      "division": "D-IA"
    },
    "49400": {
      "school_short": "Tennessee State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49260": {
      "school_short": "Trinity (TX)",
      "world": "rockne",
      "division": "D-III"
    },
    "49059": {
      "school_short": "Findlay",
      "world": "rockne",
      "division": "D-II"
    },
    "49366": {
      "school_short": "Memphis",
      "world": "rockne",
      "division": "D-IA"
    },
    "48996": {
      "school_short": "Montana",
      "world": "rockne",
      "division": "D-IA"
    },
    "49433": {
      "school_short": "Nevada",
      "world": "rockne",
      "division": "D-IA"
    },
    "49007": {
      "school_short": "UNLV",
      "world": "rockne",
      "division": "D-IA"
    },
    "49070": {
      "school_short": "Arkansas-Monticello",
      "world": "rockne",
      "division": "D-II"
    },
    "49191": {
      "school_short": "Dubuque",
      "world": "rockne",
      "division": "D-III"
    },
    "48989": {
      "school_short": "Louisiana Monroe",
      "world": "rockne",
      "division": "D-IA"
    },
    "49279": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "rockne",
      "division": "D-III"
    },
    "49281": {
      "school_short": "Wisconsin-Platteville",
      "world": "rockne",
      "division": "D-III"
    },
    "49283": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "rockne",
      "division": "D-III"
    },
    "49152": {
      "school_short": "North Carolina",
      "world": "rockne",
      "division": "D-IA"
    },
    "49027": {
      "school_short": "Pennsylvania",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48971": {
      "school_short": "UCLA",
      "world": "rockne",
      "division": "D-IA"
    },
    "49503": {
      "school_short": "Texas Southern",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49165": {
      "school_short": "Colorado",
      "world": "rockne",
      "division": "D-IA"
    },
    "49083": {
      "school_short": "Texas A&M-Kingsville",
      "world": "rockne",
      "division": "D-II"
    },
    "49556": {
      "school_short": "Chicago",
      "world": "rockne",
      "division": "D-III"
    },
    "49306": {
      "school_short": "Mary Hardin-Baylor",
      "world": "rockne",
      "division": "D-III"
    },
    "49376": {
      "school_short": "Akron",
      "world": "rockne",
      "division": "D-IA"
    },
    "49158": {
      "school_short": "Miami (FL)",
      "world": "rockne",
      "division": "D-IA"
    },
    "49264": {
      "school_short": "La Verne",
      "world": "rockne",
      "division": "D-III"
    },
    "49137": {
      "school_short": "Coast Guard",
      "world": "rockne",
      "division": "D-III"
    },
    "49504": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49345": {
      "school_short": "Louisville",
      "world": "rockne",
      "division": "D-IA"
    },
    "49107": {
      "school_short": "Charleston",
      "world": "rockne",
      "division": "D-II"
    },
    "49346": {
      "school_short": "Cincinnati",
      "world": "rockne",
      "division": "D-IA"
    },
    "49192": {
      "school_short": "Thiel",
      "world": "rockne",
      "division": "D-III"
    },
    "49371": {
      "school_short": "Alabama Birmingham",
      "world": "rockne",
      "division": "D-IA"
    },
    "48993": {
      "school_short": "Idaho",
      "world": "rockne",
      "division": "D-IA"
    },
    "49343": {
      "school_short": "Pittsburgh",
      "world": "rockne",
      "division": "D-IA"
    },
    "49223": {
      "school_short": "New Jersey",
      "world": "rockne",
      "division": "D-III"
    },
    "49469": {
      "school_short": "Tusculum",
      "world": "rockne",
      "division": "D-II"
    },
    "49427": {
      "school_short": "Stony Brook",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49379": {
      "school_short": "Buffalo",
      "world": "rockne",
      "division": "D-IA"
    },
    "48985": {
      "school_short": "Ole Miss",
      "world": "rockne",
      "division": "D-IA"
    },
    "48972": {
      "school_short": "Stanford",
      "world": "rockne",
      "division": "D-IA"
    },
    "49373": {
      "school_short": "Houston",
      "world": "rockne",
      "division": "D-IA"
    },
    "48966": {
      "school_short": "California",
      "world": "rockne",
      "division": "D-IA"
    },
    "49479": {
      "school_short": "Nebraska-Omaha",
      "world": "rockne",
      "division": "D-II"
    },
    "49210": {
      "school_short": "Trinity",
      "world": "rockne",
      "division": "D-III"
    },
    "49531": {
      "school_short": "Stillman",
      "world": "rockne",
      "division": "D-III"
    },
    "49351": {
      "school_short": "Illinois",
      "world": "rockne",
      "division": "D-IA"
    },
    "49008": {
      "school_short": "Hawaii",
      "world": "rockne",
      "division": "D-IA"
    },
    "49077": {
      "school_short": "Tarleton State",
      "world": "rockne",
      "division": "D-II"
    },
    "49443": {
      "school_short": "New Hampshire",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49439": {
      "school_short": "Villanova",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49368": {
      "school_short": "Central Florida",
      "world": "rockne",
      "division": "D-IA"
    },
    "49328": {
      "school_short": "Susquehanna",
      "world": "rockne",
      "division": "D-III"
    },
    "49138": {
      "school_short": "Merchant Marine",
      "world": "rockne",
      "division": "D-III"
    },
    "49222": {
      "school_short": "Cortland",
      "world": "rockne",
      "division": "D-III"
    },
    "49437": {
      "school_short": "Massachusetts",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49133": {
      "school_short": "Union (NY)",
      "world": "rockne",
      "division": "D-III"
    },
    "49481": {
      "school_short": "South Dakota",
      "world": "rockne",
      "division": "D-II"
    },
    "49391": {
      "school_short": "Tennessee-Martin",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49134": {
      "school_short": "Rochester",
      "world": "rockne",
      "division": "D-III"
    },
    "49365": {
      "school_short": "Tulsa",
      "world": "rockne",
      "division": "D-IA"
    },
    "49002": {
      "school_short": "Utah",
      "world": "rockne",
      "division": "D-IA"
    },
    "49280": {
      "school_short": "Wisconsin-La Crosse",
      "world": "rockne",
      "division": "D-III"
    },
    "49285": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "rockne",
      "division": "D-III"
    },
    "49286": {
      "school_short": "Wisconsin-Stout",
      "world": "rockne",
      "division": "D-III"
    },
    "48991": {
      "school_short": "Army",
      "world": "rockne",
      "division": "D-IA"
    },
    "49146": {
      "school_short": "Utica",
      "world": "rockne",
      "division": "D-III"
    },
    "49480": {
      "school_short": "North Dakota",
      "world": "rockne",
      "division": "D-II"
    },
    "49354": {
      "school_short": "Michigan",
      "world": "rockne",
      "division": "D-IA"
    },
    "49066": {
      "school_short": "West Alabama",
      "world": "rockne",
      "division": "D-II"
    },
    "49436": {
      "school_short": "Delaware",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48973": {
      "school_short": "Air Force",
      "world": "rockne",
      "division": "D-IA"
    },
    "49406": {
      "school_short": "VMI",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49509": {
      "school_short": "Virginia State",
      "world": "rockne",
      "division": "D-II"
    },
    "49362": {
      "school_short": "Notre Dame",
      "world": "rockne",
      "division": "D-IA"
    },
    "48969": {
      "school_short": "Arizona",
      "world": "rockne",
      "division": "D-IA"
    },
    "49044": {
      "school_short": "Tennessee-Chattanooga",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49235": {
      "school_short": "Wabash",
      "world": "rockne",
      "division": "D-III"
    },
    "48963": {
      "school_short": "Oregon",
      "world": "rockne",
      "division": "D-IA"
    },
    "49064": {
      "school_short": "West Georgia",
      "world": "rockne",
      "division": "D-II"
    },
    "49463": {
      "school_short": "Nebraska-Kearney",
      "world": "rockne",
      "division": "D-II"
    },
    "48995": {
      "school_short": "Utah State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49168": {
      "school_short": "Texas",
      "world": "rockne",
      "division": "D-IA"
    },
    "49000": {
      "school_short": "UTEP",
      "world": "rockne",
      "division": "D-IA"
    },
    "49382": {
      "school_short": "Toledo",
      "world": "rockne",
      "division": "D-IA"
    },
    "49329": {
      "school_short": "Wilkes",
      "world": "rockne",
      "division": "D-III"
    },
    "49660": {
      "school_short": "Alabama A&M",
      "world": "camp",
      "division": "D-IAA"
    },
    "49661": {
      "school_short": "Alabama State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50089": {
      "school_short": "Albany State",
      "world": "camp",
      "division": "D-II"
    },
    "49193": {
      "school_short": "Washington and Jefferson",
      "world": "rockne",
      "division": "D-III"
    },
    "48965": {
      "school_short": "Washington State",
      "world": "rockne",
      "division": "D-IA"
    },
    "49106": {
      "school_short": "Wayne State",
      "world": "rockne",
      "division": "D-II"
    },
    "49526": {
      "school_short": "Willamette",
      "world": "rockne",
      "division": "D-III"
    },
    "49450": {
      "school_short": "Weber State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49230": {
      "school_short": "Wesley",
      "world": "rockne",
      "division": "D-III"
    },
    "49115": {
      "school_short": "West Chester",
      "world": "rockne",
      "division": "D-II"
    },
    "49476": {
      "school_short": "West Virginia Wesleyan",
      "world": "rockne",
      "division": "D-II"
    },
    "49205": {
      "school_short": "Westfield State",
      "world": "rockne",
      "division": "D-III"
    },
    "49525": {
      "school_short": "Whitworth",
      "world": "rockne",
      "division": "D-III"
    },
    "49224": {
      "school_short": "William Paterson",
      "world": "rockne",
      "division": "D-III"
    },
    "49199": {
      "school_short": "UMass-Dartmouth",
      "world": "rockne",
      "division": "D-III"
    },
    "49464": {
      "school_short": "Western State (CO)",
      "world": "rockne",
      "division": "D-II"
    },
    "48975": {
      "school_short": "Tennessee",
      "world": "rockne",
      "division": "D-IA"
    },
    "49065": {
      "school_short": "Central Arkansas",
      "world": "rockne",
      "division": "D-II"
    },
    "49265": {
      "school_short": "Redlands",
      "world": "rockne",
      "division": "D-III"
    },
    "49153": {
      "school_short": "Virginia",
      "world": "rockne",
      "division": "D-IA"
    },
    "49001": {
      "school_short": "New Mexico",
      "world": "rockne",
      "division": "D-IA"
    },
    "49014": {
      "school_short": "Western Illinois",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48977": {
      "school_short": "Vanderbilt",
      "world": "rockne",
      "division": "D-IA"
    },
    "49200": {
      "school_short": "Western New England",
      "world": "rockne",
      "division": "D-III"
    },
    "48994": {
      "school_short": "North Texas",
      "world": "rockne",
      "division": "D-IA"
    },
    "49194": {
      "school_short": "Waynesburg",
      "world": "rockne",
      "division": "D-III"
    },
    "49342": {
      "school_short": "Connecticut",
      "world": "rockne",
      "division": "D-IA"
    },
    "49563": {
      "school_short": "St. Thomas",
      "world": "rockne",
      "division": "D-III"
    },
    "49444": {
      "school_short": "Richmond",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48970": {
      "school_short": "Southern California",
      "world": "rockne",
      "division": "D-IA"
    },
    "49284": {
      "school_short": "Wisconsin-Whitewater",
      "world": "rockne",
      "division": "D-III"
    },
    "49403": {
      "school_short": "Dayton",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49356": {
      "school_short": "Wisconsin",
      "world": "rockne",
      "division": "D-IA"
    },
    "49129": {
      "school_short": "Ursinus",
      "world": "rockne",
      "division": "D-III"
    },
    "48964": {
      "school_short": "Washington",
      "world": "rockne",
      "division": "D-IA"
    },
    "48984": {
      "school_short": "Arkansas",
      "world": "rockne",
      "division": "D-IA"
    },
    "49438": {
      "school_short": "Rhode Island",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49405": {
      "school_short": "Valparaiso",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49246": {
      "school_short": "Puget Sound",
      "world": "rockne",
      "division": "D-III"
    },
    "49347": {
      "school_short": "South Florida",
      "world": "rockne",
      "division": "D-IA"
    },
    "48978": {
      "school_short": "South Carolina",
      "world": "rockne",
      "division": "D-IA"
    },
    "49163": {
      "school_short": "Missouri",
      "world": "rockne",
      "division": "D-IA"
    },
    "49167": {
      "school_short": "Oklahoma",
      "world": "rockne",
      "division": "D-IA"
    },
    "49261": {
      "school_short": "South-Sewanee",
      "world": "rockne",
      "division": "D-III"
    },
    "49212": {
      "school_short": "Williams",
      "world": "rockne",
      "division": "D-III"
    },
    "49317": {
      "school_short": "Wisconsin Lutheran",
      "world": "rockne",
      "division": "D-III"
    },
    "49557": {
      "school_short": "Washington (MO)",
      "world": "rockne",
      "division": "D-III"
    },
    "49475": {
      "school_short": "West Virginia Tech",
      "world": "rockne",
      "division": "D-II"
    },
    "49569": {
      "school_short": "Westminster (PA)",
      "world": "rockne",
      "division": "D-III"
    },
    "49384": {
      "school_short": "Western Michigan",
      "world": "rockne",
      "division": "D-IA"
    },
    "49485": {
      "school_short": "Western Washington",
      "world": "rockne",
      "division": "D-II"
    },
    "49470": {
      "school_short": "Wingate",
      "world": "rockne",
      "division": "D-II"
    },
    "49041": {
      "school_short": "Wofford",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49140": {
      "school_short": "Worcester Tech",
      "world": "rockne",
      "division": "D-III"
    },
    "49691": {
      "school_short": "Abilene Christian",
      "world": "camp",
      "division": "D-II"
    },
    "50071": {
      "school_short": "Adams State",
      "world": "camp",
      "division": "D-II"
    },
    "49808": {
      "school_short": "Albion",
      "world": "camp",
      "division": "D-III"
    },
    "49429": {
      "school_short": "Wagner",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49154": {
      "school_short": "Wake Forest",
      "world": "rockne",
      "division": "D-IA"
    },
    "49843": {
      "school_short": "Allegheny",
      "world": "camp",
      "division": "D-III"
    },
    "49809": {
      "school_short": "Alma",
      "world": "camp",
      "division": "D-III"
    },
    "50098": {
      "school_short": "American International",
      "world": "camp",
      "division": "D-II"
    },
    "49819": {
      "school_short": "Amherst",
      "world": "camp",
      "division": "D-III"
    },
    "49673": {
      "school_short": "Arkansas Tech",
      "world": "camp",
      "division": "D-II"
    },
    "50130": {
      "school_short": "Ashland",
      "world": "camp",
      "division": "D-II"
    },
    "50104": {
      "school_short": "Assumption",
      "world": "camp",
      "division": "D-II"
    },
    "50170": {
      "school_short": "Augsburg",
      "world": "camp",
      "division": "D-III"
    },
    "49793": {
      "school_short": "Augustana (IL)",
      "world": "camp",
      "division": "D-III"
    },
    "49015": {
      "school_short": "Western Kentucky",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49278": {
      "school_short": "Westminster (MO)",
      "world": "rockne",
      "division": "D-III"
    },
    "49344": {
      "school_short": "West Virginia",
      "world": "rockne",
      "division": "D-IA"
    },
    "49249": {
      "school_short": "Washington and Lee",
      "world": "rockne",
      "division": "D-III"
    },
    "49484": {
      "school_short": "Western Oregon",
      "world": "rockne",
      "division": "D-II"
    },
    "49216": {
      "school_short": "Wesleyan",
      "world": "rockne",
      "division": "D-III"
    },
    "49862": {
      "school_short": "Anderson",
      "world": "camp",
      "division": "D-III"
    },
    "49084": {
      "school_short": "West Texas A&M",
      "world": "rockne",
      "division": "D-II"
    },
    "49102": {
      "school_short": "Winona State",
      "world": "rockne",
      "division": "D-II"
    },
    "50145": {
      "school_short": "Baldwin-Wallace",
      "world": "camp",
      "division": "D-III"
    },
    "49784": {
      "school_short": "Baylor",
      "world": "camp",
      "division": "D-IA"
    },
    "49948": {
      "school_short": "Beloit",
      "world": "camp",
      "division": "D-III"
    },
    "50090": {
      "school_short": "Benedict",
      "world": "camp",
      "division": "D-II"
    },
    "49789": {
      "school_short": "Benedictine",
      "world": "camp",
      "division": "D-III"
    },
    "50099": {
      "school_short": "Bentley",
      "world": "camp",
      "division": "D-II"
    },
    "50179": {
      "school_short": "Bethany",
      "world": "camp",
      "division": "D-III"
    },
    "50171": {
      "school_short": "Bethel",
      "world": "camp",
      "division": "D-III"
    },
    "50030": {
      "school_short": "Bethune-Cookman",
      "world": "camp",
      "division": "D-IAA"
    },
    "50144": {
      "school_short": "Blackburn",
      "world": "camp",
      "division": "D-III"
    },
    "49772": {
      "school_short": "Boston",
      "world": "camp",
      "division": "D-IA"
    },
    "49923": {
      "school_short": "California Lutheran",
      "world": "camp",
      "division": "D-III"
    },
    "49853": {
      "school_short": "Carnegie Mellon",
      "world": "camp",
      "division": "D-III"
    },
    "50164": {
      "school_short": "Carroll",
      "world": "camp",
      "division": "D-III"
    },
    "49854": {
      "school_short": "Case Western",
      "world": "camp",
      "division": "D-III"
    },
    "49919": {
      "school_short": "Austin",
      "world": "camp",
      "division": "D-III"
    },
    "50019": {
      "school_short": "Austin Peay",
      "world": "camp",
      "division": "D-IAA"
    },
    "49825": {
      "school_short": "Bates",
      "world": "camp",
      "division": "D-III"
    },
    "49643": {
      "school_short": "Bucknell",
      "world": "camp",
      "division": "D-IAA"
    },
    "49826": {
      "school_short": "Bowdoin",
      "world": "camp",
      "division": "D-III"
    },
    "50157": {
      "school_short": "Bridgewater",
      "world": "camp",
      "division": "D-III"
    },
    "49635": {
      "school_short": "Brown",
      "world": "camp",
      "division": "D-IAA"
    },
    "49109": {
      "school_short": "West Virginia State",
      "world": "rockne",
      "division": "D-II"
    },
    "49206": {
      "school_short": "Worcester State",
      "world": "rockne",
      "division": "D-III"
    },
    "49028": {
      "school_short": "Yale",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49236": {
      "school_short": "Wittenberg",
      "world": "rockne",
      "division": "D-III"
    },
    "49458": {
      "school_short": "Western New Mexico",
      "world": "rockne",
      "division": "D-II"
    },
    "49334": {
      "school_short": "Widener",
      "world": "rockne",
      "division": "D-III"
    },
    "49813": {
      "school_short": "Bridgewater State",
      "world": "camp",
      "division": "D-III"
    },
    "49182": {
      "school_short": "Wheaton",
      "world": "rockne",
      "division": "D-III"
    },
    "49266": {
      "school_short": "Whittier",
      "world": "rockne",
      "division": "D-III"
    },
    "49060": {
      "school_short": "Wayne State",
      "world": "rockne",
      "division": "D-II"
    },
    "49616": {
      "school_short": "Fresno State",
      "world": "camp",
      "division": "D-IA"
    },
    "49542": {
      "school_short": "Wilmington (OH)",
      "world": "rockne",
      "division": "D-III"
    },
    "49003": {
      "school_short": "Wyoming",
      "world": "rockne",
      "division": "D-IA"
    },
    "50013": {
      "school_short": "Butler",
      "world": "camp",
      "division": "D-IAA"
    },
    "49016": {
      "school_short": "Youngstown State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49709": {
      "school_short": "Augustana",
      "world": "camp",
      "division": "D-II"
    },
    "49592": {
      "school_short": "Auburn",
      "world": "camp",
      "division": "D-IA"
    },
    "50110": {
      "school_short": "Bemidji State",
      "world": "camp",
      "division": "D-II"
    },
    "49611": {
      "school_short": "Boise State",
      "world": "camp",
      "division": "D-IA"
    },
    "49517": {
      "school_short": "Winston-Salem State",
      "world": "rockne",
      "division": "D-II"
    },
    "49807": {
      "school_short": "Adrian",
      "world": "camp",
      "division": "D-III"
    },
    "49728": {
      "school_short": "California (PA)",
      "world": "camp",
      "division": "D-II"
    },
    "49902": {
      "school_short": "Carthage",
      "world": "camp",
      "division": "D-III"
    },
    "49662": {
      "school_short": "Alcorn State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49573": {
      "school_short": "Central Michigan",
      "world": "camp",
      "division": "D-IA"
    },
    "49697": {
      "school_short": "Central Missouri State",
      "world": "camp",
      "division": "D-II"
    },
    "49838": {
      "school_short": "Chapman",
      "world": "camp",
      "division": "D-III"
    },
    "49646": {
      "school_short": "Charleston Southern",
      "world": "camp",
      "division": "D-IAA"
    },
    "49880": {
      "school_short": "Christopher Newport",
      "world": "camp",
      "division": "D-III"
    },
    "49924": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "camp",
      "division": "D-III"
    },
    "49729": {
      "school_short": "Clarion",
      "world": "camp",
      "division": "D-II"
    },
    "49907": {
      "school_short": "Clark Atlanta",
      "world": "camp",
      "division": "D-II"
    },
    "49644": {
      "school_short": "Colgate",
      "world": "camp",
      "division": "D-IAA"
    },
    "50022": {
      "school_short": "Holy Cross",
      "world": "camp",
      "division": "D-IAA"
    },
    "49844": {
      "school_short": "Wooster",
      "world": "camp",
      "division": "D-III"
    },
    "49636": {
      "school_short": "Columbia",
      "world": "camp",
      "division": "D-IAA"
    },
    "50172": {
      "school_short": "Concordia",
      "world": "camp",
      "division": "D-III"
    },
    "49790": {
      "school_short": "Concordia (IL)",
      "world": "camp",
      "division": "D-III"
    },
    "49760": {
      "school_short": "Concordia (WI)",
      "world": "camp",
      "division": "D-III"
    },
    "49716": {
      "school_short": "Concordia",
      "world": "camp",
      "division": "D-II"
    },
    "49641": {
      "school_short": "Cornell",
      "world": "camp",
      "division": "D-IAA"
    },
    "50020": {
      "school_short": "Davidson",
      "world": "camp",
      "division": "D-IAA"
    },
    "49997": {
      "school_short": "Ball State",
      "world": "camp",
      "division": "D-IA"
    },
    "49795": {
      "school_short": "Buena Vista",
      "world": "camp",
      "division": "D-III"
    },
    "49879": {
      "school_short": "Averett",
      "world": "camp",
      "division": "D-III"
    },
    "50100": {
      "school_short": "Bryant",
      "world": "camp",
      "division": "D-II"
    },
    "49754": {
      "school_short": "Alfred",
      "world": "camp",
      "division": "D-III"
    },
    "50182": {
      "school_short": "Curry",
      "world": "camp",
      "division": "D-III"
    },
    "49863": {
      "school_short": "Bluffton",
      "world": "camp",
      "division": "D-III"
    },
    "49993": {
      "school_short": "Bowling Green",
      "world": "camp",
      "division": "D-IA"
    },
    "49648": {
      "school_short": "Appalachian State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49837": {
      "school_short": "Buffalo",
      "world": "camp",
      "division": "D-III"
    },
    "50077": {
      "school_short": "Carson-Newman",
      "world": "camp",
      "division": "D-II"
    },
    "49867": {
      "school_short": "Centre",
      "world": "camp",
      "division": "D-III"
    },
    "49761": {
      "school_short": "Clemson",
      "world": "camp",
      "division": "D-IA"
    },
    "50146": {
      "school_short": "Capital",
      "world": "camp",
      "division": "D-III"
    },
    "49579": {
      "school_short": "BYU",
      "world": "camp",
      "division": "D-IA"
    },
    "49937": {
      "school_short": "Delaware Valley",
      "world": "camp",
      "division": "D-III"
    },
    "49849": {
      "school_short": "Denison",
      "world": "camp",
      "division": "D-III"
    },
    "49925": {
      "school_short": "Dickinson",
      "world": "camp",
      "division": "D-III"
    },
    "50014": {
      "school_short": "Drake",
      "world": "camp",
      "division": "D-IAA"
    },
    "49975": {
      "school_short": "East Carolina",
      "world": "camp",
      "division": "D-IA"
    },
    "49723": {
      "school_short": "East Stroudsburg",
      "world": "camp",
      "division": "D-II"
    },
    "49654": {
      "school_short": "East Tennessee State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49802": {
      "school_short": "Cornell",
      "world": "camp",
      "division": "D-III"
    },
    "49647": {
      "school_short": "Coastal Carolina",
      "world": "camp",
      "division": "D-IAA"
    },
    "50108": {
      "school_short": "Concord",
      "world": "camp",
      "division": "D-II"
    },
    "49637": {
      "school_short": "Dartmouth",
      "world": "camp",
      "division": "D-IAA"
    },
    "49796": {
      "school_short": "Central",
      "world": "camp",
      "division": "D-III"
    },
    "50042": {
      "school_short": "Central Connecticut",
      "world": "camp",
      "division": "D-IAA"
    },
    "49850": {
      "school_short": "Earlham",
      "world": "camp",
      "division": "D-III"
    },
    "50057": {
      "school_short": "Florida Atlantic",
      "world": "camp",
      "division": "D-IAA"
    },
    "49736": {
      "school_short": "Fort Hays State",
      "world": "camp",
      "division": "D-II"
    },
    "50183": {
      "school_short": "Endicott",
      "world": "camp",
      "division": "D-III"
    },
    "49785": {
      "school_short": "Eureka",
      "world": "camp",
      "division": "D-III"
    },
    "49942": {
      "school_short": "Fairleigh Dickinson",
      "world": "camp",
      "division": "D-III"
    },
    "50072": {
      "school_short": "Fort Lewis",
      "world": "camp",
      "division": "D-II"
    },
    "49903": {
      "school_short": "Fort Valley State",
      "world": "camp",
      "division": "D-II"
    },
    "49829": {
      "school_short": "Framingham State",
      "world": "camp",
      "division": "D-III"
    },
    "49926": {
      "school_short": "Franklin & Marshall",
      "world": "camp",
      "division": "D-III"
    },
    "49864": {
      "school_short": "Franklin",
      "world": "camp",
      "division": "D-III"
    },
    "49698": {
      "school_short": "Emporia State",
      "world": "camp",
      "division": "D-II"
    },
    "50156": {
      "school_short": "Defiance",
      "world": "camp",
      "division": "D-III"
    },
    "50155": {
      "school_short": "Mount St. Joseph",
      "world": "camp",
      "division": "D-III"
    },
    "50078": {
      "school_short": "Catawba",
      "world": "camp",
      "division": "D-II"
    },
    "49962": {
      "school_short": "Colorado State",
      "world": "camp",
      "division": "D-IA"
    },
    "49598": {
      "school_short": "Arkansas State",
      "world": "camp",
      "division": "D-IA"
    },
    "50176": {
      "school_short": "Carleton",
      "world": "camp",
      "division": "D-III"
    },
    "50046": {
      "school_short": "William & Mary",
      "world": "camp",
      "division": "D-IAA"
    },
    "49801": {
      "school_short": "Coe",
      "world": "camp",
      "division": "D-III"
    },
    "49722": {
      "school_short": "Bloomsburg",
      "world": "camp",
      "division": "D-II"
    },
    "50027": {
      "school_short": "Duquesne",
      "world": "camp",
      "division": "D-IAA"
    },
    "50094": {
      "school_short": "Central Washington",
      "world": "camp",
      "division": "D-II"
    },
    "49708": {
      "school_short": "Cheyney",
      "world": "camp",
      "division": "D-II"
    },
    "50060": {
      "school_short": "Cal Poly",
      "world": "camp",
      "division": "D-IAA"
    },
    "49692": {
      "school_short": "Angelo State",
      "world": "camp",
      "division": "D-II"
    },
    "50118": {
      "school_short": "Bowie State",
      "world": "camp",
      "division": "D-II"
    },
    "49679": {
      "school_short": "Delta State",
      "world": "camp",
      "division": "D-II"
    },
    "50140": {
      "school_short": "Frostburg State",
      "world": "camp",
      "division": "D-III"
    },
    "50123": {
      "school_short": "Gannon",
      "world": "camp",
      "division": "D-II"
    },
    "49665": {
      "school_short": "Gardner-Webb",
      "world": "camp",
      "division": "D-IAA"
    },
    "50085": {
      "school_short": "Glenville",
      "world": "camp",
      "division": "D-II"
    },
    "49666": {
      "school_short": "Grambling State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50131": {
      "school_short": "Grand Valley State",
      "world": "camp",
      "division": "D-II"
    },
    "50165": {
      "school_short": "Grinnell",
      "world": "camp",
      "division": "D-III"
    },
    "50160": {
      "school_short": "Guilford",
      "world": "camp",
      "division": "D-III"
    },
    "49827": {
      "school_short": "Hamilton",
      "world": "camp",
      "division": "D-III"
    },
    "50177": {
      "school_short": "Hamline",
      "world": "camp",
      "division": "D-III"
    },
    "49859": {
      "school_short": "Hampden-Sydney",
      "world": "camp",
      "division": "D-III"
    },
    "50031": {
      "school_short": "Hampton",
      "world": "camp",
      "division": "D-IAA"
    },
    "49865": {
      "school_short": "Hanover",
      "world": "camp",
      "division": "D-III"
    },
    "49674": {
      "school_short": "Harding",
      "world": "camp",
      "division": "D-II"
    },
    "49914": {
      "school_short": "Hardin-Simmons",
      "world": "camp",
      "division": "D-III"
    },
    "49638": {
      "school_short": "Harvard",
      "world": "camp",
      "division": "D-IAA"
    },
    "49680": {
      "school_short": "Henderson State",
      "world": "camp",
      "division": "D-II"
    },
    "49668": {
      "school_short": "Hillsdale",
      "world": "camp",
      "division": "D-II"
    },
    "49742": {
      "school_short": "Hobart",
      "world": "camp",
      "division": "D-III"
    },
    "49915": {
      "school_short": "Howard Payne",
      "world": "camp",
      "division": "D-III"
    },
    "50095": {
      "school_short": "Humboldt State",
      "world": "camp",
      "division": "D-II"
    },
    "49885": {
      "school_short": "Chowan",
      "world": "camp",
      "division": "D-III"
    },
    "50158": {
      "school_short": "Catholic",
      "world": "camp",
      "division": "D-III"
    },
    "49755": {
      "school_short": "Hartwick",
      "world": "camp",
      "division": "D-III"
    },
    "49960": {
      "school_short": "DePaul",
      "world": "camp",
      "division": "D-IA"
    },
    "50044": {
      "school_short": "Georgetown",
      "world": "camp",
      "division": "D-IAA"
    },
    "49763": {
      "school_short": "Georgia Tech",
      "world": "camp",
      "division": "D-IA"
    },
    "50001": {
      "school_short": "Eastern Illinois",
      "world": "camp",
      "division": "D-IAA"
    },
    "50032": {
      "school_short": "Howard",
      "world": "camp",
      "division": "D-IAA"
    },
    "49820": {
      "school_short": "Colby",
      "world": "camp",
      "division": "D-III"
    },
    "50139": {
      "school_short": "Eastern Oregon",
      "world": "camp",
      "division": "D-III"
    },
    "49851": {
      "school_short": "Hiram",
      "world": "camp",
      "division": "D-III"
    },
    "50059": {
      "school_short": "Eastern Washington",
      "world": "camp",
      "division": "D-IAA"
    },
    "49693": {
      "school_short": "Eastern New Mexico",
      "world": "camp",
      "division": "D-II"
    },
    "49685": {
      "school_short": "East Central",
      "world": "camp",
      "division": "D-II"
    },
    "49882": {
      "school_short": "Greensboro",
      "world": "camp",
      "division": "D-III"
    },
    "49737": {
      "school_short": "Gettysburg",
      "world": "camp",
      "division": "D-III"
    },
    "50023": {
      "school_short": "Fordham",
      "world": "camp",
      "division": "D-IAA"
    },
    "49650": {
      "school_short": "Georgia Southern",
      "world": "camp",
      "division": "D-IAA"
    },
    "50180": {
      "school_short": "Grove City",
      "world": "camp",
      "division": "D-III"
    },
    "50151": {
      "school_short": "Heidelberg",
      "world": "camp",
      "division": "D-III"
    },
    "49927": {
      "school_short": "Hope",
      "world": "camp",
      "division": "D-III"
    },
    "49730": {
      "school_short": "Edinboro",
      "world": "camp",
      "division": "D-II"
    },
    "50119": {
      "school_short": "Elizabeth City",
      "world": "camp",
      "division": "D-II"
    },
    "49791": {
      "school_short": "Elmhurst",
      "world": "camp",
      "division": "D-III"
    },
    "49655": {
      "school_short": "Elon",
      "world": "camp",
      "division": "D-IAA"
    },
    "50159": {
      "school_short": "Emory and Henry",
      "world": "camp",
      "division": "D-III"
    },
    "50109": {
      "school_short": "Fairmont State",
      "world": "camp",
      "division": "D-II"
    },
    "50124": {
      "school_short": "Fayetteville State",
      "world": "camp",
      "division": "D-II"
    },
    "50136": {
      "school_short": "Ferris State",
      "world": "camp",
      "division": "D-II"
    },
    "49881": {
      "school_short": "Ferrum",
      "world": "camp",
      "division": "D-III"
    },
    "49798": {
      "school_short": "Luther",
      "world": "camp",
      "division": "D-III"
    },
    "49939": {
      "school_short": "Lycoming",
      "world": "camp",
      "division": "D-III"
    },
    "50004": {
      "school_short": "Iona",
      "world": "camp",
      "division": "D-IAA"
    },
    "49831": {
      "school_short": "Kean",
      "world": "camp",
      "division": "D-III"
    },
    "50047": {
      "school_short": "James Madison",
      "world": "camp",
      "division": "D-IAA"
    },
    "49989": {
      "school_short": "Kent State",
      "world": "camp",
      "division": "D-IA"
    },
    "50166": {
      "school_short": "Knox",
      "world": "camp",
      "division": "D-III"
    },
    "49787": {
      "school_short": "Lakeland",
      "world": "camp",
      "division": "D-III"
    },
    "50167": {
      "school_short": "Lawrence",
      "world": "camp",
      "division": "D-III"
    },
    "49944": {
      "school_short": "Lebanon Valley",
      "world": "camp",
      "division": "D-III"
    },
    "49999": {
      "school_short": "Lehigh",
      "world": "camp",
      "division": "D-IAA"
    },
    "50083": {
      "school_short": "Lenoir-Rhyne",
      "world": "camp",
      "division": "D-II"
    },
    "49855": {
      "school_short": "Lewis and Clark",
      "world": "camp",
      "division": "D-III"
    },
    "49707": {
      "school_short": "Lock Haven",
      "world": "camp",
      "division": "D-II"
    },
    "49649": {
      "school_short": "Furman",
      "world": "camp",
      "division": "D-IAA"
    },
    "50026": {
      "school_short": "Delaware State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49814": {
      "school_short": "Fitchburg State",
      "world": "camp",
      "division": "D-III"
    },
    "49839": {
      "school_short": "Huntingdon",
      "world": "camp",
      "division": "D-III"
    },
    "50028": {
      "school_short": "La Salle",
      "world": "camp",
      "division": "D-IAA"
    },
    "49773": {
      "school_short": "Kansas State",
      "world": "camp",
      "division": "D-IA"
    },
    "50173": {
      "school_short": "Gustavus Adolphus",
      "world": "camp",
      "division": "D-III"
    },
    "49845": {
      "school_short": "Kenyon",
      "world": "camp",
      "division": "D-III"
    },
    "49913": {
      "school_short": "East Texas Baptist",
      "world": "camp",
      "division": "D-III"
    },
    "49767": {
      "school_short": "Florida State",
      "world": "camp",
      "division": "D-IA"
    },
    "49762": {
      "school_short": "Duke",
      "world": "camp",
      "division": "D-IA"
    },
    "49932": {
      "school_short": "Colorado",
      "world": "camp",
      "division": "D-III"
    },
    "50052": {
      "school_short": "Hofstra",
      "world": "camp",
      "division": "D-IAA"
    },
    "49724": {
      "school_short": "Kutztown",
      "world": "camp",
      "division": "D-II"
    },
    "49593": {
      "school_short": "LSU",
      "world": "camp",
      "division": "D-IA"
    },
    "49931": {
      "school_short": "Macalester",
      "world": "camp",
      "division": "D-III"
    },
    "49788": {
      "school_short": "MacMurray",
      "world": "camp",
      "division": "D-III"
    },
    "49866": {
      "school_short": "Manchester",
      "world": "camp",
      "division": "D-III"
    },
    "49725": {
      "school_short": "Mansfield",
      "world": "camp",
      "division": "D-II"
    },
    "49886": {
      "school_short": "Maranatha Baptist",
      "world": "camp",
      "division": "D-III"
    },
    "50152": {
      "school_short": "Marietta",
      "world": "camp",
      "division": "D-III"
    },
    "50005": {
      "school_short": "Marist",
      "world": "camp",
      "division": "D-IAA"
    },
    "50079": {
      "school_short": "Mars Hill",
      "world": "camp",
      "division": "D-II"
    },
    "49979": {
      "school_short": "Marshall",
      "world": "camp",
      "division": "D-IA"
    },
    "49933": {
      "school_short": "Martin Luther",
      "world": "camp",
      "division": "D-III"
    },
    "49815": {
      "school_short": "Maine Maritime",
      "world": "camp",
      "division": "D-III"
    },
    "49663": {
      "school_short": "Jackson State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49950": {
      "school_short": "Lake Forest",
      "world": "camp",
      "division": "D-III"
    },
    "49797": {
      "school_short": "Loras",
      "world": "camp",
      "division": "D-III"
    },
    "50064": {
      "school_short": "Idaho State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49949": {
      "school_short": "Illinois",
      "world": "camp",
      "division": "D-III"
    },
    "49623": {
      "school_short": "Illinois State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49792": {
      "school_short": "Illinois Wesleyan",
      "world": "camp",
      "division": "D-III"
    },
    "49624": {
      "school_short": "Indiana State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49731": {
      "school_short": "Indiana (PA)",
      "world": "camp",
      "division": "D-II"
    },
    "50147": {
      "school_short": "John Carroll",
      "world": "camp",
      "division": "D-III"
    },
    "49738": {
      "school_short": "Johns Hopkins",
      "world": "camp",
      "division": "D-III"
    },
    "50125": {
      "school_short": "Johnson C. Smith",
      "world": "camp",
      "division": "D-II"
    },
    "49943": {
      "school_short": "Juniata",
      "world": "camp",
      "division": "D-III"
    },
    "49599": {
      "school_short": "Middle Tennessee State",
      "world": "camp",
      "division": "D-IA"
    },
    "49821": {
      "school_short": "Middlebury",
      "world": "camp",
      "division": "D-III"
    },
    "49756": {
      "school_short": "Ithaca",
      "world": "camp",
      "division": "D-III"
    },
    "49998": {
      "school_short": "Lafayette",
      "world": "camp",
      "division": "D-IAA"
    },
    "49934": {
      "school_short": "Husson",
      "world": "camp",
      "division": "D-III"
    },
    "49887": {
      "school_short": "Maryville",
      "world": "camp",
      "division": "D-III"
    },
    "49904": {
      "school_short": "Kentucky State",
      "world": "camp",
      "division": "D-II"
    },
    "50008": {
      "school_short": "Jacksonville State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49908": {
      "school_short": "Lane",
      "world": "camp",
      "division": "D-II"
    },
    "49910": {
      "school_short": "Kentucky Wesleyan",
      "world": "camp",
      "division": "D-II"
    },
    "50068": {
      "school_short": "Midwestern State",
      "world": "camp",
      "division": "D-II"
    },
    "49905": {
      "school_short": "Miles",
      "world": "camp",
      "division": "D-II"
    },
    "49920": {
      "school_short": "Mississippi",
      "world": "camp",
      "division": "D-III"
    },
    "49594": {
      "school_short": "Mississippi State",
      "world": "camp",
      "division": "D-IA"
    },
    "49703": {
      "school_short": "Missouri Southern State",
      "world": "camp",
      "division": "D-II"
    },
    "49699": {
      "school_short": "Missouri Western State",
      "world": "camp",
      "division": "D-II"
    },
    "50161": {
      "school_short": "Monmouth (IL)",
      "world": "camp",
      "division": "D-III"
    },
    "50036": {
      "school_short": "Monmouth",
      "world": "camp",
      "division": "D-IAA"
    },
    "50066": {
      "school_short": "Montana State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49832": {
      "school_short": "Montclair State",
      "world": "camp",
      "division": "D-III"
    },
    "49945": {
      "school_short": "Moravian",
      "world": "camp",
      "division": "D-III"
    },
    "49645": {
      "school_short": "Morehead State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49909": {
      "school_short": "Morehouse",
      "world": "camp",
      "division": "D-II"
    },
    "50033": {
      "school_short": "Morgan State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49840": {
      "school_short": "Mount Ida",
      "world": "camp",
      "division": "D-III"
    },
    "50148": {
      "school_short": "Mount Union",
      "world": "camp",
      "division": "D-III"
    },
    "50149": {
      "school_short": "Muskingum",
      "world": "camp",
      "division": "D-III"
    },
    "49888": {
      "school_short": "Nebraska Wesleyan",
      "world": "camp",
      "division": "D-III"
    },
    "50074": {
      "school_short": "New Mexico Highlands",
      "world": "camp",
      "division": "D-II"
    },
    "49604": {
      "school_short": "New Mexico State",
      "world": "camp",
      "division": "D-IA"
    },
    "50084": {
      "school_short": "Newberry",
      "world": "camp",
      "division": "D-II"
    },
    "49658": {
      "school_short": "Nicholls State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50184": {
      "school_short": "Nichols",
      "world": "camp",
      "division": "D-III"
    },
    "50034": {
      "school_short": "NC A&T",
      "world": "camp",
      "division": "D-IAA"
    },
    "50127": {
      "school_short": "North Carolina Central",
      "world": "camp",
      "division": "D-II"
    },
    "49768": {
      "school_short": "North Carolina State",
      "world": "camp",
      "division": "D-IA"
    },
    "49900": {
      "school_short": "North Central",
      "world": "camp",
      "division": "D-III"
    },
    "49901": {
      "school_short": "North Park",
      "world": "camp",
      "division": "D-III"
    },
    "49686": {
      "school_short": "Northeastern State",
      "world": "camp",
      "division": "D-II"
    },
    "50053": {
      "school_short": "Northeastern",
      "world": "camp",
      "division": "D-IAA"
    },
    "50025": {
      "school_short": "Norfolk State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49856": {
      "school_short": "Linfield",
      "world": "camp",
      "division": "D-III"
    },
    "50101": {
      "school_short": "Long Island",
      "world": "camp",
      "division": "D-II"
    },
    "49816": {
      "school_short": "Massachusetts Maritime",
      "world": "camp",
      "division": "D-III"
    },
    "49961": {
      "school_short": "Marquette",
      "world": "camp",
      "division": "D-IA"
    },
    "49700": {
      "school_short": "Northwest Missouri State",
      "world": "camp",
      "division": "D-II"
    },
    "49917": {
      "school_short": "McMurry",
      "world": "camp",
      "division": "D-III"
    },
    "49610": {
      "school_short": "Louisiana Tech",
      "world": "camp",
      "division": "D-IA"
    },
    "49916": {
      "school_short": "Louisiana",
      "world": "camp",
      "division": "D-III"
    },
    "49629": {
      "school_short": "Missouri State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50021": {
      "school_short": "Jacksonville",
      "world": "camp",
      "division": "D-IAA"
    },
    "49830": {
      "school_short": "MIT",
      "world": "camp",
      "division": "D-III"
    },
    "50132": {
      "school_short": "Mercyhurst",
      "world": "camp",
      "division": "D-II"
    },
    "50133": {
      "school_short": "Northern Michigan",
      "world": "camp",
      "division": "D-II"
    },
    "49739": {
      "school_short": "McDaniel",
      "world": "camp",
      "division": "D-III"
    },
    "50102": {
      "school_short": "Merrimack",
      "world": "camp",
      "division": "D-II"
    },
    "50073": {
      "school_short": "Mesa State",
      "world": "camp",
      "division": "D-II"
    },
    "49987": {
      "school_short": "Miami (OH)",
      "world": "camp",
      "division": "D-IA"
    },
    "49669": {
      "school_short": "Michigan Tech",
      "world": "camp",
      "division": "D-II"
    },
    "49726": {
      "school_short": "Millersville",
      "world": "camp",
      "division": "D-II"
    },
    "50111": {
      "school_short": "Minnesota State-Moorhead",
      "world": "camp",
      "division": "D-II"
    },
    "49810": {
      "school_short": "Salve Regina",
      "world": "camp",
      "division": "D-III"
    },
    "50035": {
      "school_short": "SC State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49670": {
      "school_short": "Northwood",
      "world": "camp",
      "division": "D-II"
    },
    "49781": {
      "school_short": "Oklahoma State",
      "world": "camp",
      "division": "D-IA"
    },
    "49930": {
      "school_short": "Olivet",
      "world": "camp",
      "division": "D-III"
    },
    "49574": {
      "school_short": "Oregon State",
      "world": "camp",
      "division": "D-IA"
    },
    "49667": {
      "school_short": "Prairie View",
      "world": "camp",
      "division": "D-IAA"
    },
    "50080": {
      "school_short": "Presbyterian",
      "world": "camp",
      "division": "D-II"
    },
    "49971": {
      "school_short": "Purdue",
      "world": "camp",
      "division": "D-IA"
    },
    "49860": {
      "school_short": "Randolph-Macon",
      "world": "camp",
      "division": "D-III"
    },
    "49743": {
      "school_short": "Rensselaer Tech",
      "world": "camp",
      "division": "D-III"
    },
    "49970": {
      "school_short": "Penn State",
      "world": "camp",
      "division": "D-IA"
    },
    "50009": {
      "school_short": "Murray State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49657": {
      "school_short": "McNeese State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49964": {
      "school_short": "Michigan State",
      "world": "camp",
      "division": "D-IA"
    },
    "49711": {
      "school_short": "North Dakota State",
      "world": "camp",
      "division": "D-II"
    },
    "50162": {
      "school_short": "Ripon",
      "world": "camp",
      "division": "D-III"
    },
    "49912": {
      "school_short": "Quincy",
      "world": "camp",
      "division": "D-II"
    },
    "49664": {
      "school_short": "Mississippi Valley State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49841": {
      "school_short": "Rockford",
      "world": "camp",
      "division": "D-III"
    },
    "49833": {
      "school_short": "Rowan",
      "world": "camp",
      "division": "D-III"
    },
    "50134": {
      "school_short": "Saginaw Valley State",
      "world": "camp",
      "division": "D-II"
    },
    "50106": {
      "school_short": "Saint Anselm",
      "world": "camp",
      "division": "D-II"
    },
    "49947": {
      "school_short": "Salisbury",
      "world": "camp",
      "division": "D-III"
    },
    "50067": {
      "school_short": "Sam Houston State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50010": {
      "school_short": "Samford",
      "world": "camp",
      "division": "D-IAA"
    },
    "49618": {
      "school_short": "San Jose State",
      "world": "camp",
      "division": "D-IA"
    },
    "49632": {
      "school_short": "Savannah State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49884": {
      "school_short": "Shenandoah",
      "world": "camp",
      "division": "D-III"
    },
    "50029": {
      "school_short": "Siena",
      "world": "camp",
      "division": "D-IAA"
    },
    "49799": {
      "school_short": "Simpson",
      "world": "camp",
      "division": "D-III"
    },
    "49712": {
      "school_short": "South Dakota State",
      "world": "camp",
      "division": "D-II"
    },
    "50011": {
      "school_short": "Southeast Missouri State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49633": {
      "school_short": "Southeastern Louisiana",
      "world": "camp",
      "division": "D-IAA"
    },
    "49687": {
      "school_short": "SE Oklahoma-Durant",
      "world": "camp",
      "division": "D-II"
    },
    "49681": {
      "school_short": "Southern Arkansas",
      "world": "camp",
      "division": "D-II"
    },
    "50103": {
      "school_short": "Southern Connecticut",
      "world": "camp",
      "division": "D-II"
    },
    "50069": {
      "school_short": "Oklahoma Panhandle",
      "world": "camp",
      "division": "D-II"
    },
    "49969": {
      "school_short": "Ohio State",
      "world": "camp",
      "division": "D-IA"
    },
    "49852": {
      "school_short": "Ohio Wesleyan",
      "world": "camp",
      "division": "D-III"
    },
    "49701": {
      "school_short": "Pittsburg State",
      "world": "camp",
      "division": "D-II"
    },
    "50142": {
      "school_short": "Principia",
      "world": "camp",
      "division": "D-III"
    },
    "50037": {
      "school_short": "Robert Morris",
      "world": "camp",
      "division": "D-IAA"
    },
    "50038": {
      "school_short": "Sacred Heart",
      "world": "camp",
      "division": "D-IAA"
    },
    "49874": {
      "school_short": "Occidental",
      "world": "camp",
      "division": "D-III"
    },
    "49634": {
      "school_short": "Southern Utah",
      "world": "camp",
      "division": "D-IAA"
    },
    "49710": {
      "school_short": "Minnesota State-Mankato",
      "world": "camp",
      "division": "D-II"
    },
    "49659": {
      "school_short": "Northwestern State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50120": {
      "school_short": "Shaw",
      "world": "camp",
      "division": "D-II"
    },
    "49869": {
      "school_short": "Millsaps",
      "world": "camp",
      "division": "D-III"
    },
    "49899": {
      "school_short": "Millikin",
      "world": "camp",
      "division": "D-III"
    },
    "49846": {
      "school_short": "Oberlin",
      "world": "camp",
      "division": "D-III"
    },
    "49717": {
      "school_short": "Northern State",
      "world": "camp",
      "division": "D-II"
    },
    "50061": {
      "school_short": "Portland State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49870": {
      "school_short": "Rhodes",
      "world": "camp",
      "division": "D-III"
    },
    "49976": {
      "school_short": "Rice",
      "world": "camp",
      "division": "D-IA"
    },
    "50112": {
      "school_short": "Southwest Minnesota State",
      "world": "camp",
      "division": "D-II"
    },
    "50086": {
      "school_short": "Shepherd",
      "world": "camp",
      "division": "D-II"
    },
    "49733": {
      "school_short": "Slippery Rock",
      "world": "camp",
      "division": "D-II"
    },
    "49617": {
      "school_short": "San Diego State",
      "world": "camp",
      "division": "D-IA"
    },
    "50065": {
      "school_short": "Northern Arizona",
      "world": "camp",
      "division": "D-IAA"
    },
    "49857": {
      "school_short": "Pacific Lutheran",
      "world": "camp",
      "division": "D-III"
    },
    "49747": {
      "school_short": "Norwich",
      "world": "camp",
      "division": "D-III"
    },
    "49642": {
      "school_short": "Princeton",
      "world": "camp",
      "division": "D-IAA"
    },
    "49732": {
      "school_short": "Shippensburg",
      "world": "camp",
      "division": "D-II"
    },
    "50153": {
      "school_short": "Otterbein",
      "world": "camp",
      "division": "D-III"
    },
    "49753": {
      "school_short": "Springfield",
      "world": "camp",
      "division": "D-III"
    },
    "50128": {
      "school_short": "St. Augustine`s",
      "world": "camp",
      "division": "D-II"
    },
    "50163": {
      "school_short": "St. Norbert",
      "world": "camp",
      "division": "D-III"
    },
    "50178": {
      "school_short": "St. Olaf",
      "world": "camp",
      "division": "D-III"
    },
    "49713": {
      "school_short": "St. Cloud State",
      "world": "camp",
      "division": "D-II"
    },
    "49584": {
      "school_short": "Stanford",
      "world": "camp",
      "division": "D-IA"
    },
    "50107": {
      "school_short": "Stonehill",
      "world": "camp",
      "division": "D-II"
    },
    "50039": {
      "school_short": "Stony Brook",
      "world": "camp",
      "division": "D-IAA"
    },
    "50012": {
      "school_short": "Tennessee State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49694": {
      "school_short": "Texas A&M-Commerce",
      "world": "camp",
      "division": "D-II"
    },
    "49981": {
      "school_short": "Texas Christian",
      "world": "camp",
      "division": "D-IA"
    },
    "49922": {
      "school_short": "Texas Lutheran",
      "world": "camp",
      "division": "D-III"
    },
    "50115": {
      "school_short": "Texas Southern",
      "world": "camp",
      "division": "D-IAA"
    },
    "49782": {
      "school_short": "Texas Tech",
      "world": "camp",
      "division": "D-IA"
    },
    "49804": {
      "school_short": "Thiel",
      "world": "camp",
      "division": "D-III"
    },
    "49889": {
      "school_short": "Thomas More",
      "world": "camp",
      "division": "D-III"
    },
    "50000": {
      "school_short": "Towson",
      "world": "camp",
      "division": "D-IAA"
    },
    "49822": {
      "school_short": "Trinity",
      "world": "camp",
      "division": "D-III"
    },
    "49702": {
      "school_short": "Truman State",
      "world": "camp",
      "division": "D-II"
    },
    "49823": {
      "school_short": "Tufts",
      "world": "camp",
      "division": "D-III"
    },
    "49991": {
      "school_short": "Buffalo",
      "world": "camp",
      "division": "D-IA"
    },
    "49921": {
      "school_short": "Sul Ross State",
      "world": "camp",
      "division": "D-III"
    },
    "49609": {
      "school_short": "Troy State",
      "world": "camp",
      "division": "D-IA"
    },
    "49622": {
      "school_short": "Texas State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49749": {
      "school_short": "Coast Guard",
      "world": "camp",
      "division": "D-III"
    },
    "49990": {
      "school_short": "Ohio",
      "world": "camp",
      "division": "D-IA"
    },
    "49982": {
      "school_short": "Tulane",
      "world": "camp",
      "division": "D-IA"
    },
    "49983": {
      "school_short": "Alabama Birmingham",
      "world": "camp",
      "division": "D-IA"
    },
    "49682": {
      "school_short": "Arkansas-Monticello",
      "world": "camp",
      "division": "D-II"
    },
    "49935": {
      "school_short": "Brockport",
      "world": "camp",
      "division": "D-III"
    },
    "49834": {
      "school_short": "Cortland",
      "world": "camp",
      "division": "D-III"
    },
    "49940": {
      "school_short": "Susquehanna",
      "world": "camp",
      "division": "D-III"
    },
    "49835": {
      "school_short": "New Jersey",
      "world": "camp",
      "division": "D-III"
    },
    "49745": {
      "school_short": "Union (NY)",
      "world": "camp",
      "division": "D-III"
    },
    "49625": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "camp",
      "division": "D-IAA"
    },
    "50174": {
      "school_short": "St. John`s",
      "world": "camp",
      "division": "D-III"
    },
    "49744": {
      "school_short": "St. Lawrence",
      "world": "camp",
      "division": "D-III"
    },
    "49621": {
      "school_short": "Stephen F. Austin",
      "world": "camp",
      "division": "D-IAA"
    },
    "49906": {
      "school_short": "Tuskegee",
      "world": "camp",
      "division": "D-II"
    },
    "49966": {
      "school_short": "Michigan",
      "world": "camp",
      "division": "D-IA"
    },
    "50091": {
      "school_short": "Nebraska-Omaha",
      "world": "camp",
      "division": "D-II"
    },
    "49858": {
      "school_short": "Puget Sound",
      "world": "camp",
      "division": "D-III"
    },
    "50116": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "camp",
      "division": "D-IAA"
    },
    "49677": {
      "school_short": "Central Arkansas",
      "world": "camp",
      "division": "D-II"
    },
    "49719": {
      "school_short": "Charleston",
      "world": "camp",
      "division": "D-II"
    },
    "49803": {
      "school_short": "Dubuque",
      "world": "camp",
      "division": "D-III"
    },
    "49876": {
      "school_short": "La Verne",
      "world": "camp",
      "division": "D-III"
    },
    "49600": {
      "school_short": "Louisiana Lafayette",
      "world": "camp",
      "division": "D-IA"
    },
    "49601": {
      "school_short": "Louisiana Monroe",
      "world": "camp",
      "division": "D-IA"
    },
    "49957": {
      "school_short": "Louisville",
      "world": "camp",
      "division": "D-IA"
    },
    "50054": {
      "school_short": "Maine",
      "world": "camp",
      "division": "D-IAA"
    },
    "50049": {
      "school_short": "Massachusetts",
      "world": "camp",
      "division": "D-IAA"
    },
    "50105": {
      "school_short": "Pace",
      "world": "camp",
      "division": "D-II"
    },
    "50043": {
      "school_short": "Saint Francis",
      "world": "camp",
      "division": "D-IAA"
    },
    "49875": {
      "school_short": "Pomona-Pitzers",
      "world": "camp",
      "division": "D-III"
    },
    "50081": {
      "school_short": "Tusculum",
      "world": "camp",
      "division": "D-II"
    },
    "49872": {
      "school_short": "Trinity (TX)",
      "world": "camp",
      "division": "D-III"
    },
    "49750": {
      "school_short": "Merchant Marine",
      "world": "camp",
      "division": "D-III"
    },
    "49911": {
      "school_short": "Saint Joseph`s",
      "world": "camp",
      "division": "D-II"
    },
    "49675": {
      "school_short": "Ouachita Baptist",
      "world": "camp",
      "division": "D-II"
    },
    "49953": {
      "school_short": "Temple",
      "world": "camp",
      "division": "D-IA"
    },
    "49651": {
      "school_short": "Citadel",
      "world": "camp",
      "division": "D-IAA"
    },
    "49783": {
      "school_short": "Texas A&M",
      "world": "camp",
      "division": "D-IA"
    },
    "50040": {
      "school_short": "Albany",
      "world": "camp",
      "division": "D-IAA"
    },
    "49985": {
      "school_short": "Houston",
      "world": "camp",
      "division": "D-IA"
    },
    "49757": {
      "school_short": "St. John Fisher",
      "world": "camp",
      "division": "D-III"
    },
    "49973": {
      "school_short": "Iowa",
      "world": "camp",
      "division": "D-IA"
    },
    "49918": {
      "school_short": "Mary Hardin-Baylor",
      "world": "camp",
      "division": "D-III"
    },
    "50045": {
      "school_short": "Nevada",
      "world": "camp",
      "division": "D-IA"
    },
    "49952": {
      "school_short": "Syracuse",
      "world": "camp",
      "division": "D-IA"
    },
    "49955": {
      "school_short": "Pittsburgh",
      "world": "camp",
      "division": "D-IA"
    },
    "49988": {
      "school_short": "Akron",
      "world": "camp",
      "division": "D-IA"
    },
    "49775": {
      "school_short": "Missouri",
      "world": "camp",
      "division": "D-IA"
    },
    "50075": {
      "school_short": "Nebraska-Kearney",
      "world": "camp",
      "division": "D-II"
    },
    "49613": {
      "school_short": "New Mexico",
      "world": "camp",
      "division": "D-IA"
    },
    "49683": {
      "school_short": "North Alabama",
      "world": "camp",
      "division": "D-II"
    },
    "50092": {
      "school_short": "North Dakota",
      "world": "camp",
      "division": "D-II"
    },
    "49606": {
      "school_short": "North Texas",
      "world": "camp",
      "division": "D-IA"
    },
    "49974": {
      "school_short": "Notre Dame",
      "world": "camp",
      "division": "D-IA"
    },
    "49877": {
      "school_short": "Redlands",
      "world": "camp",
      "division": "D-III"
    },
    "50050": {
      "school_short": "Rhode Island",
      "world": "camp",
      "division": "D-IAA"
    },
    "49575": {
      "school_short": "Oregon",
      "world": "camp",
      "division": "D-IA"
    },
    "49689": {
      "school_short": "Tarleton State",
      "world": "camp",
      "division": "D-II"
    },
    "50006": {
      "school_short": "St. Peter`s",
      "world": "camp",
      "division": "D-IAA"
    },
    "49770": {
      "school_short": "Miami (FL)",
      "world": "camp",
      "division": "D-IA"
    },
    "49591": {
      "school_short": "Kentucky",
      "world": "camp",
      "division": "D-IA"
    },
    "49715": {
      "school_short": "Minnesota-Duluth",
      "world": "camp",
      "division": "D-II"
    },
    "49690": {
      "school_short": "Central Oklahoma",
      "world": "camp",
      "division": "D-II"
    },
    "49597": {
      "school_short": "Ole Miss",
      "world": "camp",
      "division": "D-IA"
    },
    "49596": {
      "school_short": "Arkansas",
      "world": "camp",
      "division": "D-IA"
    },
    "50114": {
      "school_short": "Southern-Baton Rouge",
      "world": "camp",
      "division": "D-IAA"
    },
    "49605": {
      "school_short": "Idaho",
      "world": "camp",
      "division": "D-IA"
    },
    "50135": {
      "school_short": "Indianapolis",
      "world": "camp",
      "division": "D-II"
    },
    "50113": {
      "school_short": "Minnesota-Crookston",
      "world": "camp",
      "division": "D-II"
    },
    "49705": {
      "school_short": "Missouri-Rolla",
      "world": "camp",
      "division": "D-II"
    },
    "49639": {
      "school_short": "Pennsylvania",
      "world": "camp",
      "division": "D-IAA"
    },
    "49615": {
      "school_short": "Wyoming",
      "world": "camp",
      "division": "D-IA"
    },
    "49607": {
      "school_short": "Utah State",
      "world": "camp",
      "division": "D-IA"
    },
    "50093": {
      "school_short": "South Dakota",
      "world": "camp",
      "division": "D-II"
    },
    "49986": {
      "school_short": "Southern Mississippi",
      "world": "camp",
      "division": "D-IA"
    },
    "49873": {
      "school_short": "South-Sewanee",
      "world": "camp",
      "division": "D-III"
    },
    "49994": {
      "school_short": "Toledo",
      "world": "camp",
      "division": "D-IA"
    },
    "49977": {
      "school_short": "Tulsa",
      "world": "camp",
      "division": "D-IA"
    },
    "49892": {
      "school_short": "Wisconsin-La Crosse",
      "world": "camp",
      "division": "D-III"
    },
    "49893": {
      "school_short": "Wisconsin-Platteville",
      "world": "camp",
      "division": "D-III"
    },
    "49894": {
      "school_short": "Wisconsin-River Falls",
      "world": "camp",
      "division": "D-III"
    },
    "49895": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "camp",
      "division": "D-III"
    },
    "49898": {
      "school_short": "Wisconsin-Stout",
      "world": "camp",
      "division": "D-III"
    },
    "49741": {
      "school_short": "Ursinus",
      "world": "camp",
      "division": "D-III"
    },
    "49684": {
      "school_short": "Valdosta State",
      "world": "camp",
      "division": "D-II"
    },
    "50051": {
      "school_short": "Villanova",
      "world": "camp",
      "division": "D-IAA"
    },
    "50018": {
      "school_short": "VMI",
      "world": "camp",
      "division": "D-IAA"
    },
    "50122": {
      "school_short": "Virginia Union",
      "world": "camp",
      "division": "D-II"
    },
    "49800": {
      "school_short": "Wartburg",
      "world": "camp",
      "division": "D-III"
    },
    "49706": {
      "school_short": "Washburn-Topeka",
      "world": "camp",
      "division": "D-II"
    },
    "49805": {
      "school_short": "Washington and Jefferson",
      "world": "camp",
      "division": "D-III"
    },
    "49861": {
      "school_short": "Washington and Lee",
      "world": "camp",
      "division": "D-III"
    },
    "49577": {
      "school_short": "Washington State",
      "world": "camp",
      "division": "D-IA"
    },
    "49806": {
      "school_short": "Waynesburg",
      "world": "camp",
      "division": "D-III"
    },
    "50062": {
      "school_short": "Weber State",
      "world": "camp",
      "division": "D-IAA"
    },
    "49718": {
      "school_short": "Wayne State",
      "world": "camp",
      "division": "D-II"
    },
    "49672": {
      "school_short": "Wayne State",
      "world": "camp",
      "division": "D-II"
    },
    "50175": {
      "school_short": "St. Thomas",
      "world": "camp",
      "division": "D-III"
    },
    "49780": {
      "school_short": "Texas",
      "world": "camp",
      "division": "D-IA"
    },
    "49612": {
      "school_short": "UTEP",
      "world": "camp",
      "division": "D-IA"
    },
    "50048": {
      "school_short": "Delaware",
      "world": "camp",
      "division": "D-IAA"
    },
    "49588": {
      "school_short": "Florida",
      "world": "camp",
      "division": "D-IA"
    },
    "49777": {
      "school_short": "Colorado",
      "world": "camp",
      "division": "D-IA"
    },
    "49614": {
      "school_short": "Utah",
      "world": "camp",
      "division": "D-IA"
    },
    "50055": {
      "school_short": "New Hampshire",
      "world": "camp",
      "division": "D-IAA"
    },
    "49576": {
      "school_short": "Washington",
      "world": "camp",
      "division": "D-IA"
    },
    "49608": {
      "school_short": "Montana",
      "world": "camp",
      "division": "D-IA"
    },
    "50168": {
      "school_short": "Chicago",
      "world": "camp",
      "division": "D-III"
    },
    "49630": {
      "school_short": "Northern Iowa",
      "world": "camp",
      "division": "D-IAA"
    },
    "49963": {
      "school_short": "Illinois",
      "world": "camp",
      "division": "D-IA"
    },
    "49774": {
      "school_short": "Nebraska",
      "world": "camp",
      "division": "D-IA"
    },
    "49779": {
      "school_short": "Oklahoma",
      "world": "camp",
      "division": "D-IA"
    },
    "49978": {
      "school_short": "Memphis",
      "world": "camp",
      "division": "D-IA"
    },
    "49671": {
      "school_short": "Findlay",
      "world": "camp",
      "division": "D-II"
    },
    "49581": {
      "school_short": "Arizona",
      "world": "camp",
      "division": "D-IA"
    },
    "49776": {
      "school_short": "Kansas",
      "world": "camp",
      "division": "D-IA"
    },
    "49764": {
      "school_short": "North Carolina",
      "world": "camp",
      "division": "D-IA"
    },
    "49959": {
      "school_short": "South Florida",
      "world": "camp",
      "division": "D-IA"
    },
    "49620": {
      "school_short": "Hawaii",
      "world": "camp",
      "division": "D-IA"
    },
    "49769": {
      "school_short": "Maryland",
      "world": "camp",
      "division": "D-IA"
    },
    "49585": {
      "school_short": "Air Force",
      "world": "camp",
      "division": "D-IA"
    },
    "49678": {
      "school_short": "West Alabama",
      "world": "camp",
      "division": "D-II"
    },
    "49897": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "camp",
      "division": "D-III"
    },
    "49758": {
      "school_short": "Utica",
      "world": "camp",
      "division": "D-III"
    },
    "49589": {
      "school_short": "Vanderbilt",
      "world": "camp",
      "division": "D-IA"
    },
    "49847": {
      "school_short": "Wabash",
      "world": "camp",
      "division": "D-III"
    },
    "50041": {
      "school_short": "Wagner",
      "world": "camp",
      "division": "D-IAA"
    },
    "50056": {
      "school_short": "Richmond",
      "world": "camp",
      "division": "D-IAA"
    },
    "49656": {
      "school_short": "Tennessee-Chattanooga",
      "world": "camp",
      "division": "D-IAA"
    },
    "50003": {
      "school_short": "Tennessee-Martin",
      "world": "camp",
      "division": "D-IAA"
    },
    "49891": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "camp",
      "division": "D-III"
    },
    "49746": {
      "school_short": "Rochester",
      "world": "camp",
      "division": "D-III"
    },
    "50455": {
      "school_short": "Allegheny",
      "world": "bryant",
      "division": "D-III"
    },
    "50716": {
      "school_short": "Assumption",
      "world": "bryant",
      "division": "D-II"
    },
    "49968": {
      "school_short": "Wisconsin",
      "world": "camp",
      "division": "D-IA"
    },
    "50285": {
      "school_short": "Arkansas Tech",
      "world": "bryant",
      "division": "D-II"
    },
    "49967": {
      "school_short": "Minnesota",
      "world": "camp",
      "division": "D-IA"
    },
    "49842": {
      "school_short": "Wesley",
      "world": "camp",
      "division": "D-III"
    },
    "49771": {
      "school_short": "Virginia Tech",
      "world": "camp",
      "division": "D-IA"
    },
    "49766": {
      "school_short": "Wake Forest",
      "world": "camp",
      "division": "D-IA"
    },
    "50169": {
      "school_short": "Washington (MO)",
      "world": "camp",
      "division": "D-III"
    },
    "49676": {
      "school_short": "West Georgia",
      "world": "camp",
      "division": "D-II"
    },
    "49896": {
      "school_short": "Wisconsin-Whitewater",
      "world": "camp",
      "division": "D-III"
    },
    "49587": {
      "school_short": "Tennessee",
      "world": "camp",
      "division": "D-IA"
    },
    "50366": {
      "school_short": "Alfred",
      "world": "bryant",
      "division": "D-III"
    },
    "49727": {
      "school_short": "West Chester",
      "world": "camp",
      "division": "D-II"
    },
    "49721": {
      "school_short": "West Virginia State",
      "world": "camp",
      "division": "D-II"
    },
    "50088": {
      "school_short": "West Virginia Wesleyan",
      "world": "camp",
      "division": "D-II"
    },
    "49751": {
      "school_short": "Western Connecticut State",
      "world": "camp",
      "division": "D-III"
    },
    "49626": {
      "school_short": "Western Illinois",
      "world": "camp",
      "division": "D-IAA"
    },
    "49627": {
      "school_short": "Western Kentucky",
      "world": "camp",
      "division": "D-IAA"
    },
    "49812": {
      "school_short": "Western New England",
      "world": "camp",
      "division": "D-III"
    },
    "50070": {
      "school_short": "Western New Mexico",
      "world": "camp",
      "division": "D-II"
    },
    "50096": {
      "school_short": "Western Oregon",
      "world": "camp",
      "division": "D-II"
    },
    "50076": {
      "school_short": "Western State (CO)",
      "world": "camp",
      "division": "D-II"
    },
    "50097": {
      "school_short": "Western Washington",
      "world": "camp",
      "division": "D-II"
    },
    "49817": {
      "school_short": "Westfield State",
      "world": "camp",
      "division": "D-III"
    },
    "50137": {
      "school_short": "Whitworth",
      "world": "camp",
      "division": "D-III"
    },
    "49941": {
      "school_short": "Wilkes",
      "world": "camp",
      "division": "D-III"
    },
    "50138": {
      "school_short": "Willamette",
      "world": "camp",
      "division": "D-III"
    },
    "49824": {
      "school_short": "Williams",
      "world": "camp",
      "division": "D-III"
    },
    "49714": {
      "school_short": "Winona State",
      "world": "camp",
      "division": "D-II"
    },
    "49752": {
      "school_short": "Worcester Tech",
      "world": "camp",
      "division": "D-III"
    },
    "49818": {
      "school_short": "Worcester State",
      "world": "camp",
      "division": "D-III"
    },
    "49640": {
      "school_short": "Yale",
      "world": "camp",
      "division": "D-IAA"
    },
    "49720": {
      "school_short": "West Liberty State",
      "world": "camp",
      "division": "D-II"
    },
    "50181": {
      "school_short": "Westminster (PA)",
      "world": "camp",
      "division": "D-III"
    },
    "49878": {
      "school_short": "Whittier",
      "world": "camp",
      "division": "D-III"
    },
    "49836": {
      "school_short": "William Paterson",
      "world": "camp",
      "division": "D-III"
    },
    "49929": {
      "school_short": "Wisconsin Lutheran",
      "world": "camp",
      "division": "D-III"
    },
    "49848": {
      "school_short": "Wittenberg",
      "world": "camp",
      "division": "D-III"
    },
    "50273": {
      "school_short": "Alabama State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50514": {
      "school_short": "Carthage",
      "world": "bryant",
      "division": "D-III"
    },
    "50408": {
      "school_short": "Central",
      "world": "bryant",
      "division": "D-III"
    },
    "50491": {
      "school_short": "Averett",
      "world": "bryant",
      "division": "D-III"
    },
    "50609": {
      "school_short": "Ball State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50401": {
      "school_short": "Benedictine",
      "world": "bryant",
      "division": "D-III"
    },
    "50334": {
      "school_short": "Bloomsburg",
      "world": "bryant",
      "division": "D-II"
    },
    "50475": {
      "school_short": "Bluffton",
      "world": "bryant",
      "division": "D-III"
    },
    "49828": {
      "school_short": "Wesleyan",
      "world": "camp",
      "division": "D-III"
    },
    "50121": {
      "school_short": "Virginia State",
      "world": "camp",
      "division": "D-II"
    },
    "50742": {
      "school_short": "Ashland",
      "world": "bryant",
      "division": "D-II"
    },
    "50421": {
      "school_short": "Alma",
      "world": "bryant",
      "division": "D-III"
    },
    "50783": {
      "school_short": "Bethel",
      "world": "bryant",
      "division": "D-III"
    },
    "49696": {
      "school_short": "West Texas A&M",
      "world": "camp",
      "division": "D-II"
    },
    "49996": {
      "school_short": "Western Michigan",
      "world": "camp",
      "division": "D-IA"
    },
    "50015": {
      "school_short": "Dayton",
      "world": "camp",
      "division": "D-IAA"
    },
    "50210": {
      "school_short": "Arkansas State",
      "world": "bryant",
      "division": "D-IA"
    },
    "49765": {
      "school_short": "Virginia",
      "world": "camp",
      "division": "D-IA"
    },
    "50017": {
      "school_short": "Valparaiso",
      "world": "camp",
      "division": "D-IAA"
    },
    "50782": {
      "school_short": "Augsburg",
      "world": "bryant",
      "division": "D-III"
    },
    "50701": {
      "school_short": "Albany State",
      "world": "bryant",
      "division": "D-II"
    },
    "50560": {
      "school_short": "Beloit",
      "world": "bryant",
      "division": "D-III"
    },
    "50260": {
      "school_short": "Appalachian State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50548": {
      "school_short": "Albright",
      "world": "bryant",
      "division": "D-III"
    },
    "50710": {
      "school_short": "American International",
      "world": "bryant",
      "division": "D-II"
    },
    "50255": {
      "school_short": "Bucknell",
      "world": "bryant",
      "division": "D-IAA"
    },
    "49628": {
      "school_short": "Youngstown State",
      "world": "camp",
      "division": "D-IAA"
    },
    "50757": {
      "school_short": "Baldwin-Wallace",
      "world": "bryant",
      "division": "D-III"
    },
    "49946": {
      "school_short": "Widener",
      "world": "camp",
      "division": "D-III"
    },
    "50605": {
      "school_short": "Bowling Green",
      "world": "bryant",
      "division": "D-IA"
    },
    "50711": {
      "school_short": "Bentley",
      "world": "bryant",
      "division": "D-II"
    },
    "50384": {
      "school_short": "Boston",
      "world": "bryant",
      "division": "D-IA"
    },
    "50756": {
      "school_short": "Blackburn",
      "world": "bryant",
      "division": "D-III"
    },
    "50431": {
      "school_short": "Amherst",
      "world": "bryant",
      "division": "D-III"
    },
    "49653": {
      "school_short": "Wofford",
      "world": "camp",
      "division": "D-IAA"
    },
    "50272": {
      "school_short": "Alabama A&M",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50625": {
      "school_short": "Butler",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50776": {
      "school_short": "Carroll",
      "world": "bryant",
      "division": "D-III"
    },
    "50466": {
      "school_short": "Case Western",
      "world": "bryant",
      "division": "D-III"
    },
    "50654": {
      "school_short": "Central Connecticut",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50185": {
      "school_short": "Central Michigan",
      "world": "bryant",
      "division": "D-IA"
    },
    "50309": {
      "school_short": "Central Missouri State",
      "world": "bryant",
      "division": "D-II"
    },
    "50706": {
      "school_short": "Central Washington",
      "world": "bryant",
      "division": "D-II"
    },
    "50450": {
      "school_short": "Chapman",
      "world": "bryant",
      "division": "D-III"
    },
    "50258": {
      "school_short": "Charleston Southern",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50702": {
      "school_short": "Benedict",
      "world": "bryant",
      "division": "D-II"
    },
    "50321": {
      "school_short": "Augustana",
      "world": "bryant",
      "division": "D-II"
    },
    "50721": {
      "school_short": "Fairmont State",
      "world": "bryant",
      "division": "D-II"
    },
    "50432": {
      "school_short": "Colby",
      "world": "bryant",
      "division": "D-III"
    },
    "50767": {
      "school_short": "Mount St. Joseph",
      "world": "bryant",
      "division": "D-III"
    },
    "50634": {
      "school_short": "Holy Cross",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50248": {
      "school_short": "Columbia",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50720": {
      "school_short": "Concord",
      "world": "bryant",
      "division": "D-II"
    },
    "50372": {
      "school_short": "Concordia (WI)",
      "world": "bryant",
      "division": "D-III"
    },
    "50253": {
      "school_short": "Cornell",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50572": {
      "school_short": "DePaul",
      "world": "bryant",
      "division": "D-IA"
    },
    "50480": {
      "school_short": "DePauw",
      "world": "bryant",
      "division": "D-III"
    },
    "50297": {
      "school_short": "East Central",
      "world": "bryant",
      "division": "D-II"
    },
    "50335": {
      "school_short": "East Stroudsburg",
      "world": "bryant",
      "division": "D-II"
    },
    "50266": {
      "school_short": "East Tennessee State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50619": {
      "school_short": "Eastern Kentucky",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50604": {
      "school_short": "Eastern Michigan",
      "world": "bryant",
      "division": "D-IA"
    },
    "50712": {
      "school_short": "Bryant",
      "world": "bryant",
      "division": "D-II"
    },
    "50371": {
      "school_short": "Aurora",
      "world": "bryant",
      "division": "D-III"
    },
    "50770": {
      "school_short": "Catholic",
      "world": "bryant",
      "division": "D-III"
    },
    "50303": {
      "school_short": "Abilene Christian",
      "world": "bryant",
      "division": "D-II"
    },
    "50788": {
      "school_short": "Carleton",
      "world": "bryant",
      "division": "D-III"
    },
    "50525": {
      "school_short": "East Texas Baptist",
      "world": "bryant",
      "division": "D-III"
    },
    "50626": {
      "school_short": "Drake",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50537": {
      "school_short": "Dickinson",
      "world": "bryant",
      "division": "D-III"
    },
    "50256": {
      "school_short": "Colgate",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50751": {
      "school_short": "Eastern Oregon",
      "world": "bryant",
      "division": "D-III"
    },
    "50420": {
      "school_short": "Albion",
      "world": "bryant",
      "division": "D-III"
    },
    "50425": {
      "school_short": "Bridgewater State",
      "world": "bryant",
      "division": "D-III"
    },
    "50192": {
      "school_short": "Arizona State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50304": {
      "school_short": "Angelo State",
      "world": "bryant",
      "division": "D-II"
    },
    "50784": {
      "school_short": "Concordia",
      "world": "bryant",
      "division": "D-III"
    },
    "50191": {
      "school_short": "BYU",
      "world": "bryant",
      "division": "D-IA"
    },
    "50396": {
      "school_short": "Baylor",
      "world": "bryant",
      "division": "D-IA"
    },
    "50658": {
      "school_short": "William & Mary",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50305": {
      "school_short": "Eastern New Mexico",
      "world": "bryant",
      "division": "D-II"
    },
    "50247": {
      "school_short": "Brown",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50438": {
      "school_short": "Bowdoin",
      "world": "bryant",
      "division": "D-III"
    },
    "50683": {
      "school_short": "Adams State",
      "world": "bryant",
      "division": "D-II"
    },
    "50402": {
      "school_short": "Concordia (IL)",
      "world": "bryant",
      "division": "D-III"
    },
    "50405": {
      "school_short": "Augustana (IL)",
      "world": "bryant",
      "division": "D-III"
    },
    "50419": {
      "school_short": "Adrian",
      "world": "bryant",
      "division": "D-III"
    },
    "49956": {
      "school_short": "West Virginia",
      "world": "camp",
      "division": "D-IA"
    },
    "50249": {
      "school_short": "Dartmouth",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50154": {
      "school_short": "Wilmington (OH)",
      "world": "camp",
      "division": "D-III"
    },
    "50082": {
      "school_short": "Wingate",
      "world": "camp",
      "division": "D-II"
    },
    "50690": {
      "school_short": "Catawba",
      "world": "bryant",
      "division": "D-II"
    },
    "50346": {
      "school_short": "Chadron State",
      "world": "bryant",
      "division": "D-II"
    },
    "50474": {
      "school_short": "Anderson",
      "world": "bryant",
      "division": "D-III"
    },
    "50129": {
      "school_short": "Winston-Salem State",
      "world": "camp",
      "division": "D-II"
    },
    "50437": {
      "school_short": "Bates",
      "world": "bryant",
      "division": "D-III"
    },
    "50769": {
      "school_short": "Bridgewater",
      "world": "bryant",
      "division": "D-III"
    },
    "50204": {
      "school_short": "Auburn",
      "world": "bryant",
      "division": "D-IA"
    },
    "50791": {
      "school_short": "Bethany",
      "world": "bryant",
      "division": "D-III"
    },
    "50671": {
      "school_short": "Eastern Washington",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50731": {
      "school_short": "Elizabeth City",
      "world": "bryant",
      "division": "D-II"
    },
    "50403": {
      "school_short": "Elmhurst",
      "world": "bryant",
      "division": "D-III"
    },
    "50397": {
      "school_short": "Eureka",
      "world": "bryant",
      "division": "D-III"
    },
    "50407": {
      "school_short": "Buena Vista",
      "world": "bryant",
      "division": "D-III"
    },
    "50310": {
      "school_short": "Emporia State",
      "world": "bryant",
      "division": "D-II"
    },
    "50795": {
      "school_short": "Endicott",
      "world": "bryant",
      "division": "D-III"
    },
    "50228": {
      "school_short": "Fresno State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50461": {
      "school_short": "Denison",
      "world": "bryant",
      "division": "D-III"
    },
    "50613": {
      "school_short": "Eastern Illinois",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50632": {
      "school_short": "Davidson",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50497": {
      "school_short": "Chowan",
      "world": "bryant",
      "division": "D-III"
    },
    "50736": {
      "school_short": "Fayetteville State",
      "world": "bryant",
      "division": "D-II"
    },
    "50638": {
      "school_short": "Delaware State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50492": {
      "school_short": "Christopher Newport",
      "world": "bryant",
      "division": "D-III"
    },
    "50456": {
      "school_short": "Wooster",
      "world": "bryant",
      "division": "D-III"
    },
    "50794": {
      "school_short": "Curry",
      "world": "bryant",
      "division": "D-III"
    },
    "50763": {
      "school_short": "Heidelberg",
      "world": "bryant",
      "division": "D-III"
    },
    "50616": {
      "school_short": "Iona",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50426": {
      "school_short": "Fitchburg State",
      "world": "bryant",
      "division": "D-III"
    },
    "50636": {
      "school_short": "Florida A&M",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50684": {
      "school_short": "Fort Lewis",
      "world": "bryant",
      "division": "D-II"
    },
    "50515": {
      "school_short": "Fort Valley State",
      "world": "bryant",
      "division": "D-II"
    },
    "50441": {
      "school_short": "Framingham State",
      "world": "bryant",
      "division": "D-III"
    },
    "50476": {
      "school_short": "Franklin",
      "world": "bryant",
      "division": "D-III"
    },
    "50277": {
      "school_short": "Gardner-Webb",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50375": {
      "school_short": "Georgia Tech",
      "world": "bryant",
      "division": "D-IA"
    },
    "50743": {
      "school_short": "Grand Valley State",
      "world": "bryant",
      "division": "D-II"
    },
    "50792": {
      "school_short": "Grove City",
      "world": "bryant",
      "division": "D-III"
    },
    "50772": {
      "school_short": "Guilford",
      "world": "bryant",
      "division": "D-III"
    },
    "50643": {
      "school_short": "Hampton",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50286": {
      "school_short": "Harding",
      "world": "bryant",
      "division": "D-II"
    },
    "50463": {
      "school_short": "Hiram",
      "world": "bryant",
      "division": "D-III"
    },
    "50664": {
      "school_short": "Hofstra",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50644": {
      "school_short": "Howard",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50676": {
      "school_short": "Idaho State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50343": {
      "school_short": "Indiana (PA)",
      "world": "bryant",
      "division": "D-II"
    },
    "50635": {
      "school_short": "Fordham",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50278": {
      "school_short": "Grambling State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50494": {
      "school_short": "Greensboro",
      "world": "bryant",
      "division": "D-III"
    },
    "50342": {
      "school_short": "Edinboro",
      "world": "bryant",
      "division": "D-II"
    },
    "50789": {
      "school_short": "Hamline",
      "world": "bryant",
      "division": "D-III"
    },
    "50479": {
      "school_short": "Centre",
      "world": "bryant",
      "division": "D-III"
    },
    "50531": {
      "school_short": "Austin",
      "world": "bryant",
      "division": "D-III"
    },
    "50341": {
      "school_short": "Clarion",
      "world": "bryant",
      "division": "D-II"
    },
    "50414": {
      "school_short": "Cornell",
      "world": "bryant",
      "division": "D-III"
    },
    "50549": {
      "school_short": "Delaware Valley",
      "world": "bryant",
      "division": "D-III"
    },
    "50280": {
      "school_short": "Hillsdale",
      "world": "bryant",
      "division": "D-II"
    },
    "50354": {
      "school_short": "Hobart",
      "world": "bryant",
      "division": "D-III"
    },
    "50526": {
      "school_short": "Hardin-Simmons",
      "world": "bryant",
      "division": "D-III"
    },
    "50689": {
      "school_short": "Carson-Newman",
      "world": "bryant",
      "division": "D-II"
    },
    "50752": {
      "school_short": "Frostburg State",
      "world": "bryant",
      "division": "D-III"
    },
    "50368": {
      "school_short": "Ithaca",
      "world": "bryant",
      "division": "D-III"
    },
    "50546": {
      "school_short": "Husson",
      "world": "bryant",
      "division": "D-III"
    },
    "50554": {
      "school_short": "Fairleigh Dickinson",
      "world": "bryant",
      "division": "D-III"
    },
    "50291": {
      "school_short": "Delta State",
      "world": "bryant",
      "division": "D-II"
    },
    "50471": {
      "school_short": "Hampden-Sydney",
      "world": "bryant",
      "division": "D-III"
    },
    "50413": {
      "school_short": "Coe",
      "world": "bryant",
      "division": "D-III"
    },
    "50777": {
      "school_short": "Grinnell",
      "world": "bryant",
      "division": "D-III"
    },
    "50639": {
      "school_short": "Duquesne",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50267": {
      "school_short": "Elon",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50465": {
      "school_short": "Carnegie Mellon",
      "world": "bryant",
      "division": "D-III"
    },
    "50449": {
      "school_short": "Buffalo",
      "world": "bryant",
      "division": "D-III"
    },
    "50758": {
      "school_short": "Capital",
      "world": "bryant",
      "division": "D-III"
    },
    "50587": {
      "school_short": "East Carolina",
      "world": "bryant",
      "division": "D-IA"
    },
    "50236": {
      "school_short": "Indiana State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50785": {
      "school_short": "Gustavus Adolphus",
      "world": "bryant",
      "division": "D-III"
    },
    "50670": {
      "school_short": "California State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50771": {
      "school_short": "Emory and Henry",
      "world": "bryant",
      "division": "D-III"
    },
    "50320": {
      "school_short": "Cheyney",
      "world": "bryant",
      "division": "D-II"
    },
    "50574": {
      "school_short": "Colorado State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50379": {
      "school_short": "Florida State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50261": {
      "school_short": "Furman",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50340": {
      "school_short": "California (PA)",
      "world": "bryant",
      "division": "D-II"
    },
    "50631": {
      "school_short": "Austin Peay",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50735": {
      "school_short": "Gannon",
      "world": "bryant",
      "division": "D-II"
    },
    "50259": {
      "school_short": "Coastal Carolina",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50347": {
      "school_short": "Colorado School of Mines",
      "world": "bryant",
      "division": "D-II"
    },
    "50367": {
      "school_short": "Hartwick",
      "world": "bryant",
      "division": "D-III"
    },
    "50404": {
      "school_short": "Illinois Wesleyan",
      "world": "bryant",
      "division": "D-III"
    },
    "50243": {
      "school_short": "Florida International",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50348": {
      "school_short": "Fort Hays State",
      "world": "bryant",
      "division": "D-II"
    },
    "50498": {
      "school_short": "Maranatha Baptist",
      "world": "bryant",
      "division": "D-III"
    },
    "50336": {
      "school_short": "Kutztown",
      "world": "bryant",
      "division": "D-II"
    },
    "50640": {
      "school_short": "La Salle",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50610": {
      "school_short": "Lafayette",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50562": {
      "school_short": "Lake Forest",
      "world": "bryant",
      "division": "D-III"
    },
    "50611": {
      "school_short": "Lehigh",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50695": {
      "school_short": "Lenoir-Rhyne",
      "world": "bryant",
      "division": "D-II"
    },
    "50468": {
      "school_short": "Linfield",
      "world": "bryant",
      "division": "D-III"
    },
    "50205": {
      "school_short": "LSU",
      "world": "bryant",
      "division": "D-IA"
    },
    "50222": {
      "school_short": "Louisiana Tech",
      "world": "bryant",
      "division": "D-IA"
    },
    "50551": {
      "school_short": "Lycoming",
      "world": "bryant",
      "division": "D-III"
    },
    "50617": {
      "school_short": "Marist",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50714": {
      "school_short": "Merrimack",
      "world": "bryant",
      "division": "D-II"
    },
    "50427": {
      "school_short": "Maine Maritime",
      "world": "bryant",
      "division": "D-III"
    },
    "50778": {
      "school_short": "Knox",
      "world": "bryant",
      "division": "D-III"
    },
    "50319": {
      "school_short": "Lock Haven",
      "world": "bryant",
      "division": "D-II"
    },
    "50400": {
      "school_short": "MacMurray",
      "world": "bryant",
      "division": "D-III"
    },
    "50443": {
      "school_short": "Kean",
      "world": "bryant",
      "division": "D-III"
    },
    "50311": {
      "school_short": "Missouri Western State",
      "world": "bryant",
      "division": "D-II"
    },
    "50773": {
      "school_short": "Monmouth (IL)",
      "world": "bryant",
      "division": "D-III"
    },
    "50648": {
      "school_short": "Monmouth",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50329": {
      "school_short": "Northern State",
      "world": "bryant",
      "division": "D-II"
    },
    "50557": {
      "school_short": "Moravian",
      "world": "bryant",
      "division": "D-III"
    },
    "50257": {
      "school_short": "Morehead State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50478": {
      "school_short": "Manchester",
      "world": "bryant",
      "division": "D-III"
    },
    "50522": {
      "school_short": "Kentucky Wesleyan",
      "world": "bryant",
      "division": "D-II"
    },
    "50550": {
      "school_short": "King`s",
      "world": "bryant",
      "division": "D-III"
    },
    "50439": {
      "school_short": "Hamilton",
      "world": "bryant",
      "division": "D-III"
    },
    "50477": {
      "school_short": "Hanover",
      "world": "bryant",
      "division": "D-III"
    },
    "50519": {
      "school_short": "Clark Atlanta",
      "world": "bryant",
      "division": "D-II"
    },
    "50390": {
      "school_short": "Iowa State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50495": {
      "school_short": "Methodist",
      "world": "bryant",
      "division": "D-III"
    },
    "50753": {
      "school_short": "Menlo",
      "world": "bryant",
      "division": "D-III"
    },
    "50561": {
      "school_short": "Illinois",
      "world": "bryant",
      "division": "D-III"
    },
    "50573": {
      "school_short": "Marquette",
      "world": "bryant",
      "division": "D-IA"
    },
    "50527": {
      "school_short": "Howard Payne",
      "world": "bryant",
      "division": "D-III"
    },
    "50697": {
      "school_short": "Glenville",
      "world": "bryant",
      "division": "D-II"
    },
    "50349": {
      "school_short": "Gettysburg",
      "world": "bryant",
      "division": "D-III"
    },
    "50250": {
      "school_short": "Harvard",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50337": {
      "school_short": "Mansfield",
      "world": "bryant",
      "division": "D-II"
    },
    "50451": {
      "school_short": "Huntingdon",
      "world": "bryant",
      "division": "D-III"
    },
    "50409": {
      "school_short": "Loras",
      "world": "bryant",
      "division": "D-III"
    },
    "50764": {
      "school_short": "Marietta",
      "world": "bryant",
      "division": "D-III"
    },
    "50707": {
      "school_short": "Humboldt State",
      "world": "bryant",
      "division": "D-II"
    },
    "50744": {
      "school_short": "Mercyhurst",
      "world": "bryant",
      "division": "D-II"
    },
    "50410": {
      "school_short": "Luther",
      "world": "bryant",
      "division": "D-III"
    },
    "50723": {
      "school_short": "Minnesota State-Moorhead",
      "world": "bryant",
      "division": "D-II"
    },
    "50539": {
      "school_short": "Hope",
      "world": "bryant",
      "division": "D-III"
    },
    "50633": {
      "school_short": "Jacksonville",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50656": {
      "school_short": "Georgetown",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50540": {
      "school_short": "Kalamazoo",
      "world": "bryant",
      "division": "D-III"
    },
    "50659": {
      "school_short": "James Madison",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50779": {
      "school_short": "Lawrence",
      "world": "bryant",
      "division": "D-III"
    },
    "50398": {
      "school_short": "Greenville",
      "world": "bryant",
      "division": "D-III"
    },
    "50322": {
      "school_short": "Minnesota State-Mankato",
      "world": "bryant",
      "division": "D-II"
    },
    "50737": {
      "school_short": "Johnson C. Smith",
      "world": "bryant",
      "division": "D-II"
    },
    "50292": {
      "school_short": "Henderson State",
      "world": "bryant",
      "division": "D-II"
    },
    "50738": {
      "school_short": "Livingstone",
      "world": "bryant",
      "division": "D-II"
    },
    "50235": {
      "school_short": "Illinois State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50544": {
      "school_short": "Colorado",
      "world": "bryant",
      "division": "D-III"
    },
    "50385": {
      "school_short": "Kansas State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50601": {
      "school_short": "Kent State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50499": {
      "school_short": "Maryville",
      "world": "bryant",
      "division": "D-III"
    },
    "50620": {
      "school_short": "Jacksonville State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50281": {
      "school_short": "Michigan Tech",
      "world": "bryant",
      "division": "D-II"
    },
    "50576": {
      "school_short": "Michigan State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50511": {
      "school_short": "Millikin",
      "world": "bryant",
      "division": "D-III"
    },
    "50241": {
      "school_short": "Missouri State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50457": {
      "school_short": "Kenyon",
      "world": "bryant",
      "division": "D-III"
    },
    "50543": {
      "school_short": "Macalester",
      "world": "bryant",
      "division": "D-III"
    },
    "50745": {
      "school_short": "Northern Michigan",
      "world": "bryant",
      "division": "D-II"
    },
    "50555": {
      "school_short": "Juniata",
      "world": "bryant",
      "division": "D-III"
    },
    "50591": {
      "school_short": "Marshall",
      "world": "bryant",
      "division": "D-IA"
    },
    "50678": {
      "school_short": "Montana State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50516": {
      "school_short": "Kentucky State",
      "world": "bryant",
      "division": "D-II"
    },
    "50467": {
      "school_short": "Lewis and Clark",
      "world": "bryant",
      "division": "D-III"
    },
    "50556": {
      "school_short": "Lebanon Valley",
      "world": "bryant",
      "division": "D-III"
    },
    "50621": {
      "school_short": "Murray State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50761": {
      "school_short": "Muskingum",
      "world": "bryant",
      "division": "D-III"
    },
    "50270": {
      "school_short": "Nicholls State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50637": {
      "school_short": "Norfolk State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50298": {
      "school_short": "Northeastern State",
      "world": "bryant",
      "division": "D-II"
    },
    "50312": {
      "school_short": "Northwest Missouri State",
      "world": "bryant",
      "division": "D-II"
    },
    "50458": {
      "school_short": "Oberlin",
      "world": "bryant",
      "division": "D-III"
    },
    "50581": {
      "school_short": "Ohio State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50464": {
      "school_short": "Ohio Wesleyan",
      "world": "bryant",
      "division": "D-III"
    },
    "50352": {
      "school_short": "Muhlenberg",
      "world": "bryant",
      "division": "D-III"
    },
    "50216": {
      "school_short": "New Mexico State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50646": {
      "school_short": "NC A&T",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50433": {
      "school_short": "Middlebury",
      "world": "bryant",
      "division": "D-III"
    },
    "50680": {
      "school_short": "Midwestern State",
      "world": "bryant",
      "division": "D-II"
    },
    "50338": {
      "school_short": "Millersville",
      "world": "bryant",
      "division": "D-II"
    },
    "50276": {
      "school_short": "Mississippi Valley State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50673": {
      "school_short": "Portland State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50279": {
      "school_short": "Prairie View",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50692": {
      "school_short": "Presbyterian",
      "world": "bryant",
      "division": "D-II"
    },
    "50254": {
      "school_short": "Princeton",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50583": {
      "school_short": "Purdue",
      "world": "bryant",
      "division": "D-IA"
    },
    "50524": {
      "school_short": "Quincy",
      "world": "bryant",
      "division": "D-II"
    },
    "50774": {
      "school_short": "Ripon",
      "world": "bryant",
      "division": "D-III"
    },
    "50650": {
      "school_short": "Sacred Heart",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50746": {
      "school_short": "Saginaw Valley State",
      "world": "bryant",
      "division": "D-II"
    },
    "50422": {
      "school_short": "Salve Regina",
      "world": "bryant",
      "division": "D-III"
    },
    "50679": {
      "school_short": "Sam Houston State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50244": {
      "school_short": "Savannah State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50732": {
      "school_short": "Shaw",
      "world": "bryant",
      "division": "D-II"
    },
    "50698": {
      "school_short": "Shepherd",
      "world": "bryant",
      "division": "D-II"
    },
    "50623": {
      "school_short": "Southeast Missouri State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50245": {
      "school_short": "Southeastern Louisiana",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50299": {
      "school_short": "SE Oklahoma-Durant",
      "world": "bryant",
      "division": "D-II"
    },
    "50762": {
      "school_short": "Ohio Northern",
      "world": "bryant",
      "division": "D-III"
    },
    "50739": {
      "school_short": "North Carolina Central",
      "world": "bryant",
      "division": "D-II"
    },
    "50399": {
      "school_short": "Lakeland",
      "world": "bryant",
      "division": "D-III"
    },
    "50393": {
      "school_short": "Oklahoma State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50500": {
      "school_short": "Nebraska Wesleyan",
      "world": "bryant",
      "division": "D-III"
    },
    "50759": {
      "school_short": "John Carroll",
      "world": "bryant",
      "division": "D-III"
    },
    "50545": {
      "school_short": "Martin Luther",
      "world": "bryant",
      "division": "D-III"
    },
    "50351": {
      "school_short": "McDaniel",
      "world": "bryant",
      "division": "D-III"
    },
    "50445": {
      "school_short": "Rowan",
      "world": "bryant",
      "division": "D-III"
    },
    "50513": {
      "school_short": "North Park",
      "world": "bryant",
      "division": "D-III"
    },
    "50713": {
      "school_short": "Long Island",
      "world": "bryant",
      "division": "D-II"
    },
    "50452": {
      "school_short": "Mount Ida",
      "world": "bryant",
      "division": "D-III"
    },
    "50315": {
      "school_short": "Missouri Southern State",
      "world": "bryant",
      "division": "D-II"
    },
    "50718": {
      "school_short": "Saint Anselm",
      "world": "bryant",
      "division": "D-II"
    },
    "50529": {
      "school_short": "McMurry",
      "world": "bryant",
      "division": "D-III"
    },
    "50282": {
      "school_short": "Northwood",
      "world": "bryant",
      "division": "D-II"
    },
    "50532": {
      "school_short": "Mississippi",
      "world": "bryant",
      "division": "D-III"
    },
    "50691": {
      "school_short": "Mars Hill",
      "world": "bryant",
      "division": "D-II"
    },
    "50313": {
      "school_short": "Pittsburg State",
      "world": "bryant",
      "division": "D-II"
    },
    "50520": {
      "school_short": "Lane",
      "world": "bryant",
      "division": "D-II"
    },
    "50517": {
      "school_short": "Miles",
      "world": "bryant",
      "division": "D-II"
    },
    "50696": {
      "school_short": "Newberry",
      "world": "bryant",
      "division": "D-II"
    },
    "50649": {
      "school_short": "Robert Morris",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50528": {
      "school_short": "Louisiana",
      "world": "bryant",
      "division": "D-III"
    },
    "50729": {
      "school_short": "Liberty",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50487": {
      "school_short": "Pomona-Pitzers",
      "world": "bryant",
      "division": "D-III"
    },
    "50271": {
      "school_short": "Northwestern State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50599": {
      "school_short": "Miami (OH)",
      "world": "bryant",
      "division": "D-IA"
    },
    "50641": {
      "school_short": "Siena",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50521": {
      "school_short": "Morehouse",
      "world": "bryant",
      "division": "D-II"
    },
    "50324": {
      "school_short": "South Dakota State",
      "world": "bryant",
      "division": "D-II"
    },
    "50496": {
      "school_short": "Shenandoah",
      "world": "bryant",
      "division": "D-III"
    },
    "50512": {
      "school_short": "North Central",
      "world": "bryant",
      "division": "D-III"
    },
    "50665": {
      "school_short": "Northeastern",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50577": {
      "school_short": "Northwestern",
      "world": "bryant",
      "division": "D-IA"
    },
    "50542": {
      "school_short": "Olivet",
      "world": "bryant",
      "division": "D-III"
    },
    "50293": {
      "school_short": "Southern Arkansas",
      "world": "bryant",
      "division": "D-II"
    },
    "50237": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50316": {
      "school_short": "Southwest Baptist",
      "world": "bryant",
      "division": "D-II"
    },
    "50740": {
      "school_short": "St. Augustine`s",
      "world": "bryant",
      "division": "D-II"
    },
    "50483": {
      "school_short": "Rose-Hulman",
      "world": "bryant",
      "division": "D-III"
    },
    "50754": {
      "school_short": "Principia",
      "world": "bryant",
      "division": "D-III"
    },
    "50287": {
      "school_short": "Ouachita Baptist",
      "world": "bryant",
      "division": "D-II"
    },
    "50434": {
      "school_short": "Trinity",
      "world": "bryant",
      "division": "D-III"
    },
    "50357": {
      "school_short": "Union (NY)",
      "world": "bryant",
      "division": "D-III"
    },
    "50325": {
      "school_short": "St. Cloud State",
      "world": "bryant",
      "division": "D-II"
    },
    "50675": {
      "school_short": "St. Mary`s",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50775": {
      "school_short": "St. Norbert",
      "world": "bryant",
      "division": "D-III"
    },
    "50618": {
      "school_short": "St. Peter`s",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50755": {
      "school_short": "Stillman",
      "world": "bryant",
      "division": "D-III"
    },
    "50651": {
      "school_short": "Stony Brook",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50614": {
      "school_short": "Tennessee Tech",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50221": {
      "school_short": "Troy State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50594": {
      "school_short": "Tulane",
      "world": "bryant",
      "division": "D-IA"
    },
    "50595": {
      "school_short": "Alabama Birmingham",
      "world": "bryant",
      "division": "D-IA"
    },
    "50207": {
      "school_short": "Alabama",
      "world": "bryant",
      "division": "D-IA"
    },
    "50193": {
      "school_short": "Arizona",
      "world": "bryant",
      "division": "D-IA"
    },
    "50294": {
      "school_short": "Arkansas-Monticello",
      "world": "bryant",
      "division": "D-II"
    },
    "50728": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50190": {
      "school_short": "California",
      "world": "bryant",
      "division": "D-IA"
    },
    "50547": {
      "school_short": "Brockport",
      "world": "bryant",
      "division": "D-III"
    },
    "50715": {
      "school_short": "Southern Connecticut",
      "world": "bryant",
      "division": "D-II"
    },
    "50552": {
      "school_short": "Susquehanna",
      "world": "bryant",
      "division": "D-III"
    },
    "50486": {
      "school_short": "Occidental",
      "world": "bryant",
      "division": "D-III"
    },
    "50602": {
      "school_short": "Ohio",
      "world": "bryant",
      "division": "D-IA"
    },
    "50186": {
      "school_short": "Oregon State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50686": {
      "school_short": "New Mexico Highlands",
      "world": "bryant",
      "division": "D-II"
    },
    "50314": {
      "school_short": "Truman State",
      "world": "bryant",
      "division": "D-II"
    },
    "50289": {
      "school_short": "Central Arkansas",
      "world": "bryant",
      "division": "D-II"
    },
    "50206": {
      "school_short": "Mississippi State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50246": {
      "school_short": "Southern Utah",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50196": {
      "school_short": "Stanford",
      "world": "bryant",
      "division": "D-IA"
    },
    "50331": {
      "school_short": "Charleston",
      "world": "bryant",
      "division": "D-II"
    },
    "50472": {
      "school_short": "Randolph-Macon",
      "world": "bryant",
      "division": "D-III"
    },
    "50677": {
      "school_short": "Northern Arizona",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50596": {
      "school_short": "Southern Methodist",
      "world": "bryant",
      "division": "D-IA"
    },
    "50355": {
      "school_short": "Rensselaer Tech",
      "world": "bryant",
      "division": "D-III"
    },
    "50453": {
      "school_short": "Rockford",
      "world": "bryant",
      "division": "D-III"
    },
    "50411": {
      "school_short": "Simpson",
      "world": "bryant",
      "division": "D-III"
    },
    "50559": {
      "school_short": "Salisbury",
      "world": "bryant",
      "division": "D-III"
    },
    "50365": {
      "school_short": "Springfield",
      "world": "bryant",
      "division": "D-III"
    },
    "50588": {
      "school_short": "Rice",
      "world": "bryant",
      "division": "D-IA"
    },
    "50323": {
      "school_short": "North Dakota State",
      "world": "bryant",
      "division": "D-II"
    },
    "50444": {
      "school_short": "Montclair State",
      "world": "bryant",
      "division": "D-III"
    },
    "50345": {
      "school_short": "Slippery Rock",
      "world": "bryant",
      "division": "D-II"
    },
    "50780": {
      "school_short": "Chicago",
      "world": "bryant",
      "division": "D-III"
    },
    "50533": {
      "school_short": "Sul Ross State",
      "world": "bryant",
      "division": "D-III"
    },
    "50230": {
      "school_short": "San Jose State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50717": {
      "school_short": "Pace",
      "world": "bryant",
      "division": "D-II"
    },
    "50655": {
      "school_short": "Saint Francis",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50603": {
      "school_short": "Buffalo",
      "world": "bryant",
      "division": "D-IA"
    },
    "50523": {
      "school_short": "Saint Joseph`s",
      "world": "bryant",
      "division": "D-II"
    },
    "50482": {
      "school_short": "Rhodes",
      "world": "bryant",
      "division": "D-III"
    },
    "50446": {
      "school_short": "Cortland",
      "world": "bryant",
      "division": "D-III"
    },
    "50416": {
      "school_short": "Thiel",
      "world": "bryant",
      "division": "D-III"
    },
    "50229": {
      "school_short": "San Diego State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50518": {
      "school_short": "Tuskegee",
      "world": "bryant",
      "division": "D-II"
    },
    "50565": {
      "school_short": "Temple",
      "world": "bryant",
      "division": "D-IA"
    },
    "50652": {
      "school_short": "Albany",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50447": {
      "school_short": "New Jersey",
      "world": "bryant",
      "division": "D-III"
    },
    "50796": {
      "school_short": "Nichols",
      "world": "bryant",
      "division": "D-III"
    },
    "50726": {
      "school_short": "Southern-Baton Rouge",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50534": {
      "school_short": "Texas Lutheran",
      "world": "bryant",
      "division": "D-III"
    },
    "50693": {
      "school_short": "Tusculum",
      "world": "bryant",
      "division": "D-II"
    },
    "50302": {
      "school_short": "Central Oklahoma",
      "world": "bryant",
      "division": "D-II"
    },
    "50765": {
      "school_short": "Otterbein",
      "world": "bryant",
      "division": "D-III"
    },
    "50501": {
      "school_short": "Thomas More",
      "world": "bryant",
      "division": "D-III"
    },
    "50233": {
      "school_short": "Stephen F. Austin",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50719": {
      "school_short": "Stonehill",
      "world": "bryant",
      "division": "D-II"
    },
    "50624": {
      "school_short": "Tennessee State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50593": {
      "school_short": "Texas Christian",
      "world": "bryant",
      "division": "D-IA"
    },
    "50600": {
      "school_short": "Akron",
      "world": "bryant",
      "division": "D-IA"
    },
    "50212": {
      "school_short": "Louisiana Lafayette",
      "world": "bryant",
      "division": "D-IA"
    },
    "50423": {
      "school_short": "UMass-Dartmouth",
      "world": "bryant",
      "division": "D-III"
    },
    "50666": {
      "school_short": "Maine",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50661": {
      "school_short": "Massachusetts",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50382": {
      "school_short": "Miami (FL)",
      "world": "bryant",
      "division": "D-IA"
    },
    "50386": {
      "school_short": "Nebraska",
      "world": "bryant",
      "division": "D-IA"
    },
    "50231": {
      "school_short": "UNLV",
      "world": "bryant",
      "division": "D-IA"
    },
    "50225": {
      "school_short": "New Mexico",
      "world": "bryant",
      "division": "D-IA"
    },
    "50295": {
      "school_short": "North Alabama",
      "world": "bryant",
      "division": "D-II"
    },
    "50725": {
      "school_short": "Minnesota-Crookston",
      "world": "bryant",
      "division": "D-II"
    },
    "50317": {
      "school_short": "Missouri-Rolla",
      "world": "bryant",
      "division": "D-II"
    },
    "50657": {
      "school_short": "Nevada",
      "world": "bryant",
      "division": "D-IA"
    },
    "50330": {
      "school_short": "Wayne State",
      "world": "bryant",
      "division": "D-II"
    },
    "50220": {
      "school_short": "Montana",
      "world": "bryant",
      "division": "D-IA"
    },
    "50667": {
      "school_short": "New Hampshire",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50488": {
      "school_short": "La Verne",
      "world": "bryant",
      "division": "D-III"
    },
    "50566": {
      "school_short": "Connecticut",
      "world": "bryant",
      "division": "D-IA"
    },
    "50727": {
      "school_short": "Texas Southern",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50356": {
      "school_short": "St. Lawrence",
      "world": "bryant",
      "division": "D-III"
    },
    "50704": {
      "school_short": "North Dakota",
      "world": "bryant",
      "division": "D-II"
    },
    "50570": {
      "school_short": "Cincinnati",
      "world": "bryant",
      "division": "D-IA"
    },
    "50575": {
      "school_short": "Illinois",
      "world": "bryant",
      "division": "D-IA"
    },
    "50203": {
      "school_short": "Kentucky",
      "world": "bryant",
      "division": "D-IA"
    },
    "50218": {
      "school_short": "North Texas",
      "world": "bryant",
      "division": "D-IA"
    },
    "50569": {
      "school_short": "Louisville",
      "world": "bryant",
      "division": "D-IA"
    },
    "50630": {
      "school_short": "VMI",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50202": {
      "school_short": "South Carolina",
      "world": "bryant",
      "division": "D-IA"
    },
    "50217": {
      "school_short": "Idaho",
      "world": "bryant",
      "division": "D-IA"
    },
    "50394": {
      "school_short": "Texas Tech",
      "world": "bryant",
      "division": "D-IA"
    },
    "50571": {
      "school_short": "South Florida",
      "world": "bryant",
      "division": "D-IA"
    },
    "50484": {
      "school_short": "Trinity (TX)",
      "world": "bryant",
      "division": "D-III"
    },
    "50208": {
      "school_short": "Arkansas",
      "world": "bryant",
      "division": "D-IA"
    },
    "50585": {
      "school_short": "Iowa",
      "world": "bryant",
      "division": "D-IA"
    },
    "50306": {
      "school_short": "Texas A&M-Commerce",
      "world": "bryant",
      "division": "D-II"
    },
    "50470": {
      "school_short": "Puget Sound",
      "world": "bryant",
      "division": "D-III"
    },
    "50567": {
      "school_short": "Pittsburgh",
      "world": "bryant",
      "division": "D-IA"
    },
    "50530": {
      "school_short": "Mary Hardin-Baylor",
      "world": "bryant",
      "division": "D-III"
    },
    "50187": {
      "school_short": "Oregon",
      "world": "bryant",
      "division": "D-IA"
    },
    "50687": {
      "school_short": "Nebraska-Kearney",
      "world": "bryant",
      "division": "D-II"
    },
    "50242": {
      "school_short": "Northern Iowa",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50395": {
      "school_short": "Texas A&M",
      "world": "bryant",
      "division": "D-IA"
    },
    "50198": {
      "school_short": "Georgia",
      "world": "bryant",
      "division": "D-IA"
    },
    "50327": {
      "school_short": "Minnesota-Duluth",
      "world": "bryant",
      "division": "D-II"
    },
    "50251": {
      "school_short": "Pennsylvania",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50627": {
      "school_short": "Dayton",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50387": {
      "school_short": "Missouri",
      "world": "bryant",
      "division": "D-IA"
    },
    "50747": {
      "school_short": "Indianapolis",
      "world": "bryant",
      "division": "D-II"
    },
    "50361": {
      "school_short": "Coast Guard",
      "world": "bryant",
      "division": "D-III"
    },
    "50628": {
      "school_short": "San Diego",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50301": {
      "school_short": "Tarleton State",
      "world": "bryant",
      "division": "D-II"
    },
    "50705": {
      "school_short": "South Dakota",
      "world": "bryant",
      "division": "D-II"
    },
    "50668": {
      "school_short": "Richmond",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50586": {
      "school_short": "Notre Dame",
      "world": "bryant",
      "division": "D-IA"
    },
    "50786": {
      "school_short": "St. John`s",
      "world": "bryant",
      "division": "D-III"
    },
    "50360": {
      "school_short": "Plymouth State",
      "world": "bryant",
      "division": "D-III"
    },
    "50213": {
      "school_short": "Louisiana Monroe",
      "world": "bryant",
      "division": "D-IA"
    },
    "50200": {
      "school_short": "Florida",
      "world": "bryant",
      "division": "D-IA"
    },
    "50388": {
      "school_short": "Kansas",
      "world": "bryant",
      "division": "D-IA"
    },
    "50660": {
      "school_short": "Delaware",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50579": {
      "school_short": "Minnesota",
      "world": "bryant",
      "division": "D-IA"
    },
    "50307": {
      "school_short": "Texas A&M-Kingsville",
      "world": "bryant",
      "division": "D-II"
    },
    "50662": {
      "school_short": "Rhode Island",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50391": {
      "school_short": "Oklahoma",
      "world": "bryant",
      "division": "D-IA"
    },
    "50606": {
      "school_short": "Toledo",
      "world": "bryant",
      "division": "D-IA"
    },
    "50589": {
      "school_short": "Tulsa",
      "world": "bryant",
      "division": "D-IA"
    },
    "50506": {
      "school_short": "Wisconsin-River Falls",
      "world": "bryant",
      "division": "D-III"
    },
    "50510": {
      "school_short": "Wisconsin-Stout",
      "world": "bryant",
      "division": "D-III"
    },
    "50219": {
      "school_short": "Utah State",
      "world": "bryant",
      "division": "D-IA"
    },
    "50378": {
      "school_short": "Wake Forest",
      "world": "bryant",
      "division": "D-IA"
    },
    "50417": {
      "school_short": "Washington and Jefferson",
      "world": "bryant",
      "division": "D-III"
    },
    "50473": {
      "school_short": "Washington and Lee",
      "world": "bryant",
      "division": "D-III"
    },
    "50674": {
      "school_short": "Weber State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50699": {
      "school_short": "West Virginia Tech",
      "world": "bryant",
      "division": "D-II"
    },
    "50224": {
      "school_short": "UTEP",
      "world": "bryant",
      "division": "D-IA"
    },
    "50238": {
      "school_short": "Western Illinois",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50239": {
      "school_short": "Western Kentucky",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50608": {
      "school_short": "Western Michigan",
      "world": "bryant",
      "division": "D-IA"
    },
    "50436": {
      "school_short": "Williams",
      "world": "bryant",
      "division": "D-III"
    },
    "50694": {
      "school_short": "Wingate",
      "world": "bryant",
      "division": "D-II"
    },
    "50541": {
      "school_short": "Wisconsin Lutheran",
      "world": "bryant",
      "division": "D-III"
    },
    "50460": {
      "school_short": "Wittenberg",
      "world": "bryant",
      "division": "D-III"
    },
    "50265": {
      "school_short": "Wofford",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50364": {
      "school_short": "Worcester Tech",
      "world": "bryant",
      "division": "D-III"
    },
    "50915": {
      "school_short": "Abilene Christian",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50505": {
      "school_short": "Wisconsin-Platteville",
      "world": "bryant",
      "division": "D-III"
    },
    "50750": {
      "school_short": "Willamette",
      "world": "bryant",
      "division": "D-III"
    },
    "50290": {
      "school_short": "West Alabama",
      "world": "bryant",
      "division": "D-II"
    },
    "50504": {
      "school_short": "Wisconsin-La Crosse",
      "world": "bryant",
      "division": "D-III"
    },
    "50598": {
      "school_short": "Southern Mississippi",
      "world": "bryant",
      "division": "D-IA"
    },
    "50240": {
      "school_short": "Youngstown State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50392": {
      "school_short": "Texas",
      "world": "bryant",
      "division": "D-IA"
    },
    "50377": {
      "school_short": "Virginia",
      "world": "bryant",
      "division": "D-IA"
    },
    "50733": {
      "school_short": "Virginia State",
      "world": "bryant",
      "division": "D-II"
    },
    "50734": {
      "school_short": "Virginia Union",
      "world": "bryant",
      "division": "D-II"
    },
    "50553": {
      "school_short": "Wilkes",
      "world": "bryant",
      "division": "D-III"
    },
    "50215": {
      "school_short": "Army",
      "world": "bryant",
      "division": "D-IA"
    },
    "51068": {
      "school_short": "Wooster",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50440": {
      "school_short": "Wesleyan",
      "world": "bryant",
      "division": "D-III"
    },
    "50568": {
      "school_short": "West Virginia",
      "world": "bryant",
      "division": "D-IA"
    },
    "50558": {
      "school_short": "Widener",
      "world": "bryant",
      "division": "D-III"
    },
    "50318": {
      "school_short": "Washburn-Topeka",
      "world": "bryant",
      "division": "D-II"
    },
    "50663": {
      "school_short": "Villanova",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50268": {
      "school_short": "Tennessee-Chattanooga",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50781": {
      "school_short": "Washington (MO)",
      "world": "bryant",
      "division": "D-III"
    },
    "50370": {
      "school_short": "Utica",
      "world": "bryant",
      "division": "D-III"
    },
    "50485": {
      "school_short": "South-Sewanee",
      "world": "bryant",
      "division": "D-III"
    },
    "50353": {
      "school_short": "Ursinus",
      "world": "bryant",
      "division": "D-III"
    },
    "50333": {
      "school_short": "West Virginia State",
      "world": "bryant",
      "division": "D-II"
    },
    "50454": {
      "school_short": "Wesley",
      "world": "bryant",
      "division": "D-III"
    },
    "50653": {
      "school_short": "Wagner",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50326": {
      "school_short": "Winona State",
      "world": "bryant",
      "division": "D-II"
    },
    "50376": {
      "school_short": "North Carolina",
      "world": "bryant",
      "division": "D-IA"
    },
    "50214": {
      "school_short": "Navy",
      "world": "bryant",
      "division": "D-IA"
    },
    "50749": {
      "school_short": "Whitworth",
      "world": "bryant",
      "division": "D-III"
    },
    "50597": {
      "school_short": "Houston",
      "world": "bryant",
      "division": "D-IA"
    },
    "50308": {
      "school_short": "West Texas A&M",
      "world": "bryant",
      "division": "D-II"
    },
    "50232": {
      "school_short": "Hawaii",
      "world": "bryant",
      "division": "D-IA"
    },
    "50383": {
      "school_short": "Virginia Tech",
      "world": "bryant",
      "division": "D-IA"
    },
    "50209": {
      "school_short": "Ole Miss",
      "world": "bryant",
      "division": "D-IA"
    },
    "50430": {
      "school_short": "Worcester State",
      "world": "bryant",
      "division": "D-III"
    },
    "50509": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "bryant",
      "division": "D-III"
    },
    "50381": {
      "school_short": "Maryland",
      "world": "bryant",
      "division": "D-IA"
    },
    "50490": {
      "school_short": "Whittier",
      "world": "bryant",
      "division": "D-III"
    },
    "50629": {
      "school_short": "Valparaiso",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50418": {
      "school_short": "Waynesburg",
      "world": "bryant",
      "division": "D-III"
    },
    "50227": {
      "school_short": "Wyoming",
      "world": "bryant",
      "division": "D-IA"
    },
    "50459": {
      "school_short": "Wabash",
      "world": "bryant",
      "division": "D-III"
    },
    "50503": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "bryant",
      "division": "D-III"
    },
    "50188": {
      "school_short": "Washington",
      "world": "bryant",
      "division": "D-IA"
    },
    "50339": {
      "school_short": "West Chester",
      "world": "bryant",
      "division": "D-II"
    },
    "50201": {
      "school_short": "Vanderbilt",
      "world": "bryant",
      "division": "D-IA"
    },
    "50284": {
      "school_short": "Wayne State",
      "world": "bryant",
      "division": "D-II"
    },
    "50197": {
      "school_short": "Air Force",
      "world": "bryant",
      "division": "D-IA"
    },
    "51031": {
      "school_short": "Adrian",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50884": {
      "school_short": "Alabama A&M",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51313": {
      "school_short": "Albany State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51033": {
      "school_short": "Alma",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50916": {
      "school_short": "Angelo State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50897": {
      "school_short": "Arkansas Tech",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51017": {
      "school_short": "Augustana (IL)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50502": {
      "school_short": "Westminster (MO)",
      "world": "bryant",
      "division": "D-III"
    },
    "50766": {
      "school_short": "Wilmington (OH)",
      "world": "bryant",
      "division": "D-III"
    },
    "50252": {
      "school_short": "Yale",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50886": {
      "school_short": "Alcorn State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51328": {
      "school_short": "Assumption",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50700": {
      "school_short": "West Virginia Wesleyan",
      "world": "bryant",
      "division": "D-II"
    },
    "50424": {
      "school_short": "Western New England",
      "world": "bryant",
      "division": "D-III"
    },
    "50709": {
      "school_short": "Western Washington",
      "world": "bryant",
      "division": "D-II"
    },
    "51221": {
      "school_short": "Ball State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51323": {
      "school_short": "Bentley",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50996": {
      "school_short": "Boston",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51217": {
      "school_short": "Bowling Green",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51037": {
      "school_short": "Bridgewater State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51237": {
      "school_short": "Butler",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50952": {
      "school_short": "California (PA)",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51388": {
      "school_short": "Carroll",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50797": {
      "school_short": "Central Michigan",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51318": {
      "school_short": "Central Washington",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51091": {
      "school_short": "Centre",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51032": {
      "school_short": "Albion",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51266": {
      "school_short": "Central Connecticut",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50946": {
      "school_short": "Bloomsburg",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50429": {
      "school_short": "Westfield State",
      "world": "bryant",
      "division": "D-III"
    },
    "50933": {
      "school_short": "Augustana",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51061": {
      "school_short": "Buffalo",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51172": {
      "school_short": "Beloit",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51126": {
      "school_short": "Carthage",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51354": {
      "school_short": "Ashland",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50885": {
      "school_short": "Alabama State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51395": {
      "school_short": "Bethel",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50363": {
      "school_short": "Western Connecticut State",
      "world": "bryant",
      "division": "D-III"
    },
    "50507": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "bryant",
      "division": "D-III"
    },
    "51394": {
      "school_short": "Augsburg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50688": {
      "school_short": "Western State (CO)",
      "world": "bryant",
      "division": "D-II"
    },
    "50859": {
      "school_short": "Brown",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50804": {
      "school_short": "Arizona State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50822": {
      "school_short": "Arkansas State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51008": {
      "school_short": "Baylor",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50448": {
      "school_short": "William Paterson",
      "world": "bryant",
      "division": "D-III"
    },
    "50816": {
      "school_short": "Auburn",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51403": {
      "school_short": "Bethany",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51301": {
      "school_short": "Carson-Newman",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50983": {
      "school_short": "Aurora",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51067": {
      "school_short": "Allegheny",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51400": {
      "school_short": "Carleton",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51342": {
      "school_short": "Bowie State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50226": {
      "school_short": "Utah",
      "world": "bryant",
      "division": "D-IA"
    },
    "50978": {
      "school_short": "Alfred",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50793": {
      "school_short": "Westminster (PA)",
      "world": "bryant",
      "division": "D-III"
    },
    "50412": {
      "school_short": "Wartburg",
      "world": "bryant",
      "division": "D-III"
    },
    "51381": {
      "school_short": "Bridgewater",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51382": {
      "school_short": "Catholic",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50803": {
      "school_short": "BYU",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50264": {
      "school_short": "Western Carolina",
      "world": "bryant",
      "division": "D-IAA"
    },
    "51322": {
      "school_short": "American International",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51254": {
      "school_short": "Bethune-Cookman",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50921": {
      "school_short": "Central Missouri State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51078": {
      "school_short": "Case Western",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51020": {
      "school_short": "Central",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50708": {
      "school_short": "Western Oregon",
      "world": "bryant",
      "division": "D-II"
    },
    "51049": {
      "school_short": "Bates",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50288": {
      "school_short": "West Georgia",
      "world": "bryant",
      "division": "D-II"
    },
    "51302": {
      "school_short": "Catawba",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51160": {
      "school_short": "Albright",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51284": {
      "school_short": "Cal Poly",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51043": {
      "school_short": "Amherst",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50958": {
      "school_short": "Chadron State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50870": {
      "school_short": "Charleston Southern",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51104": {
      "school_short": "Christopher Newport",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50953": {
      "school_short": "Clarion",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51368": {
      "school_short": "Blackburn",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51087": {
      "school_short": "Bluffton",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51050": {
      "school_short": "Bowdoin",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51077": {
      "school_short": "Carnegie Mellon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51062": {
      "school_short": "Chapman",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51148": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51243": {
      "school_short": "Austin Peay",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51103": {
      "school_short": "Averett",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51314": {
      "school_short": "Benedict",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51013": {
      "school_short": "Benedictine",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50871": {
      "school_short": "Coastal Carolina",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51025": {
      "school_short": "Coe",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50868": {
      "school_short": "Colgate",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51396": {
      "school_short": "Concordia",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51014": {
      "school_short": "Concordia (IL)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51250": {
      "school_short": "Delaware State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51092": {
      "school_short": "DePauw",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51238": {
      "school_short": "Drake",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51231": {
      "school_short": "Eastern Kentucky",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51216": {
      "school_short": "Eastern Michigan",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50917": {
      "school_short": "Eastern New Mexico",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51363": {
      "school_short": "Eastern Oregon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50954": {
      "school_short": "Edinboro",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51343": {
      "school_short": "Elizabeth City",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51015": {
      "school_short": "Elmhurst",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50879": {
      "school_short": "Elon",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50922": {
      "school_short": "Emporia State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51407": {
      "school_short": "Endicott",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51166": {
      "school_short": "Fairleigh Dickinson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51348": {
      "school_short": "Fayetteville State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51105": {
      "school_short": "Ferrum",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51026": {
      "school_short": "Cornell",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51244": {
      "school_short": "Davidson",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51074": {
      "school_short": "Earlham",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51225": {
      "school_short": "Eastern Illinois",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51019": {
      "school_short": "Buena Vista",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50903": {
      "school_short": "Delta State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51383": {
      "school_short": "Emory and Henry",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51131": {
      "school_short": "Clark Atlanta",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51324": {
      "school_short": "Bryant",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51251": {
      "school_short": "Duquesne",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50878": {
      "school_short": "East Tennessee State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50861": {
      "school_short": "Dartmouth",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51283": {
      "school_short": "Eastern Washington",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51149": {
      "school_short": "Dickinson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50865": {
      "school_short": "Cornell",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50909": {
      "school_short": "East Central",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51044": {
      "school_short": "Colby",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50947": {
      "school_short": "East Stroudsburg",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51009": {
      "school_short": "Eureka",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51380": {
      "school_short": "Defiance",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51334": {
      "school_short": "Bemidji State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51199": {
      "school_short": "East Carolina",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51161": {
      "school_short": "Delaware Valley",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51379": {
      "school_short": "Mount St. Joseph",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51406": {
      "school_short": "Curry",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51246": {
      "school_short": "Holy Cross",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51248": {
      "school_short": "Florida A&M",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51333": {
      "school_short": "Fairmont State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51109": {
      "school_short": "Chowan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51156": {
      "school_short": "Colorado",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50986": {
      "school_short": "Duke",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50835": {
      "school_short": "Boise State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51332": {
      "school_short": "Concord",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51038": {
      "school_short": "Fitchburg State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51186": {
      "school_short": "Colorado State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50867": {
      "school_short": "Bucknell",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50985": {
      "school_short": "Clemson",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51073": {
      "school_short": "Denison",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50940": {
      "school_short": "Concordia",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50904": {
      "school_short": "Henderson State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50980": {
      "school_short": "Ithaca",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50960": {
      "school_short": "Fort Hays State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51150": {
      "school_short": "Franklin & Marshall",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51088": {
      "school_short": "Franklin",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50889": {
      "school_short": "Gardner-Webb",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51309": {
      "school_short": "Glenville",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51151": {
      "school_short": "Hope",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51139": {
      "school_short": "Howard Payne",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50890": {
      "school_short": "Grambling State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51404": {
      "school_short": "Grove City",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51397": {
      "school_short": "Gustavus Adolphus",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51401": {
      "school_short": "Hamline",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51255": {
      "school_short": "Hampton",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50898": {
      "school_short": "Harding",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50966": {
      "school_short": "Hobart",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51196": {
      "school_short": "Indiana",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51228": {
      "school_short": "Iona",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51247": {
      "school_short": "Fordham",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51158": {
      "school_short": "Husson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51127": {
      "school_short": "Fort Valley State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51053": {
      "school_short": "Framingham State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50979": {
      "school_short": "Hartwick",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51349": {
      "school_short": "Johnson C. Smith",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51167": {
      "school_short": "Juniata",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51152": {
      "school_short": "Kalamazoo",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51055": {
      "school_short": "Kean",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51213": {
      "school_short": "Kent State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50948": {
      "school_short": "Kutztown",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51391": {
      "school_short": "Lawrence",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51016": {
      "school_short": "Illinois Wesleyan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51089": {
      "school_short": "Hanover",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50887": {
      "school_short": "Jackson State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51364": {
      "school_short": "Frostburg State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50984": {
      "school_short": "Concordia (WI)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50997": {
      "school_short": "Kansas State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51276": {
      "school_short": "Hofstra",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50892": {
      "school_short": "Hillsdale",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51256": {
      "school_short": "Howard",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50847": {
      "school_short": "Illinois State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50987": {
      "school_short": "Georgia Tech",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51051": {
      "school_short": "Hamilton",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51168": {
      "school_short": "Lebanon Valley",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51223": {
      "school_short": "Lehigh",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51341": {
      "school_short": "Liberty",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51080": {
      "school_short": "Linfield",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51270": {
      "school_short": "William & Mary",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51347": {
      "school_short": "Gannon",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51288": {
      "school_short": "Idaho State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51083": {
      "school_short": "Hampden-Sydney",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51063": {
      "school_short": "Huntingdon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51075": {
      "school_short": "Hiram",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51307": {
      "school_short": "Lenoir-Rhyne",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50862": {
      "school_short": "Harvard",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51011": {
      "school_short": "Lakeland",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51375": {
      "school_short": "Heidelberg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51173": {
      "school_short": "Illinois",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50961": {
      "school_short": "Gettysburg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51106": {
      "school_short": "Greensboro",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51245": {
      "school_short": "Jacksonville",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51355": {
      "school_short": "Grand Valley State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51268": {
      "school_short": "Georgetown",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51203": {
      "school_short": "Marshall",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51079": {
      "school_short": "Lewis and Clark",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51232": {
      "school_short": "Jacksonville State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51132": {
      "school_short": "Lane",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51138": {
      "school_short": "Hardin-Simmons",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51010": {
      "school_short": "Greenville",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51281": {
      "school_short": "Florida Atlantic",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50955": {
      "school_short": "Indiana (PA)",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50873": {
      "school_short": "Furman",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51174": {
      "school_short": "Lake Forest",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50874": {
      "school_short": "Georgia Southern",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51350": {
      "school_short": "Livingstone",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50931": {
      "school_short": "Lock Haven",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50817": {
      "school_short": "LSU",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51022": {
      "school_short": "Luther",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51155": {
      "school_short": "Macalester",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51090": {
      "school_short": "Manchester",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51110": {
      "school_short": "Maranatha Baptist",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51229": {
      "school_short": "Marist",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50881": {
      "school_short": "McNeese State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50823": {
      "school_short": "Middle Tennessee State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51039": {
      "school_short": "Maine Maritime",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51162": {
      "school_short": "King`s",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51222": {
      "school_short": "Lafayette",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51163": {
      "school_short": "Lycoming",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51376": {
      "school_short": "Marietta",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51040": {
      "school_short": "Massachusetts Maritime",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50963": {
      "school_short": "McDaniel",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51326": {
      "school_short": "Merrimack",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51107": {
      "school_short": "Methodist",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51390": {
      "school_short": "Knox",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50971": {
      "school_short": "Norwich",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51076": {
      "school_short": "Ohio Wesleyan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51045": {
      "school_short": "Middlebury",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51123": {
      "school_short": "Millikin",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51335": {
      "school_short": "Minnesota State-Moorhead",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51385": {
      "school_short": "Monmouth (IL)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50882": {
      "school_short": "Nicholls State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51169": {
      "school_short": "Moravian",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51133": {
      "school_short": "Morehouse",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51064": {
      "school_short": "Mount Ida",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50964": {
      "school_short": "Muhlenberg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51112": {
      "school_short": "Nebraska Wesleyan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51124": {
      "school_short": "North Central",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50834": {
      "school_short": "Louisiana Tech",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51093": {
      "school_short": "Millsaps",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51021": {
      "school_short": "Loras",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51308": {
      "school_short": "Newberry",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51356": {
      "school_short": "Mercyhurst",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51372": {
      "school_short": "Mount Union",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50893": {
      "school_short": "Michigan Tech",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51141": {
      "school_short": "McMurry",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51249": {
      "school_short": "Norfolk State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51125": {
      "school_short": "North Park",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50910": {
      "school_short": "Northeastern State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50941": {
      "school_short": "Northern State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50883": {
      "school_short": "Northwestern State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51098": {
      "school_short": "Occidental",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51374": {
      "school_short": "Ohio Northern",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50869": {
      "school_short": "Morehead State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51185": {
      "school_short": "Marquette",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51373": {
      "school_short": "Muskingum",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51371": {
      "school_short": "John Carroll",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51188": {
      "school_short": "Michigan State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50962": {
      "school_short": "Johns Hopkins",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50853": {
      "school_short": "Missouri State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51157": {
      "school_short": "Martin Luther",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51070": {
      "school_short": "Oberlin",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51144": {
      "school_short": "Mississippi",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50935": {
      "school_short": "North Dakota State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51325": {
      "school_short": "Long Island",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51054": {
      "school_short": "MIT",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51069": {
      "school_short": "Kenyon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51297": {
      "school_short": "Mesa State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50888": {
      "school_short": "Mississippi Valley State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51257": {
      "school_short": "Morgan State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51193": {
      "school_short": "Ohio State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51303": {
      "school_short": "Mars Hill",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51189": {
      "school_short": "Northwestern",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50923": {
      "school_short": "Missouri Western State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51260": {
      "school_short": "Monmouth",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50949": {
      "school_short": "Mansfield",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51111": {
      "school_short": "Maryville",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51134": {
      "school_short": "Kentucky Wesleyan",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51211": {
      "school_short": "Miami (OH)",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51293": {
      "school_short": "Oklahoma Panhandle",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50950": {
      "school_short": "Millersville",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50927": {
      "school_short": "Missouri Southern State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51386": {
      "school_short": "Ripon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50842": {
      "school_short": "San Jose State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51154": {
      "school_short": "Olivet",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51377": {
      "school_short": "Otterbein",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50972": {
      "school_short": "Plymouth State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51366": {
      "school_short": "Principia",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51261": {
      "school_short": "Robert Morris",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51065": {
      "school_short": "Rockford",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51344": {
      "school_short": "Shaw",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50857": {
      "school_short": "Southeastern Louisiana",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50911": {
      "school_short": "SE Oklahoma-Durant",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50905": {
      "school_short": "Southern Arkansas",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51338": {
      "school_short": "Southern-Baton Rouge",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50858": {
      "school_short": "Southern Utah",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51200": {
      "school_short": "Rice",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51357": {
      "school_short": "Northern Michigan",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50894": {
      "school_short": "Northwood",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51084": {
      "school_short": "Randolph-Macon",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51304": {
      "school_short": "Presbyterian",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51358": {
      "school_short": "Saginaw Valley State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51253": {
      "school_short": "Siena",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51057": {
      "school_short": "Rowan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51285": {
      "school_short": "Portland State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51258": {
      "school_short": "NC A&T",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51095": {
      "school_short": "Rose-Hulman",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51081": {
      "school_short": "Pacific Lutheran",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51262": {
      "school_short": "Sacred Heart",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51330": {
      "school_short": "Saint Anselm",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51171": {
      "school_short": "Salisbury",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51023": {
      "school_short": "Simpson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51205": {
      "school_short": "Texas Christian",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50926": {
      "school_short": "Truman State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50899": {
      "school_short": "Ouachita Baptist",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51292": {
      "school_short": "Midwestern State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50992": {
      "school_short": "North Carolina State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51195": {
      "school_short": "Purdue",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51291": {
      "school_short": "Sam Houston State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51408": {
      "school_short": "Nichols",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51194": {
      "school_short": "Penn State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51099": {
      "school_short": "Pomona-Pitzers",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51056": {
      "school_short": "Montclair State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51310": {
      "school_short": "Shepherd",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51108": {
      "school_short": "Shenandoah",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50957": {
      "school_short": "Slippery Rock",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51290": {
      "school_short": "Montana State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50936": {
      "school_short": "South Dakota State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51208": {
      "school_short": "Southern Methodist",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50841": {
      "school_short": "San Diego State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50967": {
      "school_short": "Rensselaer Tech",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51327": {
      "school_short": "Southern Connecticut",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50956": {
      "school_short": "Shippensburg",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50924": {
      "school_short": "Northwest Missouri State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51329": {
      "school_short": "Pace",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50925": {
      "school_short": "Pittsburg State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51129": {
      "school_short": "Miles",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50828": {
      "school_short": "New Mexico State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51175": {
      "school_short": "Rutgers",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51219": {
      "school_short": "Northern Illinois",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51277": {
      "school_short": "Northeastern",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51214": {
      "school_short": "Ohio",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51136": {
      "school_short": "Quincy",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51135": {
      "school_short": "Saint Joseph`s",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50928": {
      "school_short": "Southwest Baptist",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51094": {
      "school_short": "Rhodes",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50856": {
      "school_short": "Savannah State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51351": {
      "school_short": "North Carolina Central",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51005": {
      "school_short": "Oklahoma State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50937": {
      "school_short": "St. Cloud State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50981": {
      "school_short": "St. John Fisher",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51387": {
      "school_short": "St. Norbert",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50912": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51331": {
      "school_short": "Stonehill",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51145": {
      "school_short": "Sul Ross State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51164": {
      "school_short": "Susquehanna",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51007": {
      "school_short": "Texas A&M",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51339": {
      "school_short": "Texas Southern",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51059": {
      "school_short": "New Jersey",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51206": {
      "school_short": "Tulane",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51305": {
      "school_short": "Tusculum",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50969": {
      "school_short": "Union (NY)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51264": {
      "school_short": "Albany",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51215": {
      "school_short": "Buffalo",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51212": {
      "school_short": "Akron",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50906": {
      "school_short": "Arkansas-Monticello",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51340": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51058": {
      "school_short": "Cortland",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51207": {
      "school_short": "Alabama Birmingham",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51336": {
      "school_short": "Southwest Minnesota State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50919": {
      "school_short": "Texas A&M-Kingsville",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51130": {
      "school_short": "Tuskegee",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51224": {
      "school_short": "Towson",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51047": {
      "school_short": "Tufts",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50891": {
      "school_short": "Prairie View",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51046": {
      "school_short": "Trinity",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51035": {
      "school_short": "UMass-Dartmouth",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50929": {
      "school_short": "Missouri-Rolla",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50837": {
      "school_short": "New Mexico",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51027": {
      "school_short": "Dubuque",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51187": {
      "school_short": "Illinois",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51337": {
      "school_short": "Minnesota-Crookston",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50824": {
      "school_short": "Louisiana Lafayette",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51177": {
      "school_short": "Temple",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51226": {
      "school_short": "Tennessee Tech",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50805": {
      "school_short": "Arizona",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50845": {
      "school_short": "Stephen F. Austin",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51100": {
      "school_short": "La Verne",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51176": {
      "school_short": "Syracuse",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51146": {
      "school_short": "Texas Lutheran",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51263": {
      "school_short": "Stony Brook",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50974": {
      "school_short": "Merchant Marine",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51287": {
      "school_short": "St. Mary`s",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51096": {
      "school_short": "Trinity (TX)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50943": {
      "school_short": "Charleston",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50918": {
      "school_short": "Texas A&M-Commerce",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51230": {
      "school_short": "St. Peter`s",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51159": {
      "school_short": "Brockport",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50802": {
      "school_short": "California",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50833": {
      "school_short": "Troy State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51113": {
      "school_short": "Thomas More",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51190": {
      "school_short": "Michigan",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51352": {
      "school_short": "St. Augustine`s",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51367": {
      "school_short": "Stillman",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50875": {
      "school_short": "Citadel",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51398": {
      "school_short": "St. John`s",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50825": {
      "school_short": "Louisiana Monroe",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51236": {
      "school_short": "Tennessee State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50973": {
      "school_short": "Coast Guard",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50846": {
      "school_short": "Texas State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51209": {
      "school_short": "Houston",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51181": {
      "school_short": "Louisville",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51028": {
      "school_short": "Thiel",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50913": {
      "school_short": "Tarleton State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50977": {
      "school_short": "Springfield",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51234": {
      "school_short": "Samford",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51202": {
      "school_short": "Memphis",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51316": {
      "school_short": "North Dakota",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51278": {
      "school_short": "Maine",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50832": {
      "school_short": "Montana",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50998": {
      "school_short": "Nebraska",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50863": {
      "school_short": "Pennsylvania",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51265": {
      "school_short": "Wagner",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51317": {
      "school_short": "South Dakota",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50836": {
      "school_short": "UTEP",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50880": {
      "school_short": "Tennessee-Chattanooga",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51198": {
      "school_short": "Notre Dame",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50830": {
      "school_short": "North Texas",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51003": {
      "school_short": "Oklahoma",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50815": {
      "school_short": "Kentucky",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51097": {
      "school_short": "South-Sewanee",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50806": {
      "school_short": "Southern California",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51116": {
      "school_short": "Wisconsin-La Crosse",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51119": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51122": {
      "school_short": "Wisconsin-Stout",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50831": {
      "school_short": "Utah State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51242": {
      "school_short": "VMI",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51071": {
      "school_short": "Wabash",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50930": {
      "school_short": "Washburn-Topeka",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51029": {
      "school_short": "Washington and Jefferson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50942": {
      "school_short": "Wayne State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51030": {
      "school_short": "Waynesburg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51115": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50809": {
      "school_short": "Air Force",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50813": {
      "school_short": "Vanderbilt",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51201": {
      "school_short": "Tulsa",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50814": {
      "school_short": "South Carolina",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51299": {
      "school_short": "Nebraska-Kearney",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51182": {
      "school_short": "Cincinnati",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51179": {
      "school_short": "Pittsburgh",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50993": {
      "school_short": "Maryland",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51210": {
      "school_short": "Southern Mississippi",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50854": {
      "school_short": "Northern Iowa",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50982": {
      "school_short": "Utica",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50970": {
      "school_short": "Rochester",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50914": {
      "school_short": "Central Oklahoma",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51359": {
      "school_short": "Indianapolis",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51227": {
      "school_short": "Tennessee-Martin",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50839": {
      "school_short": "Wyoming",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50999": {
      "school_short": "Missouri",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50990": {
      "school_short": "Wake Forest",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51399": {
      "school_short": "St. Thomas",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51085": {
      "school_short": "Washington and Lee",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51082": {
      "school_short": "Puget Sound",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50843": {
      "school_short": "UNLV",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51273": {
      "school_short": "Massachusetts",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51315": {
      "school_short": "Nebraska-Omaha",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51269": {
      "school_short": "Nevada",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50994": {
      "school_short": "Miami (FL)",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51178": {
      "school_short": "Connecticut",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50811": {
      "school_short": "Tennessee",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51183": {
      "school_short": "South Florida",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51001": {
      "school_short": "Colorado",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50902": {
      "school_short": "West Alabama",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51392": {
      "school_short": "Chicago",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50939": {
      "school_short": "Minnesota-Duluth",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51118": {
      "school_short": "Wisconsin-River Falls",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50907": {
      "school_short": "North Alabama",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51191": {
      "school_short": "Minnesota",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50829": {
      "school_short": "Idaho",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51239": {
      "school_short": "Dayton",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50844": {
      "school_short": "Hawaii",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51272": {
      "school_short": "Delaware",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50821": {
      "school_short": "Ole Miss",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50801": {
      "school_short": "Washington State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51101": {
      "school_short": "Redlands",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50799": {
      "school_short": "Oregon",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51197": {
      "school_short": "Iowa",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51142": {
      "school_short": "Mary Hardin-Baylor",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51393": {
      "school_short": "Washington (MO)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51362": {
      "school_short": "Willamette",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51497": {
      "school_short": "Alabama State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51645": {
      "school_short": "Alma",
      "world": "leahy",
      "division": "D-III"
    },
    "51934": {
      "school_short": "American International",
      "world": "leahy",
      "division": "D-II"
    },
    "51498": {
      "school_short": "Alcorn State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51066": {
      "school_short": "Wesley",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50975": {
      "school_short": "Western Connecticut State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50850": {
      "school_short": "Western Illinois",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51036": {
      "school_short": "Western New England",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51320": {
      "school_short": "Western Oregon",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51300": {
      "school_short": "Western State (CO)",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51041": {
      "school_short": "Westfield State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51361": {
      "school_short": "Whitworth",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51165": {
      "school_short": "Wilkes",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51060": {
      "school_short": "William Paterson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51048": {
      "school_short": "Williams",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51306": {
      "school_short": "Wingate",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51353": {
      "school_short": "Winston-Salem State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51218": {
      "school_short": "Toledo",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50908": {
      "school_short": "Valdosta State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51496": {
      "school_short": "Alabama A&M",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50896": {
      "school_short": "Wayne State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51024": {
      "school_short": "Wartburg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51643": {
      "school_short": "Adrian",
      "world": "leahy",
      "division": "D-III"
    },
    "51345": {
      "school_short": "Virginia State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51120": {
      "school_short": "Wisconsin-Whitewater",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51286": {
      "school_short": "Weber State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50851": {
      "school_short": "Western Kentucky",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51925": {
      "school_short": "Albany State",
      "world": "leahy",
      "division": "D-II"
    },
    "50900": {
      "school_short": "West Georgia",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51346": {
      "school_short": "Virginia Union",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51153": {
      "school_short": "Wisconsin Lutheran",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50877": {
      "school_short": "Wofford",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51042": {
      "school_short": "Worcester State",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50864": {
      "school_short": "Yale",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51052": {
      "school_short": "Wesleyan",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51114": {
      "school_short": "Westminster (MO)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51405": {
      "school_short": "Westminster (PA)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51018": {
      "school_short": "Wheaton",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50945": {
      "school_short": "West Virginia State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50938": {
      "school_short": "Winona State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51907": {
      "school_short": "Adams State",
      "world": "leahy",
      "division": "D-II"
    },
    "51715": {
      "school_short": "Averett",
      "world": "leahy",
      "division": "D-III"
    },
    "51981": {
      "school_short": "Baldwin-Wallace",
      "world": "leahy",
      "division": "D-III"
    },
    "51625": {
      "school_short": "Benedictine",
      "world": "leahy",
      "division": "D-III"
    },
    "51935": {
      "school_short": "Bentley",
      "world": "leahy",
      "division": "D-II"
    },
    "52007": {
      "school_short": "Bethel",
      "world": "leahy",
      "division": "D-III"
    },
    "51608": {
      "school_short": "Boston",
      "world": "leahy",
      "division": "D-IA"
    },
    "51415": {
      "school_short": "BYU",
      "world": "leahy",
      "division": "D-IA"
    },
    "50827": {
      "school_short": "Army",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51294": {
      "school_short": "Western New Mexico",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51102": {
      "school_short": "Whittier",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50838": {
      "school_short": "Utah",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51595": {
      "school_short": "Aurora",
      "world": "leahy",
      "division": "D-III"
    },
    "50826": {
      "school_short": "Navy",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51980": {
      "school_short": "Blackburn",
      "world": "leahy",
      "division": "D-III"
    },
    "51698": {
      "school_short": "Anderson",
      "world": "leahy",
      "division": "D-III"
    },
    "51170": {
      "school_short": "Widener",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51004": {
      "school_short": "Texas",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51241": {
      "school_short": "Valparaiso",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51220": {
      "school_short": "Western Michigan",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51655": {
      "school_short": "Amherst",
      "world": "leahy",
      "division": "D-III"
    },
    "51416": {
      "school_short": "Arizona State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51829": {
      "school_short": "Bowling Green",
      "world": "leahy",
      "division": "D-IA"
    },
    "50965": {
      "school_short": "Ursinus",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51755": {
      "school_short": "Austin",
      "world": "leahy",
      "division": "D-III"
    },
    "51378": {
      "school_short": "Wilmington (OH)",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50800": {
      "school_short": "Washington",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51528": {
      "school_short": "Angelo State",
      "world": "leahy",
      "division": "D-II"
    },
    "51590": {
      "school_short": "Alfred",
      "world": "leahy",
      "division": "D-III"
    },
    "51936": {
      "school_short": "Bryant",
      "world": "leahy",
      "division": "D-II"
    },
    "51479": {
      "school_short": "Bucknell",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51631": {
      "school_short": "Buena Vista",
      "world": "leahy",
      "division": "D-III"
    },
    "51673": {
      "school_short": "Buffalo",
      "world": "leahy",
      "division": "D-III"
    },
    "51982": {
      "school_short": "Capital",
      "world": "leahy",
      "division": "D-III"
    },
    "52012": {
      "school_short": "Carleton",
      "world": "leahy",
      "division": "D-III"
    },
    "51690": {
      "school_short": "Case Western",
      "world": "leahy",
      "division": "D-III"
    },
    "51994": {
      "school_short": "Catholic",
      "world": "leahy",
      "division": "D-III"
    },
    "51878": {
      "school_short": "Central Connecticut",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51471": {
      "school_short": "Brown",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51533": {
      "school_short": "Central Missouri State",
      "world": "leahy",
      "division": "D-II"
    },
    "51570": {
      "school_short": "Chadron State",
      "world": "leahy",
      "division": "D-II"
    },
    "51482": {
      "school_short": "Charleston Southern",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51311": {
      "school_short": "West Virginia Tech",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51661": {
      "school_short": "Bates",
      "world": "leahy",
      "division": "D-III"
    },
    "52000": {
      "school_short": "Carroll",
      "world": "leahy",
      "division": "D-III"
    },
    "51914": {
      "school_short": "Catawba",
      "world": "leahy",
      "division": "D-II"
    },
    "51321": {
      "school_short": "Western Washington",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51772": {
      "school_short": "Albright",
      "world": "leahy",
      "division": "D-III"
    },
    "51312": {
      "school_short": "West Virginia Wesleyan",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51447": {
      "school_short": "Boise State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51629": {
      "school_short": "Augustana (IL)",
      "world": "leahy",
      "division": "D-III"
    },
    "51558": {
      "school_short": "Bloomsburg",
      "world": "leahy",
      "division": "D-II"
    },
    "51954": {
      "school_short": "Bowie State",
      "world": "leahy",
      "division": "D-II"
    },
    "51855": {
      "school_short": "Austin Peay",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51484": {
      "school_short": "Appalachian State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50876": {
      "school_short": "Western Carolina",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51072": {
      "school_short": "Wittenberg",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51699": {
      "school_short": "Bluffton",
      "world": "leahy",
      "division": "D-III"
    },
    "51452": {
      "school_short": "Fresno State",
      "world": "leahy",
      "division": "D-IA"
    },
    "52006": {
      "school_short": "Augsburg",
      "world": "leahy",
      "division": "D-III"
    },
    "51545": {
      "school_short": "Augustana",
      "world": "leahy",
      "division": "D-II"
    },
    "51926": {
      "school_short": "Benedict",
      "world": "leahy",
      "division": "D-II"
    },
    "51480": {
      "school_short": "Colgate",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51680": {
      "school_short": "Wooster",
      "world": "leahy",
      "division": "D-III"
    },
    "51596": {
      "school_short": "Concordia (WI)",
      "world": "leahy",
      "division": "D-III"
    },
    "51477": {
      "school_short": "Cornell",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51515": {
      "school_short": "Delta State",
      "world": "leahy",
      "division": "D-II"
    },
    "51685": {
      "school_short": "Denison",
      "world": "leahy",
      "division": "D-III"
    },
    "51796": {
      "school_short": "DePaul",
      "world": "leahy",
      "division": "D-IA"
    },
    "51704": {
      "school_short": "DePauw",
      "world": "leahy",
      "division": "D-III"
    },
    "51850": {
      "school_short": "Drake",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51686": {
      "school_short": "Earlham",
      "world": "leahy",
      "division": "D-III"
    },
    "51559": {
      "school_short": "East Stroudsburg",
      "world": "leahy",
      "division": "D-II"
    },
    "51490": {
      "school_short": "East Tennessee State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51674": {
      "school_short": "Chapman",
      "world": "leahy",
      "division": "D-III"
    },
    "51896": {
      "school_short": "Cal Poly",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51849": {
      "school_short": "Butler",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51863": {
      "school_short": "Duquesne",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51940": {
      "school_short": "Assumption",
      "world": "leahy",
      "division": "D-II"
    },
    "51679": {
      "school_short": "Allegheny",
      "world": "leahy",
      "division": "D-III"
    },
    "51649": {
      "school_short": "Bridgewater State",
      "world": "leahy",
      "division": "D-III"
    },
    "51689": {
      "school_short": "Carnegie Mellon",
      "world": "leahy",
      "division": "D-III"
    },
    "51930": {
      "school_short": "Central Washington",
      "world": "leahy",
      "division": "D-II"
    },
    "52015": {
      "school_short": "Bethany",
      "world": "leahy",
      "division": "D-III"
    },
    "51991": {
      "school_short": "Mount St. Joseph",
      "world": "leahy",
      "division": "D-III"
    },
    "51552": {
      "school_short": "Concordia",
      "world": "leahy",
      "division": "D-II"
    },
    "51703": {
      "school_short": "Centre",
      "world": "leahy",
      "division": "D-III"
    },
    "51434": {
      "school_short": "Arkansas State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51946": {
      "school_short": "Bemidji State",
      "world": "leahy",
      "division": "D-II"
    },
    "51738": {
      "school_short": "Carthage",
      "world": "leahy",
      "division": "D-III"
    },
    "51866": {
      "school_short": "Bethune-Cookman",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51620": {
      "school_short": "Baylor",
      "world": "leahy",
      "division": "D-IA"
    },
    "51773": {
      "school_short": "Delaware Valley",
      "world": "leahy",
      "division": "D-III"
    },
    "51858": {
      "school_short": "Holy Cross",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51784": {
      "school_short": "Beloit",
      "world": "leahy",
      "division": "D-III"
    },
    "51759": {
      "school_short": "California Lutheran",
      "world": "leahy",
      "division": "D-III"
    },
    "51409": {
      "school_short": "Central Michigan",
      "world": "leahy",
      "division": "D-IA"
    },
    "51527": {
      "school_short": "Abilene Christian",
      "world": "leahy",
      "division": "D-II"
    },
    "51833": {
      "school_short": "Ball State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51811": {
      "school_short": "East Carolina",
      "world": "leahy",
      "division": "D-IA"
    },
    "51843": {
      "school_short": "Eastern Kentucky",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51428": {
      "school_short": "Auburn",
      "world": "leahy",
      "division": "D-IA"
    },
    "51529": {
      "school_short": "Eastern New Mexico",
      "world": "leahy",
      "division": "D-II"
    },
    "51627": {
      "school_short": "Elmhurst",
      "world": "leahy",
      "division": "D-III"
    },
    "51491": {
      "school_short": "Elon",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52019": {
      "school_short": "Endicott",
      "world": "leahy",
      "division": "D-III"
    },
    "51621": {
      "school_short": "Eureka",
      "world": "leahy",
      "division": "D-III"
    },
    "51778": {
      "school_short": "Fairleigh Dickinson",
      "world": "leahy",
      "division": "D-III"
    },
    "51945": {
      "school_short": "Fairmont State",
      "world": "leahy",
      "division": "D-II"
    },
    "51638": {
      "school_short": "Cornell",
      "world": "leahy",
      "division": "D-III"
    },
    "51565": {
      "school_short": "Clarion",
      "world": "leahy",
      "division": "D-II"
    },
    "51944": {
      "school_short": "Concord",
      "world": "leahy",
      "division": "D-II"
    },
    "51862": {
      "school_short": "Delaware State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51837": {
      "school_short": "Eastern Illinois",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51473": {
      "school_short": "Dartmouth",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51993": {
      "school_short": "Bridgewater",
      "world": "leahy",
      "division": "D-III"
    },
    "51975": {
      "school_short": "Eastern Oregon",
      "world": "leahy",
      "division": "D-III"
    },
    "51895": {
      "school_short": "Eastern Washington",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51637": {
      "school_short": "Coe",
      "world": "leahy",
      "division": "D-III"
    },
    "51656": {
      "school_short": "Colby",
      "world": "leahy",
      "division": "D-III"
    },
    "52008": {
      "school_short": "Concordia",
      "world": "leahy",
      "division": "D-III"
    },
    "51856": {
      "school_short": "Davidson",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51598": {
      "school_short": "Duke",
      "world": "leahy",
      "division": "D-IA"
    },
    "51960": {
      "school_short": "Fayetteville State",
      "world": "leahy",
      "division": "D-II"
    },
    "51717": {
      "school_short": "Ferrum",
      "world": "leahy",
      "division": "D-III"
    },
    "51665": {
      "school_short": "Framingham State",
      "world": "leahy",
      "division": "D-III"
    },
    "51534": {
      "school_short": "Emporia State",
      "world": "leahy",
      "division": "D-II"
    },
    "51992": {
      "school_short": "Defiance",
      "world": "leahy",
      "division": "D-III"
    },
    "51721": {
      "school_short": "Chowan",
      "world": "leahy",
      "division": "D-III"
    },
    "51626": {
      "school_short": "Concordia (IL)",
      "world": "leahy",
      "division": "D-III"
    },
    "51650": {
      "school_short": "Fitchburg State",
      "world": "leahy",
      "division": "D-III"
    },
    "51599": {
      "school_short": "Georgia Tech",
      "world": "leahy",
      "division": "D-IA"
    },
    "51486": {
      "school_short": "Georgia Southern",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51622": {
      "school_short": "Greenville",
      "world": "leahy",
      "division": "D-III"
    },
    "51996": {
      "school_short": "Guilford",
      "world": "leahy",
      "division": "D-III"
    },
    "52009": {
      "school_short": "Gustavus Adolphus",
      "world": "leahy",
      "division": "D-III"
    },
    "52013": {
      "school_short": "Hamline",
      "world": "leahy",
      "division": "D-III"
    },
    "51695": {
      "school_short": "Hampden-Sydney",
      "world": "leahy",
      "division": "D-III"
    },
    "51591": {
      "school_short": "Hartwick",
      "world": "leahy",
      "division": "D-III"
    },
    "51516": {
      "school_short": "Henderson State",
      "world": "leahy",
      "division": "D-II"
    },
    "51687": {
      "school_short": "Hiram",
      "world": "leahy",
      "division": "D-III"
    },
    "51888": {
      "school_short": "Hofstra",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51763": {
      "school_short": "Hope",
      "world": "leahy",
      "division": "D-III"
    },
    "51868": {
      "school_short": "Howard",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51770": {
      "school_short": "Husson",
      "world": "leahy",
      "division": "D-III"
    },
    "51785": {
      "school_short": "Illinois",
      "world": "leahy",
      "division": "D-III"
    },
    "51459": {
      "school_short": "Illinois State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51628": {
      "school_short": "Illinois Wesleyan",
      "world": "leahy",
      "division": "D-III"
    },
    "51460": {
      "school_short": "Indiana State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51840": {
      "school_short": "Iona",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51614": {
      "school_short": "Iowa State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51859": {
      "school_short": "Fordham",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51921": {
      "school_short": "Glenville",
      "world": "leahy",
      "division": "D-II"
    },
    "51761": {
      "school_short": "Dickinson",
      "world": "leahy",
      "division": "D-III"
    },
    "51882": {
      "school_short": "William & Mary",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51501": {
      "school_short": "Gardner-Webb",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51955": {
      "school_short": "Elizabeth City",
      "world": "leahy",
      "division": "D-II"
    },
    "51739": {
      "school_short": "Fort Valley State",
      "world": "leahy",
      "division": "D-II"
    },
    "51700": {
      "school_short": "Franklin",
      "world": "leahy",
      "division": "D-III"
    },
    "51544": {
      "school_short": "Cheyney",
      "world": "leahy",
      "division": "D-II"
    },
    "51828": {
      "school_short": "Eastern Michigan",
      "world": "leahy",
      "division": "D-IA"
    },
    "52018": {
      "school_short": "Curry",
      "world": "leahy",
      "division": "D-III"
    },
    "51597": {
      "school_short": "Clemson",
      "world": "leahy",
      "division": "D-IA"
    },
    "51521": {
      "school_short": "East Central",
      "world": "leahy",
      "division": "D-II"
    },
    "51502": {
      "school_short": "Grambling State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51743": {
      "school_short": "Clark Atlanta",
      "world": "leahy",
      "division": "D-II"
    },
    "51972": {
      "school_short": "Ferris State",
      "world": "leahy",
      "division": "D-II"
    },
    "51571": {
      "school_short": "Colorado School of Mines",
      "world": "leahy",
      "division": "D-II"
    },
    "51578": {
      "school_short": "Hobart",
      "world": "leahy",
      "division": "D-III"
    },
    "51751": {
      "school_short": "Howard Payne",
      "world": "leahy",
      "division": "D-III"
    },
    "51718": {
      "school_short": "Greensboro",
      "world": "leahy",
      "division": "D-III"
    },
    "51483": {
      "school_short": "Coastal Carolina",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51762": {
      "school_short": "Franklin & Marshall",
      "world": "leahy",
      "division": "D-III"
    },
    "52001": {
      "school_short": "Grinnell",
      "world": "leahy",
      "division": "D-III"
    },
    "51663": {
      "school_short": "Hamilton",
      "world": "leahy",
      "division": "D-III"
    },
    "51867": {
      "school_short": "Hampton",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51995": {
      "school_short": "Emory and Henry",
      "world": "leahy",
      "division": "D-III"
    },
    "51566": {
      "school_short": "Edinboro",
      "world": "leahy",
      "division": "D-II"
    },
    "51908": {
      "school_short": "Fort Lewis",
      "world": "leahy",
      "division": "D-II"
    },
    "51504": {
      "school_short": "Hillsdale",
      "world": "leahy",
      "division": "D-II"
    },
    "51808": {
      "school_short": "Indiana",
      "world": "leahy",
      "division": "D-IA"
    },
    "51603": {
      "school_short": "Florida State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51976": {
      "school_short": "Frostburg State",
      "world": "leahy",
      "division": "D-III"
    },
    "51485": {
      "school_short": "Furman",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51510": {
      "school_short": "Harding",
      "world": "leahy",
      "division": "D-II"
    },
    "51667": {
      "school_short": "Kean",
      "world": "leahy",
      "division": "D-III"
    },
    "51864": {
      "school_short": "La Salle",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51834": {
      "school_short": "Lafayette",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51786": {
      "school_short": "Lake Forest",
      "world": "leahy",
      "division": "D-III"
    },
    "51623": {
      "school_short": "Lakeland",
      "world": "leahy",
      "division": "D-III"
    },
    "51744": {
      "school_short": "Lane",
      "world": "leahy",
      "division": "D-II"
    },
    "52003": {
      "school_short": "Lawrence",
      "world": "leahy",
      "division": "D-III"
    },
    "51691": {
      "school_short": "Lewis and Clark",
      "world": "leahy",
      "division": "D-III"
    },
    "51953": {
      "school_short": "Liberty",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51937": {
      "school_short": "Long Island",
      "world": "leahy",
      "division": "D-II"
    },
    "51634": {
      "school_short": "Luther",
      "world": "leahy",
      "division": "D-III"
    },
    "51767": {
      "school_short": "Macalester",
      "world": "leahy",
      "division": "D-III"
    },
    "51624": {
      "school_short": "MacMurray",
      "world": "leahy",
      "division": "D-III"
    },
    "51702": {
      "school_short": "Manchester",
      "world": "leahy",
      "division": "D-III"
    },
    "51573": {
      "school_short": "Gettysburg",
      "world": "leahy",
      "division": "D-III"
    },
    "51474": {
      "school_short": "Harvard",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51900": {
      "school_short": "Idaho State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51962": {
      "school_short": "Livingstone",
      "world": "leahy",
      "division": "D-II"
    },
    "51987": {
      "school_short": "Heidelberg",
      "world": "leahy",
      "division": "D-III"
    },
    "52016": {
      "school_short": "Grove City",
      "world": "leahy",
      "division": "D-III"
    },
    "51429": {
      "school_short": "LSU",
      "world": "leahy",
      "division": "D-IA"
    },
    "51841": {
      "school_short": "Marist",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51797": {
      "school_short": "Marquette",
      "world": "leahy",
      "division": "D-IA"
    },
    "51915": {
      "school_short": "Mars Hill",
      "world": "leahy",
      "division": "D-II"
    },
    "51666": {
      "school_short": "MIT",
      "world": "leahy",
      "division": "D-III"
    },
    "51652": {
      "school_short": "Massachusetts Maritime",
      "world": "leahy",
      "division": "D-III"
    },
    "51753": {
      "school_short": "McMurry",
      "world": "leahy",
      "division": "D-III"
    },
    "51977": {
      "school_short": "Menlo",
      "world": "leahy",
      "division": "D-III"
    },
    "51719": {
      "school_short": "Methodist",
      "world": "leahy",
      "division": "D-III"
    },
    "51505": {
      "school_short": "Michigan Tech",
      "world": "leahy",
      "division": "D-II"
    },
    "51651": {
      "school_short": "Maine Maritime",
      "world": "leahy",
      "division": "D-III"
    },
    "51681": {
      "school_short": "Kenyon",
      "world": "leahy",
      "division": "D-III"
    },
    "51633": {
      "school_short": "Loras",
      "world": "leahy",
      "division": "D-III"
    },
    "51775": {
      "school_short": "Lycoming",
      "world": "leahy",
      "division": "D-III"
    },
    "51769": {
      "school_short": "Martin Luther",
      "world": "leahy",
      "division": "D-III"
    },
    "51823": {
      "school_short": "Miami (OH)",
      "world": "leahy",
      "division": "D-IA"
    },
    "51774": {
      "school_short": "King`s",
      "world": "leahy",
      "division": "D-III"
    },
    "52002": {
      "school_short": "Knox",
      "world": "leahy",
      "division": "D-III"
    },
    "51560": {
      "school_short": "Kutztown",
      "world": "leahy",
      "division": "D-II"
    },
    "51947": {
      "school_short": "Minnesota State-Moorhead",
      "world": "leahy",
      "division": "D-II"
    },
    "51997": {
      "school_short": "Monmouth (IL)",
      "world": "leahy",
      "division": "D-III"
    },
    "51872": {
      "school_short": "Monmouth",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51435": {
      "school_short": "Middle Tennessee State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51781": {
      "school_short": "Moravian",
      "world": "leahy",
      "division": "D-III"
    },
    "51481": {
      "school_short": "Morehead State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51676": {
      "school_short": "Mount Ida",
      "world": "leahy",
      "division": "D-III"
    },
    "51985": {
      "school_short": "Muskingum",
      "world": "leahy",
      "division": "D-III"
    },
    "51910": {
      "school_short": "New Mexico Highlands",
      "world": "leahy",
      "division": "D-II"
    },
    "52020": {
      "school_short": "Nichols",
      "world": "leahy",
      "division": "D-III"
    },
    "51861": {
      "school_short": "Norfolk State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51959": {
      "school_short": "Gannon",
      "world": "leahy",
      "division": "D-II"
    },
    "51752": {
      "school_short": "Louisiana",
      "world": "leahy",
      "division": "D-III"
    },
    "51780": {
      "school_short": "Lebanon Valley",
      "world": "leahy",
      "division": "D-III"
    },
    "51543": {
      "school_short": "Lock Haven",
      "world": "leahy",
      "division": "D-II"
    },
    "51692": {
      "school_short": "Linfield",
      "world": "leahy",
      "division": "D-III"
    },
    "51722": {
      "school_short": "Maranatha Baptist",
      "world": "leahy",
      "division": "D-III"
    },
    "51893": {
      "school_short": "Florida Atlantic",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51572": {
      "school_short": "Fort Hays State",
      "world": "leahy",
      "division": "D-II"
    },
    "51705": {
      "school_short": "Millsaps",
      "world": "leahy",
      "division": "D-III"
    },
    "51499": {
      "school_short": "Jackson State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51609": {
      "school_short": "Kansas State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51883": {
      "school_short": "James Madison",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51880": {
      "school_short": "Georgetown",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51561": {
      "school_short": "Mansfield",
      "world": "leahy",
      "division": "D-II"
    },
    "51740": {
      "school_short": "Kentucky State",
      "world": "leahy",
      "division": "D-II"
    },
    "51983": {
      "school_short": "John Carroll",
      "world": "leahy",
      "division": "D-III"
    },
    "51567": {
      "school_short": "Indiana (PA)",
      "world": "leahy",
      "division": "D-II"
    },
    "51701": {
      "school_short": "Hanover",
      "world": "leahy",
      "division": "D-III"
    },
    "51746": {
      "school_short": "Kentucky Wesleyan",
      "world": "leahy",
      "division": "D-II"
    },
    "51764": {
      "school_short": "Kalamazoo",
      "world": "leahy",
      "division": "D-III"
    },
    "51779": {
      "school_short": "Juniata",
      "world": "leahy",
      "division": "D-III"
    },
    "51870": {
      "school_short": "NC A&T",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51547": {
      "school_short": "North Dakota State",
      "world": "leahy",
      "division": "D-II"
    },
    "51889": {
      "school_short": "Northeastern",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51969": {
      "school_short": "Northern Michigan",
      "world": "leahy",
      "division": "D-II"
    },
    "51536": {
      "school_short": "Northwest Missouri State",
      "world": "leahy",
      "division": "D-II"
    },
    "51495": {
      "school_short": "Northwestern State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51801": {
      "school_short": "Northwestern",
      "world": "leahy",
      "division": "D-IA"
    },
    "51583": {
      "school_short": "Norwich",
      "world": "leahy",
      "division": "D-III"
    },
    "51920": {
      "school_short": "Newberry",
      "world": "leahy",
      "division": "D-II"
    },
    "51968": {
      "school_short": "Mercyhurst",
      "world": "leahy",
      "division": "D-II"
    },
    "51668": {
      "school_short": "Montclair State",
      "world": "leahy",
      "division": "D-III"
    },
    "51919": {
      "school_short": "Lenoir-Rhyne",
      "world": "leahy",
      "division": "D-II"
    },
    "51835": {
      "school_short": "Lehigh",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51938": {
      "school_short": "Merrimack",
      "world": "leahy",
      "division": "D-II"
    },
    "51465": {
      "school_short": "Missouri State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51815": {
      "school_short": "Marshall",
      "world": "leahy",
      "division": "D-IA"
    },
    "51905": {
      "school_short": "Oklahoma Panhandle",
      "world": "leahy",
      "division": "D-II"
    },
    "51546": {
      "school_short": "Minnesota State-Mankato",
      "world": "leahy",
      "division": "D-II"
    },
    "51539": {
      "school_short": "Missouri Southern State",
      "world": "leahy",
      "division": "D-II"
    },
    "51535": {
      "school_short": "Missouri Western State",
      "world": "leahy",
      "division": "D-II"
    },
    "51869": {
      "school_short": "Morgan State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51576": {
      "school_short": "Muhlenberg",
      "world": "leahy",
      "division": "D-III"
    },
    "51494": {
      "school_short": "Nicholls State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51657": {
      "school_short": "Middlebury",
      "world": "leahy",
      "division": "D-III"
    },
    "51904": {
      "school_short": "Midwestern State",
      "world": "leahy",
      "division": "D-II"
    },
    "51741": {
      "school_short": "Miles",
      "world": "leahy",
      "division": "D-II"
    },
    "51845": {
      "school_short": "Murray State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51461": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51589": {
      "school_short": "Springfield",
      "world": "leahy",
      "division": "D-III"
    },
    "51766": {
      "school_short": "Olivet",
      "world": "leahy",
      "division": "D-III"
    },
    "51806": {
      "school_short": "Penn State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51711": {
      "school_short": "Pomona-Pitzers",
      "world": "leahy",
      "division": "D-III"
    },
    "51897": {
      "school_short": "Portland State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51503": {
      "school_short": "Prairie View",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51978": {
      "school_short": "Principia",
      "world": "leahy",
      "division": "D-III"
    },
    "51748": {
      "school_short": "Quincy",
      "world": "leahy",
      "division": "D-II"
    },
    "51706": {
      "school_short": "Rhodes",
      "world": "leahy",
      "division": "D-III"
    },
    "51998": {
      "school_short": "Ripon",
      "world": "leahy",
      "division": "D-III"
    },
    "51873": {
      "school_short": "Robert Morris",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51677": {
      "school_short": "Rockford",
      "world": "leahy",
      "division": "D-III"
    },
    "51669": {
      "school_short": "Rowan",
      "world": "leahy",
      "division": "D-III"
    },
    "51747": {
      "school_short": "Saint Joseph`s",
      "world": "leahy",
      "division": "D-II"
    },
    "51646": {
      "school_short": "Salve Regina",
      "world": "leahy",
      "division": "D-III"
    },
    "51846": {
      "school_short": "Samford",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51453": {
      "school_short": "San Diego State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51922": {
      "school_short": "Shepherd",
      "world": "leahy",
      "division": "D-II"
    },
    "51617": {
      "school_short": "Oklahoma State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51440": {
      "school_short": "New Mexico State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51942": {
      "school_short": "Saint Anselm",
      "world": "leahy",
      "division": "D-II"
    },
    "51575": {
      "school_short": "McDaniel",
      "world": "leahy",
      "division": "D-III"
    },
    "51493": {
      "school_short": "McNeese State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51737": {
      "school_short": "North Park",
      "world": "leahy",
      "division": "D-III"
    },
    "51604": {
      "school_short": "North Carolina State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51986": {
      "school_short": "Ohio Northern",
      "world": "leahy",
      "division": "D-III"
    },
    "51857": {
      "school_short": "Jacksonville",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51562": {
      "school_short": "Millersville",
      "world": "leahy",
      "division": "D-II"
    },
    "51553": {
      "school_short": "Northern State",
      "world": "leahy",
      "division": "D-II"
    },
    "51723": {
      "school_short": "Maryville",
      "world": "leahy",
      "division": "D-III"
    },
    "51478": {
      "school_short": "Princeton",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51696": {
      "school_short": "Randolph-Macon",
      "world": "leahy",
      "division": "D-III"
    },
    "51506": {
      "school_short": "Northwood",
      "world": "leahy",
      "division": "D-II"
    },
    "51446": {
      "school_short": "Louisiana Tech",
      "world": "leahy",
      "division": "D-IA"
    },
    "51522": {
      "school_short": "Northeastern State",
      "world": "leahy",
      "division": "D-II"
    },
    "51844": {
      "school_short": "Jacksonville State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51963": {
      "school_short": "North Carolina Central",
      "world": "leahy",
      "division": "D-II"
    },
    "51800": {
      "school_short": "Michigan State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51410": {
      "school_short": "Oregon State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51879": {
      "school_short": "Saint Francis",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51831": {
      "school_short": "Northern Illinois",
      "world": "leahy",
      "division": "D-IA"
    },
    "51430": {
      "school_short": "Mississippi State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51682": {
      "school_short": "Oberlin",
      "world": "leahy",
      "division": "D-III"
    },
    "51826": {
      "school_short": "Ohio",
      "world": "leahy",
      "division": "D-IA"
    },
    "51710": {
      "school_short": "Occidental",
      "world": "leahy",
      "division": "D-III"
    },
    "51909": {
      "school_short": "Mesa State",
      "world": "leahy",
      "division": "D-II"
    },
    "51635": {
      "school_short": "Simpson",
      "world": "leahy",
      "division": "D-III"
    },
    "51847": {
      "school_short": "Southeast Missouri State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51470": {
      "school_short": "Southern Utah",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51540": {
      "school_short": "Southwest Baptist",
      "world": "leahy",
      "division": "D-II"
    },
    "51524": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "leahy",
      "division": "D-II"
    },
    "51584": {
      "school_short": "Plymouth State",
      "world": "leahy",
      "division": "D-III"
    },
    "51783": {
      "school_short": "Salisbury",
      "world": "leahy",
      "division": "D-III"
    },
    "51956": {
      "school_short": "Shaw",
      "world": "leahy",
      "division": "D-II"
    },
    "51568": {
      "school_short": "Shippensburg",
      "world": "leahy",
      "division": "D-II"
    },
    "51871": {
      "school_short": "SC State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51469": {
      "school_short": "Southeastern Louisiana",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51939": {
      "school_short": "Southern Connecticut",
      "world": "leahy",
      "division": "D-II"
    },
    "51989": {
      "school_short": "Otterbein",
      "world": "leahy",
      "division": "D-III"
    },
    "51511": {
      "school_short": "Ouachita Baptist",
      "world": "leahy",
      "division": "D-II"
    },
    "51865": {
      "school_short": "Siena",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51523": {
      "school_short": "SE Oklahoma-Durant",
      "world": "leahy",
      "division": "D-II"
    },
    "51468": {
      "school_short": "Savannah State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51693": {
      "school_short": "Pacific Lutheran",
      "world": "leahy",
      "division": "D-III"
    },
    "51517": {
      "school_short": "Southern Arkansas",
      "world": "leahy",
      "division": "D-II"
    },
    "51569": {
      "school_short": "Slippery Rock",
      "world": "leahy",
      "division": "D-II"
    },
    "51720": {
      "school_short": "Shenandoah",
      "world": "leahy",
      "division": "D-III"
    },
    "51874": {
      "school_short": "Sacred Heart",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51970": {
      "school_short": "Saginaw Valley State",
      "world": "leahy",
      "division": "D-II"
    },
    "51454": {
      "school_short": "San Jose State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51549": {
      "school_short": "St. Cloud State",
      "world": "leahy",
      "division": "D-II"
    },
    "51593": {
      "school_short": "St. John Fisher",
      "world": "leahy",
      "division": "D-III"
    },
    "51580": {
      "school_short": "St. Lawrence",
      "world": "leahy",
      "division": "D-III"
    },
    "51999": {
      "school_short": "St. Norbert",
      "world": "leahy",
      "division": "D-III"
    },
    "52014": {
      "school_short": "St. Olaf",
      "world": "leahy",
      "division": "D-III"
    },
    "51457": {
      "school_short": "Stephen F. Austin",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51875": {
      "school_short": "Stony Brook",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51581": {
      "school_short": "Union (NY)",
      "world": "leahy",
      "division": "D-III"
    },
    "51848": {
      "school_short": "Tennessee State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51838": {
      "school_short": "Tennessee Tech",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51758": {
      "school_short": "Texas Lutheran",
      "world": "leahy",
      "division": "D-III"
    },
    "51951": {
      "school_short": "Texas Southern",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51836": {
      "school_short": "Towson",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51445": {
      "school_short": "Troy State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51538": {
      "school_short": "Truman State",
      "world": "leahy",
      "division": "D-II"
    },
    "51818": {
      "school_short": "Tulane",
      "world": "leahy",
      "division": "D-IA"
    },
    "51917": {
      "school_short": "Tusculum",
      "world": "leahy",
      "division": "D-II"
    },
    "51742": {
      "school_short": "Tuskegee",
      "world": "leahy",
      "division": "D-II"
    },
    "51824": {
      "school_short": "Akron",
      "world": "leahy",
      "division": "D-IA"
    },
    "51518": {
      "school_short": "Arkansas-Monticello",
      "world": "leahy",
      "division": "D-II"
    },
    "51952": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51513": {
      "school_short": "Central Arkansas",
      "world": "leahy",
      "division": "D-II"
    },
    "51526": {
      "school_short": "Central Oklahoma",
      "world": "leahy",
      "division": "D-II"
    },
    "51670": {
      "school_short": "Cortland",
      "world": "leahy",
      "division": "D-III"
    },
    "51842": {
      "school_short": "St. Peter`s",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51776": {
      "school_short": "Susquehanna",
      "world": "leahy",
      "division": "D-III"
    },
    "51876": {
      "school_short": "Albany",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51417": {
      "school_short": "Arizona",
      "world": "leahy",
      "division": "D-IA"
    },
    "51419": {
      "school_short": "UCLA",
      "world": "leahy",
      "division": "D-IA"
    },
    "52004": {
      "school_short": "Chicago",
      "world": "leahy",
      "division": "D-III"
    },
    "51964": {
      "school_short": "St. Augustine`s",
      "world": "leahy",
      "division": "D-II"
    },
    "51612": {
      "school_short": "Kansas",
      "world": "leahy",
      "division": "D-IA"
    },
    "51444": {
      "school_short": "Montana",
      "world": "leahy",
      "division": "D-IA"
    },
    "51487": {
      "school_short": "Citadel",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51943": {
      "school_short": "Stonehill",
      "world": "leahy",
      "division": "D-II"
    },
    "51794": {
      "school_short": "Cincinnati",
      "world": "leahy",
      "division": "D-IA"
    },
    "51979": {
      "school_short": "Stillman",
      "world": "leahy",
      "division": "D-III"
    },
    "51812": {
      "school_short": "Rice",
      "world": "leahy",
      "division": "D-IA"
    },
    "51950": {
      "school_short": "Southern-Baton Rouge",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51688": {
      "school_short": "Ohio Wesleyan",
      "world": "leahy",
      "division": "D-III"
    },
    "51420": {
      "school_short": "Stanford",
      "world": "leahy",
      "division": "D-IA"
    },
    "51820": {
      "school_short": "Southern Methodist",
      "world": "leahy",
      "division": "D-IA"
    },
    "51916": {
      "school_short": "Presbyterian",
      "world": "leahy",
      "division": "D-II"
    },
    "51984": {
      "school_short": "Mount Union",
      "world": "leahy",
      "division": "D-III"
    },
    "51802": {
      "school_short": "Michigan",
      "world": "leahy",
      "division": "D-IA"
    },
    "51807": {
      "school_short": "Purdue",
      "world": "leahy",
      "division": "D-IA"
    },
    "51707": {
      "school_short": "Rose-Hulman",
      "world": "leahy",
      "division": "D-III"
    },
    "51787": {
      "school_short": "Rutgers",
      "world": "leahy",
      "division": "D-IA"
    },
    "51817": {
      "school_short": "Texas Christian",
      "world": "leahy",
      "division": "D-IA"
    },
    "51418": {
      "school_short": "Southern California",
      "world": "leahy",
      "division": "D-IA"
    },
    "51790": {
      "school_short": "Connecticut",
      "world": "leahy",
      "division": "D-IA"
    },
    "51640": {
      "school_short": "Thiel",
      "world": "leahy",
      "division": "D-III"
    },
    "51619": {
      "school_short": "Texas A&M",
      "world": "leahy",
      "division": "D-IA"
    },
    "51659": {
      "school_short": "Tufts",
      "world": "leahy",
      "division": "D-III"
    },
    "52010": {
      "school_short": "St. John`s",
      "world": "leahy",
      "division": "D-III"
    },
    "51458": {
      "school_short": "Texas State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51424": {
      "school_short": "Florida",
      "world": "leahy",
      "division": "D-IA"
    },
    "51671": {
      "school_short": "New Jersey",
      "world": "leahy",
      "division": "D-III"
    },
    "51436": {
      "school_short": "Louisiana Lafayette",
      "world": "leahy",
      "division": "D-IA"
    },
    "51890": {
      "school_short": "Maine",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51754": {
      "school_short": "Mary Hardin-Baylor",
      "world": "leahy",
      "division": "D-III"
    },
    "51611": {
      "school_short": "Missouri",
      "world": "leahy",
      "division": "D-IA"
    },
    "51881": {
      "school_short": "Nevada",
      "world": "leahy",
      "division": "D-IA"
    },
    "51891": {
      "school_short": "New Hampshire",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51449": {
      "school_short": "New Mexico",
      "world": "leahy",
      "division": "D-IA"
    },
    "51928": {
      "school_short": "North Dakota",
      "world": "leahy",
      "division": "D-II"
    },
    "51694": {
      "school_short": "Puget Sound",
      "world": "leahy",
      "division": "D-III"
    },
    "51886": {
      "school_short": "Rhode Island",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51892": {
      "school_short": "Richmond",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51582": {
      "school_short": "Rochester",
      "world": "leahy",
      "division": "D-III"
    },
    "51426": {
      "school_short": "South Carolina",
      "world": "leahy",
      "division": "D-IA"
    },
    "51639": {
      "school_short": "Dubuque",
      "world": "leahy",
      "division": "D-III"
    },
    "51441": {
      "school_short": "Idaho",
      "world": "leahy",
      "division": "D-IA"
    },
    "51971": {
      "school_short": "Indianapolis",
      "world": "leahy",
      "division": "D-II"
    },
    "51949": {
      "school_short": "Minnesota-Crookston",
      "world": "leahy",
      "division": "D-II"
    },
    "51425": {
      "school_short": "Vanderbilt",
      "world": "leahy",
      "division": "D-IA"
    },
    "51898": {
      "school_short": "Weber State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51813": {
      "school_short": "Tulsa",
      "world": "leahy",
      "division": "D-IA"
    },
    "51728": {
      "school_short": "Wisconsin-La Crosse",
      "world": "leahy",
      "division": "D-III"
    },
    "51854": {
      "school_short": "VMI",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51730": {
      "school_short": "Wisconsin-River Falls",
      "world": "leahy",
      "division": "D-III"
    },
    "51731": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "leahy",
      "division": "D-III"
    },
    "51734": {
      "school_short": "Wisconsin-Stout",
      "world": "leahy",
      "division": "D-III"
    },
    "51577": {
      "school_short": "Ursinus",
      "world": "leahy",
      "division": "D-III"
    },
    "51439": {
      "school_short": "Army",
      "world": "leahy",
      "division": "D-IA"
    },
    "51443": {
      "school_short": "Utah State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51607": {
      "school_short": "Virginia Tech",
      "world": "leahy",
      "division": "D-IA"
    },
    "51884": {
      "school_short": "Delaware",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51422": {
      "school_short": "Georgia",
      "world": "leahy",
      "division": "D-IA"
    },
    "51594": {
      "school_short": "Utica",
      "world": "leahy",
      "division": "D-III"
    },
    "51456": {
      "school_short": "Hawaii",
      "world": "leahy",
      "division": "D-IA"
    },
    "51757": {
      "school_short": "Sul Ross State",
      "world": "leahy",
      "division": "D-III"
    },
    "51771": {
      "school_short": "Brockport",
      "world": "leahy",
      "division": "D-III"
    },
    "51530": {
      "school_short": "Texas A&M-Commerce",
      "world": "leahy",
      "division": "D-II"
    },
    "51927": {
      "school_short": "Nebraska-Omaha",
      "world": "leahy",
      "division": "D-II"
    },
    "51438": {
      "school_short": "Navy",
      "world": "leahy",
      "division": "D-IA"
    },
    "51647": {
      "school_short": "UMass-Dartmouth",
      "world": "leahy",
      "division": "D-III"
    },
    "51585": {
      "school_short": "Coast Guard",
      "world": "leahy",
      "division": "D-III"
    },
    "51827": {
      "school_short": "Buffalo",
      "world": "leahy",
      "division": "D-IA"
    },
    "51610": {
      "school_short": "Nebraska",
      "world": "leahy",
      "division": "D-IA"
    },
    "51822": {
      "school_short": "Southern Mississippi",
      "world": "leahy",
      "division": "D-IA"
    },
    "51725": {
      "school_short": "Thomas More",
      "world": "leahy",
      "division": "D-III"
    },
    "51799": {
      "school_short": "Illinois",
      "world": "leahy",
      "division": "D-IA"
    },
    "51514": {
      "school_short": "West Alabama",
      "world": "leahy",
      "division": "D-II"
    },
    "51519": {
      "school_short": "North Alabama",
      "world": "leahy",
      "division": "D-II"
    },
    "51642": {
      "school_short": "Waynesburg",
      "world": "leahy",
      "division": "D-III"
    },
    "51789": {
      "school_short": "Temple",
      "world": "leahy",
      "division": "D-IA"
    },
    "51531": {
      "school_short": "Texas A&M-Kingsville",
      "world": "leahy",
      "division": "D-II"
    },
    "51732": {
      "school_short": "Wisconsin-Whitewater",
      "world": "leahy",
      "division": "D-III"
    },
    "51708": {
      "school_short": "Trinity (TX)",
      "world": "leahy",
      "division": "D-III"
    },
    "51830": {
      "school_short": "Toledo",
      "world": "leahy",
      "division": "D-IA"
    },
    "51555": {
      "school_short": "Charleston",
      "world": "leahy",
      "division": "D-II"
    },
    "51887": {
      "school_short": "Villanova",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51450": {
      "school_short": "Utah",
      "world": "leahy",
      "division": "D-IA"
    },
    "51421": {
      "school_short": "Air Force",
      "world": "leahy",
      "division": "D-IA"
    },
    "51788": {
      "school_short": "Syracuse",
      "world": "leahy",
      "division": "D-IA"
    },
    "51809": {
      "school_short": "Iowa",
      "world": "leahy",
      "division": "D-IA"
    },
    "51713": {
      "school_short": "Redlands",
      "world": "leahy",
      "division": "D-III"
    },
    "51816": {
      "school_short": "Central Florida",
      "world": "leahy",
      "division": "D-IA"
    },
    "51658": {
      "school_short": "Trinity",
      "world": "leahy",
      "division": "D-III"
    },
    "51437": {
      "school_short": "Louisiana Monroe",
      "world": "leahy",
      "division": "D-IA"
    },
    "51712": {
      "school_short": "La Verne",
      "world": "leahy",
      "division": "D-III"
    },
    "51852": {
      "school_short": "San Diego",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51885": {
      "school_short": "Massachusetts",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51541": {
      "school_short": "Missouri-Rolla",
      "world": "leahy",
      "division": "D-II"
    },
    "51911": {
      "school_short": "Nebraska-Kearney",
      "world": "leahy",
      "division": "D-II"
    },
    "51442": {
      "school_short": "North Texas",
      "world": "leahy",
      "division": "D-IA"
    },
    "51795": {
      "school_short": "South Florida",
      "world": "leahy",
      "division": "D-IA"
    },
    "51709": {
      "school_short": "South-Sewanee",
      "world": "leahy",
      "division": "D-III"
    },
    "51615": {
      "school_short": "Oklahoma",
      "world": "leahy",
      "division": "D-IA"
    },
    "51427": {
      "school_short": "Kentucky",
      "world": "leahy",
      "division": "D-IA"
    },
    "51814": {
      "school_short": "Memphis",
      "world": "leahy",
      "division": "D-IA"
    },
    "51520": {
      "school_short": "Valdosta State",
      "world": "leahy",
      "division": "D-II"
    },
    "51542": {
      "school_short": "Washburn-Topeka",
      "world": "leahy",
      "division": "D-II"
    },
    "51678": {
      "school_short": "Wesley",
      "world": "leahy",
      "division": "D-III"
    },
    "51563": {
      "school_short": "West Chester",
      "world": "leahy",
      "division": "D-II"
    },
    "51532": {
      "school_short": "West Texas A&M",
      "world": "leahy",
      "division": "D-II"
    },
    "51557": {
      "school_short": "West Virginia State",
      "world": "leahy",
      "division": "D-II"
    },
    "51554": {
      "school_short": "Wayne State",
      "world": "leahy",
      "division": "D-II"
    },
    "51664": {
      "school_short": "Wesleyan",
      "world": "leahy",
      "division": "D-III"
    },
    "51923": {
      "school_short": "West Virginia Tech",
      "world": "leahy",
      "division": "D-II"
    },
    "51448": {
      "school_short": "UTEP",
      "world": "leahy",
      "division": "D-IA"
    },
    "51636": {
      "school_short": "Wartburg",
      "world": "leahy",
      "division": "D-III"
    },
    "52011": {
      "school_short": "St. Thomas",
      "world": "leahy",
      "division": "D-III"
    },
    "51648": {
      "school_short": "Western New England",
      "world": "leahy",
      "division": "D-III"
    },
    "51973": {
      "school_short": "Whitworth",
      "world": "leahy",
      "division": "D-III"
    },
    "51965": {
      "school_short": "Winston-Salem State",
      "world": "leahy",
      "division": "D-II"
    },
    "51765": {
      "school_short": "Wisconsin Lutheran",
      "world": "leahy",
      "division": "D-III"
    },
    "51684": {
      "school_short": "Wittenberg",
      "world": "leahy",
      "division": "D-III"
    },
    "51489": {
      "school_short": "Wofford",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52256": {
      "school_short": "Albion",
      "world": "stagg",
      "division": "D-III"
    },
    "52291": {
      "school_short": "Allegheny",
      "world": "stagg",
      "division": "D-III"
    },
    "52267": {
      "school_short": "Amherst",
      "world": "stagg",
      "division": "D-III"
    },
    "52046": {
      "school_short": "Arkansas State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52040": {
      "school_short": "Auburn",
      "world": "stagg",
      "division": "D-IA"
    },
    "52596": {
      "school_short": "Augsburg",
      "world": "stagg",
      "division": "D-III"
    },
    "52157": {
      "school_short": "Augustana",
      "world": "stagg",
      "division": "D-II"
    },
    "51726": {
      "school_short": "Westminster (MO)",
      "world": "leahy",
      "division": "D-III"
    },
    "52017": {
      "school_short": "Westminster (PA)",
      "world": "leahy",
      "division": "D-III"
    },
    "51714": {
      "school_short": "Whittier",
      "world": "leahy",
      "division": "D-III"
    },
    "51653": {
      "school_short": "Westfield State",
      "world": "leahy",
      "division": "D-III"
    },
    "52207": {
      "school_short": "Aurora",
      "world": "stagg",
      "division": "D-III"
    },
    "51793": {
      "school_short": "Louisville",
      "world": "leahy",
      "division": "D-IA"
    },
    "51733": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "leahy",
      "division": "D-III"
    },
    "51791": {
      "school_short": "Pittsburgh",
      "world": "leahy",
      "division": "D-IA"
    },
    "51974": {
      "school_short": "Willamette",
      "world": "leahy",
      "division": "D-III"
    },
    "51727": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "leahy",
      "division": "D-III"
    },
    "51601": {
      "school_short": "Virginia",
      "world": "leahy",
      "division": "D-IA"
    },
    "51451": {
      "school_short": "Wyoming",
      "world": "leahy",
      "division": "D-IA"
    },
    "51832": {
      "school_short": "Western Michigan",
      "world": "leahy",
      "division": "D-IA"
    },
    "51475": {
      "school_short": "Pennsylvania",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51616": {
      "school_short": "Texas",
      "world": "leahy",
      "division": "D-IA"
    },
    "51729": {
      "school_short": "Wisconsin-Platteville",
      "world": "leahy",
      "division": "D-III"
    },
    "51551": {
      "school_short": "Minnesota-Duluth",
      "world": "leahy",
      "division": "D-II"
    },
    "51839": {
      "school_short": "Tennessee-Martin",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52515": {
      "school_short": "Albany State",
      "world": "stagg",
      "division": "D-II"
    },
    "51588": {
      "school_short": "Worcester Tech",
      "world": "leahy",
      "division": "D-III"
    },
    "51810": {
      "school_short": "Notre Dame",
      "world": "leahy",
      "division": "D-IA"
    },
    "52445": {
      "school_short": "Austin Peay",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51957": {
      "school_short": "Virginia State",
      "world": "leahy",
      "division": "D-II"
    },
    "52202": {
      "school_short": "Alfred",
      "world": "stagg",
      "division": "D-III"
    },
    "52345": {
      "school_short": "Austin",
      "world": "stagg",
      "division": "D-III"
    },
    "52109": {
      "school_short": "Alabama State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51792": {
      "school_short": "West Virginia",
      "world": "leahy",
      "division": "D-IA"
    },
    "51411": {
      "school_short": "Oregon",
      "world": "leahy",
      "division": "D-IA"
    },
    "51412": {
      "school_short": "Washington",
      "world": "leahy",
      "division": "D-IA"
    },
    "51556": {
      "school_short": "West Liberty State",
      "world": "leahy",
      "division": "D-II"
    },
    "51641": {
      "school_short": "Washington and Jefferson",
      "world": "leahy",
      "division": "D-III"
    },
    "51660": {
      "school_short": "Williams",
      "world": "leahy",
      "division": "D-III"
    },
    "51990": {
      "school_short": "Wilmington (OH)",
      "world": "leahy",
      "division": "D-III"
    },
    "52362": {
      "school_short": "Albright",
      "world": "stagg",
      "division": "D-III"
    },
    "51602": {
      "school_short": "Wake Forest",
      "world": "leahy",
      "division": "D-IA"
    },
    "51512": {
      "school_short": "West Georgia",
      "world": "leahy",
      "division": "D-II"
    },
    "51433": {
      "school_short": "Ole Miss",
      "world": "leahy",
      "division": "D-IA"
    },
    "52556": {
      "school_short": "Ashland",
      "world": "stagg",
      "division": "D-II"
    },
    "52110": {
      "school_short": "Alcorn State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51906": {
      "school_short": "Western New Mexico",
      "world": "leahy",
      "division": "D-II"
    },
    "51958": {
      "school_short": "Virginia Union",
      "world": "leahy",
      "division": "D-II"
    },
    "51697": {
      "school_short": "Washington and Lee",
      "world": "leahy",
      "division": "D-III"
    },
    "52614": {
      "school_short": "Anderson",
      "world": "stagg",
      "division": "D-III"
    },
    "52140": {
      "school_short": "Angelo State",
      "world": "stagg",
      "division": "D-II"
    },
    "51654": {
      "school_short": "Worcester State",
      "world": "leahy",
      "division": "D-III"
    },
    "51630": {
      "school_short": "Wheaton",
      "world": "leahy",
      "division": "D-III"
    },
    "51672": {
      "school_short": "William Paterson",
      "world": "leahy",
      "division": "D-III"
    },
    "51683": {
      "school_short": "Wabash",
      "world": "leahy",
      "division": "D-III"
    },
    "52255": {
      "school_short": "Adrian",
      "world": "stagg",
      "division": "D-III"
    },
    "51777": {
      "school_short": "Wilkes",
      "world": "leahy",
      "division": "D-III"
    },
    "51476": {
      "school_short": "Yale",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52257": {
      "school_short": "Alma",
      "world": "stagg",
      "division": "D-III"
    },
    "52241": {
      "school_short": "Augustana (IL)",
      "world": "stagg",
      "division": "D-III"
    },
    "51462": {
      "school_short": "Western Illinois",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51918": {
      "school_short": "Wingate",
      "world": "leahy",
      "division": "D-II"
    },
    "52530": {
      "school_short": "Assumption",
      "world": "stagg",
      "division": "D-II"
    },
    "52176": {
      "school_short": "California (PA)",
      "world": "stagg",
      "division": "D-II"
    },
    "52571": {
      "school_short": "Baldwin-Wallace",
      "world": "stagg",
      "division": "D-III"
    },
    "52597": {
      "school_short": "Bethel",
      "world": "stagg",
      "division": "D-III"
    },
    "52615": {
      "school_short": "Bluffton",
      "world": "stagg",
      "division": "D-III"
    },
    "52220": {
      "school_short": "Boston",
      "world": "stagg",
      "division": "D-IA"
    },
    "52419": {
      "school_short": "Bowling Green",
      "world": "stagg",
      "division": "D-IA"
    },
    "52516": {
      "school_short": "Benedict",
      "world": "stagg",
      "division": "D-II"
    },
    "52083": {
      "school_short": "Brown",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52590": {
      "school_short": "Carroll",
      "world": "stagg",
      "division": "D-III"
    },
    "52302": {
      "school_short": "Case Western",
      "world": "stagg",
      "division": "D-III"
    },
    "52504": {
      "school_short": "Catawba",
      "world": "stagg",
      "division": "D-II"
    },
    "52584": {
      "school_short": "Catholic",
      "world": "stagg",
      "division": "D-III"
    },
    "52021": {
      "school_short": "Central Michigan",
      "world": "stagg",
      "division": "D-IA"
    },
    "52286": {
      "school_short": "Chapman",
      "world": "stagg",
      "division": "D-III"
    },
    "52632": {
      "school_short": "Christopher Newport",
      "world": "stagg",
      "division": "D-III"
    },
    "52350": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "stagg",
      "division": "D-III"
    },
    "52333": {
      "school_short": "Clark Atlanta",
      "world": "stagg",
      "division": "D-II"
    },
    "52209": {
      "school_short": "Clemson",
      "world": "stagg",
      "division": "D-IA"
    },
    "52249": {
      "school_short": "Coe",
      "world": "stagg",
      "division": "D-III"
    },
    "52605": {
      "school_short": "Bethany",
      "world": "stagg",
      "division": "D-III"
    },
    "52526": {
      "school_short": "Bryant",
      "world": "stagg",
      "division": "D-II"
    },
    "52243": {
      "school_short": "Buena Vista",
      "world": "stagg",
      "division": "D-III"
    },
    "52301": {
      "school_short": "Carnegie Mellon",
      "world": "stagg",
      "division": "D-III"
    },
    "52177": {
      "school_short": "Clarion",
      "world": "stagg",
      "division": "D-II"
    },
    "52092": {
      "school_short": "Colgate",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52631": {
      "school_short": "Averett",
      "world": "stagg",
      "division": "D-III"
    },
    "52486": {
      "school_short": "Cal Poly",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52085": {
      "school_short": "Dartmouth",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52439": {
      "school_short": "Butler",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52311": {
      "school_short": "Chowan",
      "world": "stagg",
      "division": "D-III"
    },
    "52028": {
      "school_short": "Arizona State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52108": {
      "school_short": "Alabama A&M",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52285": {
      "school_short": "Buffalo",
      "world": "stagg",
      "division": "D-III"
    },
    "52027": {
      "school_short": "BYU",
      "world": "stagg",
      "division": "D-IA"
    },
    "51463": {
      "school_short": "Western Kentucky",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52094": {
      "school_short": "Charleston Southern",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52525": {
      "school_short": "Bentley",
      "world": "stagg",
      "division": "D-II"
    },
    "52261": {
      "school_short": "Bridgewater State",
      "world": "stagg",
      "division": "D-III"
    },
    "52570": {
      "school_short": "Blackburn",
      "world": "stagg",
      "division": "D-III"
    },
    "52608": {
      "school_short": "Curry",
      "world": "stagg",
      "division": "D-III"
    },
    "52274": {
      "school_short": "Bowdoin",
      "world": "stagg",
      "division": "D-III"
    },
    "52349": {
      "school_short": "California Lutheran",
      "world": "stagg",
      "division": "D-III"
    },
    "52497": {
      "school_short": "Adams State",
      "world": "stagg",
      "division": "D-II"
    },
    "52005": {
      "school_short": "Washington (MO)",
      "world": "leahy",
      "division": "D-III"
    },
    "52244": {
      "school_short": "Central",
      "world": "stagg",
      "division": "D-III"
    },
    "52520": {
      "school_short": "Central Washington",
      "world": "stagg",
      "division": "D-II"
    },
    "52170": {
      "school_short": "Bloomsburg",
      "world": "stagg",
      "division": "D-II"
    },
    "52096": {
      "school_short": "Appalachian State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51782": {
      "school_short": "Widener",
      "world": "leahy",
      "division": "D-III"
    },
    "52423": {
      "school_short": "Ball State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52583": {
      "school_short": "Bridgewater",
      "world": "stagg",
      "division": "D-III"
    },
    "52524": {
      "school_short": "American International",
      "world": "stagg",
      "division": "D-II"
    },
    "51464": {
      "school_short": "Youngstown State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51924": {
      "school_short": "West Virginia Wesleyan",
      "world": "leahy",
      "division": "D-II"
    },
    "52232": {
      "school_short": "Baylor",
      "world": "stagg",
      "division": "D-IA"
    },
    "51508": {
      "school_short": "Wayne State",
      "world": "leahy",
      "division": "D-II"
    },
    "52121": {
      "school_short": "Arkansas Tech",
      "world": "stagg",
      "division": "D-II"
    },
    "52328": {
      "school_short": "Carthage",
      "world": "stagg",
      "division": "D-III"
    },
    "51587": {
      "school_short": "Western Connecticut State",
      "world": "leahy",
      "division": "D-III"
    },
    "52374": {
      "school_short": "Beloit",
      "world": "stagg",
      "division": "D-III"
    },
    "51932": {
      "school_short": "Western Oregon",
      "world": "leahy",
      "division": "D-II"
    },
    "52237": {
      "school_short": "Benedictine",
      "world": "stagg",
      "division": "D-III"
    },
    "52468": {
      "school_short": "Central Connecticut",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51933": {
      "school_short": "Western Washington",
      "world": "leahy",
      "division": "D-II"
    },
    "52503": {
      "school_short": "Carson-Newman",
      "world": "stagg",
      "division": "D-II"
    },
    "52268": {
      "school_short": "Colby",
      "world": "stagg",
      "division": "D-III"
    },
    "52619": {
      "school_short": "Centre",
      "world": "stagg",
      "division": "D-III"
    },
    "52388": {
      "school_short": "Colorado State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52446": {
      "school_short": "Davidson",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52208": {
      "school_short": "Concordia (WI)",
      "world": "stagg",
      "division": "D-III"
    },
    "52582": {
      "school_short": "Defiance",
      "world": "stagg",
      "division": "D-III"
    },
    "52452": {
      "school_short": "Delaware State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52127": {
      "school_short": "Delta State",
      "world": "stagg",
      "division": "D-II"
    },
    "52351": {
      "school_short": "Dickinson",
      "world": "stagg",
      "division": "D-III"
    },
    "52210": {
      "school_short": "Duke",
      "world": "stagg",
      "division": "D-IA"
    },
    "52453": {
      "school_short": "Duquesne",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52401": {
      "school_short": "East Carolina",
      "world": "stagg",
      "division": "D-IA"
    },
    "52102": {
      "school_short": "East Tennessee State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52433": {
      "school_short": "Eastern Kentucky",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52485": {
      "school_short": "Eastern Washington",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52178": {
      "school_short": "Edinboro",
      "world": "stagg",
      "division": "D-II"
    },
    "52545": {
      "school_short": "Elizabeth City",
      "world": "stagg",
      "division": "D-II"
    },
    "52239": {
      "school_short": "Elmhurst",
      "world": "stagg",
      "division": "D-III"
    },
    "52103": {
      "school_short": "Elon",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52585": {
      "school_short": "Emory and Henry",
      "world": "stagg",
      "division": "D-III"
    },
    "52233": {
      "school_short": "Eureka",
      "world": "stagg",
      "division": "D-III"
    },
    "52368": {
      "school_short": "Fairleigh Dickinson",
      "world": "stagg",
      "division": "D-III"
    },
    "52535": {
      "school_short": "Fairmont State",
      "world": "stagg",
      "division": "D-II"
    },
    "52550": {
      "school_short": "Fayetteville State",
      "world": "stagg",
      "division": "D-II"
    },
    "52562": {
      "school_short": "Ferris State",
      "world": "stagg",
      "division": "D-II"
    },
    "52449": {
      "school_short": "Fordham",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52184": {
      "school_short": "Fort Hays State",
      "world": "stagg",
      "division": "D-II"
    },
    "52141": {
      "school_short": "Eastern New Mexico",
      "world": "stagg",
      "division": "D-II"
    },
    "52472": {
      "school_short": "William & Mary",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52084": {
      "school_short": "Columbia",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52534": {
      "school_short": "Concord",
      "world": "stagg",
      "division": "D-II"
    },
    "52598": {
      "school_short": "Concordia",
      "world": "stagg",
      "division": "D-III"
    },
    "52089": {
      "school_short": "Cornell",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52133": {
      "school_short": "East Central",
      "world": "stagg",
      "division": "D-II"
    },
    "52375": {
      "school_short": "Illinois",
      "world": "stagg",
      "division": "D-III"
    },
    "52097": {
      "school_short": "Furman",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52549": {
      "school_short": "Gannon",
      "world": "stagg",
      "division": "D-II"
    },
    "52113": {
      "school_short": "Gardner-Webb",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52470": {
      "school_short": "Georgetown",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52234": {
      "school_short": "Greenville",
      "world": "stagg",
      "division": "D-III"
    },
    "52591": {
      "school_short": "Grinnell",
      "world": "stagg",
      "division": "D-III"
    },
    "52606": {
      "school_short": "Grove City",
      "world": "stagg",
      "division": "D-III"
    },
    "52586": {
      "school_short": "Guilford",
      "world": "stagg",
      "division": "D-III"
    },
    "52098": {
      "school_short": "Georgia Southern",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52599": {
      "school_short": "Gustavus Adolphus",
      "world": "stagg",
      "division": "D-III"
    },
    "52275": {
      "school_short": "Hamilton",
      "world": "stagg",
      "division": "D-III"
    },
    "52603": {
      "school_short": "Hamline",
      "world": "stagg",
      "division": "D-III"
    },
    "52611": {
      "school_short": "Hampden-Sydney",
      "world": "stagg",
      "division": "D-III"
    },
    "52457": {
      "school_short": "Hampton",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52572": {
      "school_short": "Capital",
      "world": "stagg",
      "division": "D-III"
    },
    "52095": {
      "school_short": "Coastal Carolina",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52609": {
      "school_short": "Endicott",
      "world": "stagg",
      "division": "D-III"
    },
    "52297": {
      "school_short": "Denison",
      "world": "stagg",
      "division": "D-III"
    },
    "52079": {
      "school_short": "Florida International",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52440": {
      "school_short": "Drake",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52620": {
      "school_short": "DePauw",
      "world": "stagg",
      "division": "D-III"
    },
    "52307": {
      "school_short": "Ferrum",
      "world": "stagg",
      "division": "D-III"
    },
    "52091": {
      "school_short": "Bucknell",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52292": {
      "school_short": "Wooster",
      "world": "stagg",
      "division": "D-III"
    },
    "52183": {
      "school_short": "Colorado School of Mines",
      "world": "stagg",
      "division": "D-II"
    },
    "52456": {
      "school_short": "Bethune-Cookman",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52298": {
      "school_short": "Earlham",
      "world": "stagg",
      "division": "D-III"
    },
    "52064": {
      "school_short": "Fresno State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52498": {
      "school_short": "Fort Lewis",
      "world": "stagg",
      "division": "D-II"
    },
    "52146": {
      "school_short": "Emporia State",
      "world": "stagg",
      "division": "D-II"
    },
    "52581": {
      "school_short": "Mount St. Joseph",
      "world": "stagg",
      "division": "D-III"
    },
    "51912": {
      "school_short": "Western State (CO)",
      "world": "leahy",
      "division": "D-II"
    },
    "52617": {
      "school_short": "Hanover",
      "world": "stagg",
      "division": "D-III"
    },
    "52122": {
      "school_short": "Harding",
      "world": "stagg",
      "division": "D-II"
    },
    "52203": {
      "school_short": "Hartwick",
      "world": "stagg",
      "division": "D-III"
    },
    "52250": {
      "school_short": "Cornell",
      "world": "stagg",
      "division": "D-III"
    },
    "52171": {
      "school_short": "East Stroudsburg",
      "world": "stagg",
      "division": "D-II"
    },
    "52483": {
      "school_short": "Florida Atlantic",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52418": {
      "school_short": "Eastern Michigan",
      "world": "stagg",
      "division": "D-IA"
    },
    "52339": {
      "school_short": "East Texas Baptist",
      "world": "stagg",
      "division": "D-III"
    },
    "52238": {
      "school_short": "Concordia (IL)",
      "world": "stagg",
      "division": "D-III"
    },
    "52427": {
      "school_short": "Eastern Illinois",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52363": {
      "school_short": "Delaware Valley",
      "world": "stagg",
      "division": "D-III"
    },
    "52458": {
      "school_short": "Howard",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52360": {
      "school_short": "Husson",
      "world": "stagg",
      "division": "D-III"
    },
    "52490": {
      "school_short": "Idaho State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52240": {
      "school_short": "Illinois Wesleyan",
      "world": "stagg",
      "division": "D-III"
    },
    "52072": {
      "school_short": "Indiana State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52179": {
      "school_short": "Indiana (PA)",
      "world": "stagg",
      "division": "D-II"
    },
    "52398": {
      "school_short": "Indiana",
      "world": "stagg",
      "division": "D-IA"
    },
    "52430": {
      "school_short": "Iona",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52204": {
      "school_short": "Ithaca",
      "world": "stagg",
      "division": "D-III"
    },
    "52111": {
      "school_short": "Jackson State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52551": {
      "school_short": "Johnson C. Smith",
      "world": "stagg",
      "division": "D-II"
    },
    "52279": {
      "school_short": "Kean",
      "world": "stagg",
      "division": "D-III"
    },
    "52353": {
      "school_short": "Hope",
      "world": "stagg",
      "division": "D-III"
    },
    "52341": {
      "school_short": "Howard Payne",
      "world": "stagg",
      "division": "D-III"
    },
    "52071": {
      "school_short": "Illinois State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52447": {
      "school_short": "Jacksonville",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52354": {
      "school_short": "Kalamazoo",
      "world": "stagg",
      "division": "D-III"
    },
    "52277": {
      "school_short": "Framingham State",
      "world": "stagg",
      "division": "D-III"
    },
    "52616": {
      "school_short": "Franklin",
      "world": "stagg",
      "division": "D-III"
    },
    "52511": {
      "school_short": "Glenville",
      "world": "stagg",
      "division": "D-II"
    },
    "52114": {
      "school_short": "Grambling State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52235": {
      "school_short": "Lakeland",
      "world": "stagg",
      "division": "D-III"
    },
    "52334": {
      "school_short": "Lane",
      "world": "stagg",
      "division": "D-II"
    },
    "52370": {
      "school_short": "Lebanon Valley",
      "world": "stagg",
      "division": "D-III"
    },
    "52041": {
      "school_short": "LSU",
      "world": "stagg",
      "division": "D-IA"
    },
    "52246": {
      "school_short": "Luther",
      "world": "stagg",
      "division": "D-III"
    },
    "52365": {
      "school_short": "Lycoming",
      "world": "stagg",
      "division": "D-III"
    },
    "52357": {
      "school_short": "Macalester",
      "world": "stagg",
      "division": "D-III"
    },
    "52431": {
      "school_short": "Marist",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52359": {
      "school_short": "Martin Luther",
      "world": "stagg",
      "division": "D-III"
    },
    "52105": {
      "school_short": "McNeese State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52558": {
      "school_short": "Mercyhurst",
      "world": "stagg",
      "division": "D-II"
    },
    "52528": {
      "school_short": "Merrimack",
      "world": "stagg",
      "division": "D-II"
    },
    "52117": {
      "school_short": "Michigan Tech",
      "world": "stagg",
      "division": "D-II"
    },
    "52047": {
      "school_short": "Middle Tennessee State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52269": {
      "school_short": "Middlebury",
      "world": "stagg",
      "division": "D-III"
    },
    "52331": {
      "school_short": "Miles",
      "world": "stagg",
      "division": "D-II"
    },
    "52174": {
      "school_short": "Millersville",
      "world": "stagg",
      "division": "D-II"
    },
    "52325": {
      "school_short": "Millikin",
      "world": "stagg",
      "division": "D-III"
    },
    "52527": {
      "school_short": "Long Island",
      "world": "stagg",
      "division": "D-II"
    },
    "52342": {
      "school_short": "Louisiana",
      "world": "stagg",
      "division": "D-III"
    },
    "52308": {
      "school_short": "Greensboro",
      "world": "stagg",
      "division": "D-III"
    },
    "52185": {
      "school_short": "Gettysburg",
      "world": "stagg",
      "division": "D-III"
    },
    "52618": {
      "school_short": "Manchester",
      "world": "stagg",
      "division": "D-III"
    },
    "52573": {
      "school_short": "John Carroll",
      "world": "stagg",
      "division": "D-III"
    },
    "52413": {
      "school_short": "Miami (OH)",
      "world": "stagg",
      "division": "D-IA"
    },
    "52593": {
      "school_short": "Lawrence",
      "world": "stagg",
      "division": "D-III"
    },
    "52340": {
      "school_short": "Hardin-Simmons",
      "world": "stagg",
      "division": "D-III"
    },
    "52211": {
      "school_short": "Georgia Tech",
      "world": "stagg",
      "division": "D-IA"
    },
    "52116": {
      "school_short": "Hillsdale",
      "world": "stagg",
      "division": "D-II"
    },
    "52386": {
      "school_short": "DePaul",
      "world": "stagg",
      "division": "D-IA"
    },
    "52376": {
      "school_short": "Lake Forest",
      "world": "stagg",
      "division": "D-III"
    },
    "52369": {
      "school_short": "Juniata",
      "world": "stagg",
      "division": "D-III"
    },
    "52450": {
      "school_short": "Florida A&M",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52565": {
      "school_short": "Eastern Oregon",
      "world": "stagg",
      "division": "D-III"
    },
    "52313": {
      "school_short": "Maryville",
      "world": "stagg",
      "division": "D-III"
    },
    "52264": {
      "school_short": "Massachusetts Maritime",
      "world": "stagg",
      "division": "D-III"
    },
    "52499": {
      "school_short": "Mesa State",
      "world": "stagg",
      "division": "D-II"
    },
    "52155": {
      "school_short": "Lock Haven",
      "world": "stagg",
      "division": "D-II"
    },
    "52621": {
      "school_short": "Millsaps",
      "world": "stagg",
      "division": "D-III"
    },
    "52415": {
      "school_short": "Kent State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52086": {
      "school_short": "Harvard",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52478": {
      "school_short": "Hofstra",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52358": {
      "school_short": "Colorado",
      "world": "stagg",
      "division": "D-III"
    },
    "52390": {
      "school_short": "Michigan State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52566": {
      "school_short": "Frostburg State",
      "world": "stagg",
      "division": "D-III"
    },
    "52245": {
      "school_short": "Loras",
      "world": "stagg",
      "division": "D-III"
    },
    "52537": {
      "school_short": "Minnesota State-Moorhead",
      "world": "stagg",
      "division": "D-II"
    },
    "52172": {
      "school_short": "Kutztown",
      "world": "stagg",
      "division": "D-II"
    },
    "52454": {
      "school_short": "La Salle",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52304": {
      "school_short": "Linfield",
      "world": "stagg",
      "division": "D-III"
    },
    "52173": {
      "school_short": "Mansfield",
      "world": "stagg",
      "division": "D-II"
    },
    "52309": {
      "school_short": "Methodist",
      "world": "stagg",
      "division": "D-III"
    },
    "52494": {
      "school_short": "Midwestern State",
      "world": "stagg",
      "division": "D-II"
    },
    "52336": {
      "school_short": "Kentucky Wesleyan",
      "world": "stagg",
      "division": "D-II"
    },
    "52293": {
      "school_short": "Kenyon",
      "world": "stagg",
      "division": "D-III"
    },
    "52424": {
      "school_short": "Lafayette",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52425": {
      "school_short": "Lehigh",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52587": {
      "school_short": "Monmouth (IL)",
      "world": "stagg",
      "division": "D-III"
    },
    "52280": {
      "school_short": "Montclair State",
      "world": "stagg",
      "division": "D-III"
    },
    "52459": {
      "school_short": "Morgan State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52288": {
      "school_short": "Mount Ida",
      "world": "stagg",
      "division": "D-III"
    },
    "52435": {
      "school_short": "Murray State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52395": {
      "school_short": "Ohio State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52052": {
      "school_short": "New Mexico State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52510": {
      "school_short": "Newberry",
      "world": "stagg",
      "division": "D-II"
    },
    "52106": {
      "school_short": "Nicholls State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52451": {
      "school_short": "Norfolk State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52460": {
      "school_short": "NC A&T",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52216": {
      "school_short": "North Carolina State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52134": {
      "school_short": "Northeastern State",
      "world": "stagg",
      "division": "D-II"
    },
    "52148": {
      "school_short": "Northwest Missouri State",
      "world": "stagg",
      "division": "D-II"
    },
    "52107": {
      "school_short": "Northwestern State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52118": {
      "school_short": "Northwood",
      "world": "stagg",
      "division": "D-II"
    },
    "52416": {
      "school_short": "Ohio",
      "world": "stagg",
      "division": "D-IA"
    },
    "52579": {
      "school_short": "Otterbein",
      "world": "stagg",
      "division": "D-III"
    },
    "52305": {
      "school_short": "Pacific Lutheran",
      "world": "stagg",
      "division": "D-III"
    },
    "52396": {
      "school_short": "Penn State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52149": {
      "school_short": "Pittsburg State",
      "world": "stagg",
      "division": "D-II"
    },
    "52188": {
      "school_short": "Muhlenberg",
      "world": "stagg",
      "division": "D-III"
    },
    "52479": {
      "school_short": "Northeastern",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52421": {
      "school_short": "Northern Illinois",
      "world": "stagg",
      "division": "D-IA"
    },
    "52186": {
      "school_short": "Johns Hopkins",
      "world": "stagg",
      "division": "D-III"
    },
    "52165": {
      "school_short": "Northern State",
      "world": "stagg",
      "division": "D-II"
    },
    "52391": {
      "school_short": "Northwestern",
      "world": "stagg",
      "division": "D-IA"
    },
    "52042": {
      "school_short": "Mississippi State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52151": {
      "school_short": "Missouri Southern State",
      "world": "stagg",
      "division": "D-II"
    },
    "52495": {
      "school_short": "Oklahoma Panhandle",
      "world": "stagg",
      "division": "D-II"
    },
    "52531": {
      "school_short": "Pace",
      "world": "stagg",
      "division": "D-II"
    },
    "52147": {
      "school_short": "Missouri Western State",
      "world": "stagg",
      "division": "D-II"
    },
    "52326": {
      "school_short": "North Central",
      "world": "stagg",
      "division": "D-III"
    },
    "52314": {
      "school_short": "Nebraska Wesleyan",
      "world": "stagg",
      "division": "D-III"
    },
    "52462": {
      "school_short": "Monmouth",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52196": {
      "school_short": "Plymouth State",
      "world": "stagg",
      "division": "D-III"
    },
    "52187": {
      "school_short": "McDaniel",
      "world": "stagg",
      "division": "D-III"
    },
    "52610": {
      "school_short": "Nichols",
      "world": "stagg",
      "division": "D-III"
    },
    "52521": {
      "school_short": "Humboldt State",
      "world": "stagg",
      "division": "D-II"
    },
    "52371": {
      "school_short": "Moravian",
      "world": "stagg",
      "division": "D-III"
    },
    "52312": {
      "school_short": "Maranatha Baptist",
      "world": "stagg",
      "division": "D-III"
    },
    "52626": {
      "school_short": "Occidental",
      "world": "stagg",
      "division": "D-III"
    },
    "52158": {
      "school_short": "Minnesota State-Mankato",
      "world": "stagg",
      "division": "D-II"
    },
    "52473": {
      "school_short": "James Madison",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52578": {
      "school_short": "Marietta",
      "world": "stagg",
      "division": "D-III"
    },
    "52575": {
      "school_short": "Muskingum",
      "world": "stagg",
      "division": "D-III"
    },
    "52303": {
      "school_short": "Lewis and Clark",
      "world": "stagg",
      "division": "D-III"
    },
    "52299": {
      "school_short": "Hiram",
      "world": "stagg",
      "division": "D-III"
    },
    "52505": {
      "school_short": "Mars Hill",
      "world": "stagg",
      "division": "D-II"
    },
    "52356": {
      "school_short": "Olivet",
      "world": "stagg",
      "division": "D-III"
    },
    "52492": {
      "school_short": "Montana State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52300": {
      "school_short": "Ohio Wesleyan",
      "world": "stagg",
      "division": "D-III"
    },
    "52229": {
      "school_short": "Oklahoma State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52405": {
      "school_short": "Marshall",
      "world": "stagg",
      "division": "D-IA"
    },
    "52128": {
      "school_short": "Henderson State",
      "world": "stagg",
      "division": "D-II"
    },
    "52022": {
      "school_short": "Oregon State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52058": {
      "school_short": "Louisiana Tech",
      "world": "stagg",
      "division": "D-IA"
    },
    "52577": {
      "school_short": "Heidelberg",
      "world": "stagg",
      "division": "D-III"
    },
    "52543": {
      "school_short": "Liberty",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52226": {
      "school_short": "Iowa State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52236": {
      "school_short": "MacMurray",
      "world": "stagg",
      "division": "D-III"
    },
    "52509": {
      "school_short": "Lenoir-Rhyne",
      "world": "stagg",
      "division": "D-II"
    },
    "52364": {
      "school_short": "King`s",
      "world": "stagg",
      "division": "D-III"
    },
    "52627": {
      "school_short": "Pomona-Pitzers",
      "world": "stagg",
      "division": "D-III"
    },
    "52576": {
      "school_short": "Ohio Northern",
      "world": "stagg",
      "division": "D-III"
    },
    "52195": {
      "school_short": "Norwich",
      "world": "stagg",
      "division": "D-III"
    },
    "52327": {
      "school_short": "North Park",
      "world": "stagg",
      "division": "D-III"
    },
    "52093": {
      "school_short": "Morehead State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52335": {
      "school_short": "Morehouse",
      "world": "stagg",
      "division": "D-II"
    },
    "52123": {
      "school_short": "Ouachita Baptist",
      "world": "stagg",
      "division": "D-II"
    },
    "52588": {
      "school_short": "Ripon",
      "world": "stagg",
      "division": "D-III"
    },
    "52463": {
      "school_short": "Robert Morris",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52289": {
      "school_short": "Rockford",
      "world": "stagg",
      "division": "D-III"
    },
    "52281": {
      "school_short": "Rowan",
      "world": "stagg",
      "division": "D-III"
    },
    "52469": {
      "school_short": "Saint Francis",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52065": {
      "school_short": "San Diego State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52080": {
      "school_short": "Savannah State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52546": {
      "school_short": "Shaw",
      "world": "stagg",
      "division": "D-II"
    },
    "52081": {
      "school_short": "Southeastern Louisiana",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52135": {
      "school_short": "SE Oklahoma-Durant",
      "world": "stagg",
      "division": "D-II"
    },
    "52129": {
      "school_short": "Southern Arkansas",
      "world": "stagg",
      "division": "D-II"
    },
    "52529": {
      "school_short": "Southern Connecticut",
      "world": "stagg",
      "division": "D-II"
    },
    "52073": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52540": {
      "school_short": "Southern-Baton Rouge",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52082": {
      "school_short": "Southern Utah",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52201": {
      "school_short": "Springfield",
      "world": "stagg",
      "division": "D-III"
    },
    "52554": {
      "school_short": "St. Augustine`s",
      "world": "stagg",
      "division": "D-II"
    },
    "52161": {
      "school_short": "St. Cloud State",
      "world": "stagg",
      "division": "D-II"
    },
    "52205": {
      "school_short": "St. John Fisher",
      "world": "stagg",
      "division": "D-III"
    },
    "52600": {
      "school_short": "St. John`s",
      "world": "stagg",
      "division": "D-III"
    },
    "52589": {
      "school_short": "St. Norbert",
      "world": "stagg",
      "division": "D-III"
    },
    "52604": {
      "school_short": "St. Olaf",
      "world": "stagg",
      "division": "D-III"
    },
    "52432": {
      "school_short": "St. Peter`s",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52623": {
      "school_short": "Rose-Hulman",
      "world": "stagg",
      "division": "D-III"
    },
    "52181": {
      "school_short": "Slippery Rock",
      "world": "stagg",
      "division": "D-II"
    },
    "52464": {
      "school_short": "Sacred Heart",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52115": {
      "school_short": "Prairie View",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52506": {
      "school_short": "Presbyterian",
      "world": "stagg",
      "division": "D-II"
    },
    "52568": {
      "school_short": "Principia",
      "world": "stagg",
      "division": "D-III"
    },
    "52397": {
      "school_short": "Purdue",
      "world": "stagg",
      "division": "D-IA"
    },
    "52612": {
      "school_short": "Randolph-Macon",
      "world": "stagg",
      "division": "D-III"
    },
    "52622": {
      "school_short": "Rhodes",
      "world": "stagg",
      "division": "D-III"
    },
    "52560": {
      "school_short": "Saginaw Valley State",
      "world": "stagg",
      "division": "D-II"
    },
    "52053": {
      "school_short": "Idaho",
      "world": "stagg",
      "division": "D-IA"
    },
    "52069": {
      "school_short": "Stephen F. Austin",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52569": {
      "school_short": "Stillman",
      "world": "stagg",
      "division": "D-III"
    },
    "52465": {
      "school_short": "Stony Brook",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52428": {
      "school_short": "Tennessee Tech",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52066": {
      "school_short": "San Jose State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52031": {
      "school_short": "UCLA",
      "world": "stagg",
      "division": "D-IA"
    },
    "52159": {
      "school_short": "North Dakota State",
      "world": "stagg",
      "division": "D-II"
    },
    "52247": {
      "school_short": "Simpson",
      "world": "stagg",
      "division": "D-III"
    },
    "52493": {
      "school_short": "Sam Houston State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52231": {
      "school_short": "Texas A&M",
      "world": "stagg",
      "division": "D-IA"
    },
    "52489": {
      "school_short": "St. Mary`s",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52410": {
      "school_short": "Southern Methodist",
      "world": "stagg",
      "division": "D-IA"
    },
    "52160": {
      "school_short": "South Dakota State",
      "world": "stagg",
      "division": "D-II"
    },
    "52310": {
      "school_short": "Shenandoah",
      "world": "stagg",
      "division": "D-III"
    },
    "52377": {
      "school_short": "Rutgers",
      "world": "stagg",
      "division": "D-IA"
    },
    "52552": {
      "school_short": "Livingstone",
      "world": "stagg",
      "division": "D-II"
    },
    "52112": {
      "school_short": "Mississippi Valley State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52512": {
      "school_short": "Shepherd",
      "world": "stagg",
      "division": "D-II"
    },
    "52461": {
      "school_short": "SC State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52032": {
      "school_short": "Stanford",
      "world": "stagg",
      "division": "D-IA"
    },
    "52542": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52152": {
      "school_short": "Southwest Baptist",
      "world": "stagg",
      "division": "D-II"
    },
    "52437": {
      "school_short": "Southeast Missouri State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52192": {
      "school_short": "St. Lawrence",
      "world": "stagg",
      "division": "D-III"
    },
    "52366": {
      "school_short": "Susquehanna",
      "world": "stagg",
      "division": "D-III"
    },
    "52538": {
      "school_short": "Southwest Minnesota State",
      "world": "stagg",
      "division": "D-II"
    },
    "52180": {
      "school_short": "Shippensburg",
      "world": "stagg",
      "division": "D-II"
    },
    "52592": {
      "school_short": "Knox",
      "world": "stagg",
      "division": "D-III"
    },
    "52373": {
      "school_short": "Salisbury",
      "world": "stagg",
      "division": "D-III"
    },
    "52402": {
      "school_short": "Rice",
      "world": "stagg",
      "division": "D-IA"
    },
    "52455": {
      "school_short": "Siena",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52594": {
      "school_short": "Chicago",
      "world": "stagg",
      "division": "D-III"
    },
    "52252": {
      "school_short": "Thiel",
      "world": "stagg",
      "division": "D-III"
    },
    "52426": {
      "school_short": "Towson",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52057": {
      "school_short": "Troy State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52150": {
      "school_short": "Truman State",
      "world": "stagg",
      "division": "D-II"
    },
    "52271": {
      "school_short": "Tufts",
      "world": "stagg",
      "division": "D-III"
    },
    "52408": {
      "school_short": "Tulane",
      "world": "stagg",
      "division": "D-IA"
    },
    "52332": {
      "school_short": "Tuskegee",
      "world": "stagg",
      "division": "D-II"
    },
    "52198": {
      "school_short": "Merchant Marine",
      "world": "stagg",
      "division": "D-III"
    },
    "52466": {
      "school_short": "Albany",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52414": {
      "school_short": "Akron",
      "world": "stagg",
      "division": "D-IA"
    },
    "52409": {
      "school_short": "Alabama Birmingham",
      "world": "stagg",
      "division": "D-IA"
    },
    "52130": {
      "school_short": "Arkansas-Monticello",
      "world": "stagg",
      "division": "D-II"
    },
    "52125": {
      "school_short": "Central Arkansas",
      "world": "stagg",
      "division": "D-II"
    },
    "52474": {
      "school_short": "Delaware",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52251": {
      "school_short": "Dubuque",
      "world": "stagg",
      "division": "D-III"
    },
    "52119": {
      "school_short": "Findlay",
      "world": "stagg",
      "division": "D-II"
    },
    "52036": {
      "school_short": "Florida",
      "world": "stagg",
      "division": "D-IA"
    },
    "52034": {
      "school_short": "Georgia",
      "world": "stagg",
      "division": "D-IA"
    },
    "52068": {
      "school_short": "Hawaii",
      "world": "stagg",
      "division": "D-IA"
    },
    "52282": {
      "school_short": "Cortland",
      "world": "stagg",
      "division": "D-III"
    },
    "52438": {
      "school_short": "Tennessee State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52270": {
      "school_short": "Trinity",
      "world": "stagg",
      "division": "D-III"
    },
    "52087": {
      "school_short": "Pennsylvania",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52482": {
      "school_short": "Richmond",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52038": {
      "school_short": "South Carolina",
      "world": "stagg",
      "division": "D-IA"
    },
    "52224": {
      "school_short": "Kansas",
      "world": "stagg",
      "division": "D-IA"
    },
    "52048": {
      "school_short": "Louisiana Lafayette",
      "world": "stagg",
      "division": "D-IA"
    },
    "52049": {
      "school_short": "Louisiana Monroe",
      "world": "stagg",
      "division": "D-IA"
    },
    "52480": {
      "school_short": "Maine",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52404": {
      "school_short": "Memphis",
      "world": "stagg",
      "division": "D-IA"
    },
    "52163": {
      "school_short": "Minnesota-Duluth",
      "world": "stagg",
      "division": "D-II"
    },
    "52056": {
      "school_short": "Montana",
      "world": "stagg",
      "division": "D-IA"
    },
    "52517": {
      "school_short": "Nebraska-Omaha",
      "world": "stagg",
      "division": "D-II"
    },
    "52067": {
      "school_short": "UNLV",
      "world": "stagg",
      "division": "D-IA"
    },
    "52475": {
      "school_short": "Massachusetts",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52481": {
      "school_short": "New Hampshire",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52167": {
      "school_short": "Charleston",
      "world": "stagg",
      "division": "D-II"
    },
    "52217": {
      "school_short": "Maryland",
      "world": "stagg",
      "division": "D-IA"
    },
    "52501": {
      "school_short": "Nebraska-Kearney",
      "world": "stagg",
      "division": "D-II"
    },
    "52258": {
      "school_short": "Salve Regina",
      "world": "stagg",
      "division": "D-III"
    },
    "52507": {
      "school_short": "Tusculum",
      "world": "stagg",
      "division": "D-II"
    },
    "52070": {
      "school_short": "Texas State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52384": {
      "school_short": "Cincinnati",
      "world": "stagg",
      "division": "D-IA"
    },
    "52628": {
      "school_short": "La Verne",
      "world": "stagg",
      "division": "D-III"
    },
    "52218": {
      "school_short": "Miami (FL)",
      "world": "stagg",
      "division": "D-IA"
    },
    "52259": {
      "school_short": "UMass-Dartmouth",
      "world": "stagg",
      "division": "D-III"
    },
    "52029": {
      "school_short": "Arizona",
      "world": "stagg",
      "division": "D-IA"
    },
    "52411": {
      "school_short": "Houston",
      "world": "stagg",
      "division": "D-IA"
    },
    "52436": {
      "school_short": "Samford",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52348": {
      "school_short": "Texas Lutheran",
      "world": "stagg",
      "division": "D-III"
    },
    "52142": {
      "school_short": "Texas A&M-Commerce",
      "world": "stagg",
      "division": "D-II"
    },
    "52380": {
      "school_short": "Connecticut",
      "world": "stagg",
      "division": "D-IA"
    },
    "52407": {
      "school_short": "Texas Christian",
      "world": "stagg",
      "division": "D-IA"
    },
    "52193": {
      "school_short": "Union (NY)",
      "world": "stagg",
      "division": "D-III"
    },
    "52378": {
      "school_short": "Syracuse",
      "world": "stagg",
      "division": "D-IA"
    },
    "52044": {
      "school_short": "Arkansas",
      "world": "stagg",
      "division": "D-IA"
    },
    "52347": {
      "school_short": "Sul Ross State",
      "world": "stagg",
      "division": "D-III"
    },
    "52197": {
      "school_short": "Coast Guard",
      "world": "stagg",
      "division": "D-III"
    },
    "52399": {
      "school_short": "Iowa",
      "world": "stagg",
      "division": "D-IA"
    },
    "52429": {
      "school_short": "Tennessee-Martin",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52344": {
      "school_short": "Mary Hardin-Baylor",
      "world": "stagg",
      "division": "D-III"
    },
    "52441": {
      "school_short": "Dayton",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52153": {
      "school_short": "Missouri-Rolla",
      "world": "stagg",
      "division": "D-II"
    },
    "52337": {
      "school_short": "Saint Joseph`s",
      "world": "stagg",
      "division": "D-II"
    },
    "52137": {
      "school_short": "Tarleton State",
      "world": "stagg",
      "division": "D-II"
    },
    "52026": {
      "school_short": "California",
      "world": "stagg",
      "division": "D-IA"
    },
    "52222": {
      "school_short": "Nebraska",
      "world": "stagg",
      "division": "D-IA"
    },
    "52138": {
      "school_short": "Central Oklahoma",
      "world": "stagg",
      "division": "D-II"
    },
    "52541": {
      "school_short": "Texas Southern",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52417": {
      "school_short": "Buffalo",
      "world": "stagg",
      "division": "D-IA"
    },
    "52230": {
      "school_short": "Texas Tech",
      "world": "stagg",
      "division": "D-IA"
    },
    "52400": {
      "school_short": "Notre Dame",
      "world": "stagg",
      "division": "D-IA"
    },
    "52381": {
      "school_short": "Pittsburgh",
      "world": "stagg",
      "division": "D-IA"
    },
    "52476": {
      "school_short": "Rhode Island",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52194": {
      "school_short": "Rochester",
      "world": "stagg",
      "division": "D-III"
    },
    "52519": {
      "school_short": "South Dakota",
      "world": "stagg",
      "division": "D-II"
    },
    "52385": {
      "school_short": "South Florida",
      "world": "stagg",
      "division": "D-IA"
    },
    "52412": {
      "school_short": "Southern Mississippi",
      "world": "stagg",
      "division": "D-IA"
    },
    "52104": {
      "school_short": "Tennessee-Chattanooga",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52228": {
      "school_short": "Texas",
      "world": "stagg",
      "division": "D-IA"
    },
    "52060": {
      "school_short": "UTEP",
      "world": "stagg",
      "division": "D-IA"
    },
    "52420": {
      "school_short": "Toledo",
      "world": "stagg",
      "division": "D-IA"
    },
    "52062": {
      "school_short": "Utah",
      "world": "stagg",
      "division": "D-IA"
    },
    "52471": {
      "school_short": "Nevada",
      "world": "stagg",
      "division": "D-IA"
    },
    "52403": {
      "school_short": "Tulsa",
      "world": "stagg",
      "division": "D-IA"
    },
    "52389": {
      "school_short": "Illinois",
      "world": "stagg",
      "division": "D-IA"
    },
    "52126": {
      "school_short": "West Alabama",
      "world": "stagg",
      "division": "D-II"
    },
    "52320": {
      "school_short": "Wisconsin-River Falls",
      "world": "stagg",
      "division": "D-III"
    },
    "52321": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "stagg",
      "division": "D-III"
    },
    "52324": {
      "school_short": "Wisconsin-Stout",
      "world": "stagg",
      "division": "D-III"
    },
    "52317": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "stagg",
      "division": "D-III"
    },
    "52206": {
      "school_short": "Utica",
      "world": "stagg",
      "division": "D-III"
    },
    "52219": {
      "school_short": "Virginia Tech",
      "world": "stagg",
      "division": "D-IA"
    },
    "52295": {
      "school_short": "Wabash",
      "world": "stagg",
      "division": "D-III"
    },
    "52248": {
      "school_short": "Wartburg",
      "world": "stagg",
      "division": "D-III"
    },
    "52154": {
      "school_short": "Washburn-Topeka",
      "world": "stagg",
      "division": "D-II"
    },
    "52253": {
      "school_short": "Washington and Jefferson",
      "world": "stagg",
      "division": "D-III"
    },
    "52175": {
      "school_short": "West Chester",
      "world": "stagg",
      "division": "D-II"
    },
    "52144": {
      "school_short": "West Texas A&M",
      "world": "stagg",
      "division": "D-II"
    },
    "52514": {
      "school_short": "West Virginia Wesleyan",
      "world": "stagg",
      "division": "D-II"
    },
    "52422": {
      "school_short": "Western Michigan",
      "world": "stagg",
      "division": "D-IA"
    },
    "52522": {
      "school_short": "Western Oregon",
      "world": "stagg",
      "division": "D-II"
    },
    "52166": {
      "school_short": "Wayne State",
      "world": "stagg",
      "division": "D-II"
    },
    "52442": {
      "school_short": "San Diego",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52601": {
      "school_short": "St. Thomas",
      "world": "stagg",
      "division": "D-III"
    },
    "52625": {
      "school_short": "South-Sewanee",
      "world": "stagg",
      "division": "D-III"
    },
    "52131": {
      "school_short": "North Alabama",
      "world": "stagg",
      "division": "D-II"
    },
    "52518": {
      "school_short": "North Dakota",
      "world": "stagg",
      "division": "D-II"
    },
    "52169": {
      "school_short": "West Virginia State",
      "world": "stagg",
      "division": "D-II"
    },
    "52061": {
      "school_short": "New Mexico",
      "world": "stagg",
      "division": "D-IA"
    },
    "52382": {
      "school_short": "West Virginia",
      "world": "stagg",
      "division": "D-IA"
    },
    "52306": {
      "school_short": "Puget Sound",
      "world": "stagg",
      "division": "D-III"
    },
    "52319": {
      "school_short": "Wisconsin-Platteville",
      "world": "stagg",
      "division": "D-III"
    },
    "52260": {
      "school_short": "Western New England",
      "world": "stagg",
      "division": "D-III"
    },
    "52613": {
      "school_short": "Washington and Lee",
      "world": "stagg",
      "division": "D-III"
    },
    "52045": {
      "school_short": "Ole Miss",
      "world": "stagg",
      "division": "D-IA"
    },
    "52033": {
      "school_short": "Air Force",
      "world": "stagg",
      "division": "D-IA"
    },
    "52392": {
      "school_short": "Michigan",
      "world": "stagg",
      "division": "D-IA"
    },
    "52075": {
      "school_short": "Western Kentucky",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52063": {
      "school_short": "Wyoming",
      "world": "stagg",
      "division": "D-IA"
    },
    "52595": {
      "school_short": "Washington (MO)",
      "world": "stagg",
      "division": "D-III"
    },
    "52393": {
      "school_short": "Minnesota",
      "world": "stagg",
      "division": "D-IA"
    },
    "52383": {
      "school_short": "Louisville",
      "world": "stagg",
      "division": "D-IA"
    },
    "52050": {
      "school_short": "Navy",
      "world": "stagg",
      "division": "D-IA"
    },
    "52132": {
      "school_short": "Valdosta State",
      "world": "stagg",
      "division": "D-II"
    },
    "52189": {
      "school_short": "Ursinus",
      "world": "stagg",
      "division": "D-III"
    },
    "52039": {
      "school_short": "Kentucky",
      "world": "stagg",
      "division": "D-IA"
    },
    "52051": {
      "school_short": "Army",
      "world": "stagg",
      "division": "D-IA"
    },
    "52054": {
      "school_short": "North Texas",
      "world": "stagg",
      "division": "D-IA"
    },
    "52629": {
      "school_short": "Redlands",
      "world": "stagg",
      "division": "D-III"
    },
    "52030": {
      "school_short": "Southern California",
      "world": "stagg",
      "division": "D-IA"
    },
    "52023": {
      "school_short": "Oregon",
      "world": "stagg",
      "division": "D-IA"
    },
    "52488": {
      "school_short": "Weber State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52290": {
      "school_short": "Wesley",
      "world": "stagg",
      "division": "D-III"
    },
    "52100": {
      "school_short": "Western Carolina",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52124": {
      "school_short": "West Georgia",
      "world": "stagg",
      "division": "D-II"
    },
    "52213": {
      "school_short": "Virginia",
      "world": "stagg",
      "division": "D-IA"
    },
    "52223": {
      "school_short": "Missouri",
      "world": "stagg",
      "division": "D-IA"
    },
    "52025": {
      "school_short": "Washington State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52315": {
      "school_short": "Thomas More",
      "world": "stagg",
      "division": "D-III"
    },
    "52120": {
      "school_short": "Wayne State",
      "world": "stagg",
      "division": "D-II"
    },
    "52276": {
      "school_short": "Wesleyan",
      "world": "stagg",
      "division": "D-III"
    },
    "52168": {
      "school_short": "West Liberty State",
      "world": "stagg",
      "division": "D-II"
    },
    "52513": {
      "school_short": "West Virginia Tech",
      "world": "stagg",
      "division": "D-II"
    },
    "52055": {
      "school_short": "Utah State",
      "world": "stagg",
      "division": "D-IA"
    },
    "52548": {
      "school_short": "Virginia Union",
      "world": "stagg",
      "division": "D-II"
    },
    "52214": {
      "school_short": "Wake Forest",
      "world": "stagg",
      "division": "D-IA"
    },
    "52199": {
      "school_short": "Western Connecticut State",
      "world": "stagg",
      "division": "D-III"
    },
    "52074": {
      "school_short": "Western Illinois",
      "world": "stagg",
      "division": "D-IAA"
    },
    "53059": {
      "school_short": "Benedictine",
      "world": "warner",
      "division": "D-III"
    },
    "52523": {
      "school_short": "Western Washington",
      "world": "stagg",
      "division": "D-II"
    },
    "52607": {
      "school_short": "Westminster (PA)",
      "world": "stagg",
      "division": "D-III"
    },
    "52367": {
      "school_short": "Wilkes",
      "world": "stagg",
      "division": "D-III"
    },
    "52284": {
      "school_short": "William Paterson",
      "world": "stagg",
      "division": "D-III"
    },
    "52272": {
      "school_short": "Williams",
      "world": "stagg",
      "division": "D-III"
    },
    "52508": {
      "school_short": "Wingate",
      "world": "stagg",
      "division": "D-II"
    },
    "52296": {
      "school_short": "Wittenberg",
      "world": "stagg",
      "division": "D-III"
    },
    "52200": {
      "school_short": "Worcester Tech",
      "world": "stagg",
      "division": "D-III"
    },
    "52088": {
      "school_short": "Yale",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52688": {
      "school_short": "Alabama A&M",
      "world": "warner",
      "division": "D-IAA"
    },
    "53078": {
      "school_short": "Albion",
      "world": "warner",
      "division": "D-III"
    },
    "53161": {
      "school_short": "Allegheny",
      "world": "warner",
      "division": "D-III"
    },
    "52731": {
      "school_short": "American International",
      "world": "warner",
      "division": "D-II"
    },
    "53001": {
      "school_short": "Angelo State",
      "world": "warner",
      "division": "D-II"
    },
    "52642": {
      "school_short": "Arkansas State",
      "world": "warner",
      "division": "D-IA"
    },
    "53113": {
      "school_short": "Augsburg",
      "world": "warner",
      "division": "D-III"
    },
    "53063": {
      "school_short": "Augustana (IL)",
      "world": "warner",
      "division": "D-III"
    },
    "52873": {
      "school_short": "Ball State",
      "world": "warner",
      "division": "D-IA"
    },
    "53101": {
      "school_short": "Beloit",
      "world": "warner",
      "division": "D-III"
    },
    "52732": {
      "school_short": "Bentley",
      "world": "warner",
      "division": "D-II"
    },
    "52555": {
      "school_short": "Winston-Salem State",
      "world": "stagg",
      "division": "D-II"
    },
    "53077": {
      "school_short": "Adrian",
      "world": "warner",
      "division": "D-III"
    },
    "52712": {
      "school_short": "Ashland",
      "world": "warner",
      "division": "D-II"
    },
    "52719": {
      "school_short": "Augustana",
      "world": "warner",
      "division": "D-II"
    },
    "52792": {
      "school_short": "Benedict",
      "world": "warner",
      "division": "D-II"
    },
    "52630": {
      "school_short": "Whittier",
      "world": "stagg",
      "division": "D-III"
    },
    "52355": {
      "school_short": "Wisconsin Lutheran",
      "world": "stagg",
      "division": "D-III"
    },
    "52689": {
      "school_short": "Alabama State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52316": {
      "school_short": "Westminster (MO)",
      "world": "stagg",
      "division": "D-III"
    },
    "53089": {
      "school_short": "Albright",
      "world": "warner",
      "division": "D-III"
    },
    "52037": {
      "school_short": "Vanderbilt",
      "world": "stagg",
      "division": "D-IA"
    },
    "53053": {
      "school_short": "Aurora",
      "world": "warner",
      "division": "D-III"
    },
    "53221": {
      "school_short": "Averett",
      "world": "warner",
      "division": "D-III"
    },
    "52318": {
      "school_short": "Wisconsin-La Crosse",
      "world": "stagg",
      "division": "D-III"
    },
    "52690": {
      "school_short": "Alcorn State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52970": {
      "school_short": "Austin Peay",
      "world": "warner",
      "division": "D-IAA"
    },
    "52444": {
      "school_short": "VMI",
      "world": "stagg",
      "division": "D-IAA"
    },
    "53185": {
      "school_short": "Baldwin-Wallace",
      "world": "warner",
      "division": "D-III"
    },
    "52755": {
      "school_short": "Bloomsburg",
      "world": "warner",
      "division": "D-II"
    },
    "52443": {
      "school_short": "Valparaiso",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52780": {
      "school_short": "Catawba",
      "world": "warner",
      "division": "D-II"
    },
    "52826": {
      "school_short": "Baylor",
      "world": "warner",
      "division": "D-IA"
    },
    "52743": {
      "school_short": "Bemidji State",
      "world": "warner",
      "division": "D-II"
    },
    "52477": {
      "school_short": "Villanova",
      "world": "stagg",
      "division": "D-IAA"
    },
    "53137": {
      "school_short": "Amherst",
      "world": "warner",
      "division": "D-III"
    },
    "52563": {
      "school_short": "Whitworth",
      "world": "stagg",
      "division": "D-III"
    },
    "52266": {
      "school_short": "Worcester State",
      "world": "stagg",
      "division": "D-III"
    },
    "52564": {
      "school_short": "Willamette",
      "world": "stagg",
      "division": "D-III"
    },
    "53143": {
      "school_short": "Bates",
      "world": "warner",
      "division": "D-III"
    },
    "53048": {
      "school_short": "Alfred",
      "world": "warner",
      "division": "D-III"
    },
    "52636": {
      "school_short": "Auburn",
      "world": "warner",
      "division": "D-IA"
    },
    "52101": {
      "school_short": "Wofford",
      "world": "stagg",
      "division": "D-IAA"
    },
    "53184": {
      "school_short": "Blackburn",
      "world": "warner",
      "division": "D-III"
    },
    "52773": {
      "school_short": "Adams State",
      "world": "warner",
      "division": "D-II"
    },
    "53079": {
      "school_short": "Alma",
      "world": "warner",
      "division": "D-III"
    },
    "52265": {
      "school_short": "Westfield State",
      "world": "stagg",
      "division": "D-III"
    },
    "52323": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "stagg",
      "division": "D-III"
    },
    "52162": {
      "school_short": "Winona State",
      "world": "stagg",
      "division": "D-II"
    },
    "52791": {
      "school_short": "Albany State",
      "world": "warner",
      "division": "D-II"
    },
    "53023": {
      "school_short": "Austin",
      "world": "warner",
      "division": "D-III"
    },
    "52737": {
      "school_short": "Assumption",
      "world": "warner",
      "division": "D-II"
    },
    "53000": {
      "school_short": "Abilene Christian",
      "world": "warner",
      "division": "D-II"
    },
    "52580": {
      "school_short": "Wilmington (OH)",
      "world": "stagg",
      "division": "D-III"
    },
    "52982": {
      "school_short": "Arkansas Tech",
      "world": "warner",
      "division": "D-II"
    },
    "53205": {
      "school_short": "Bluffton",
      "world": "warner",
      "division": "D-III"
    },
    "53065": {
      "school_short": "Buena Vista",
      "world": "warner",
      "division": "D-III"
    },
    "52964": {
      "school_short": "Butler",
      "world": "warner",
      "division": "D-IAA"
    },
    "52761": {
      "school_short": "California (PA)",
      "world": "warner",
      "division": "D-II"
    },
    "53244": {
      "school_short": "Carthage",
      "world": "warner",
      "division": "D-III"
    },
    "52874": {
      "school_short": "Central Michigan",
      "world": "warner",
      "division": "D-IA"
    },
    "53006": {
      "school_short": "Central Missouri State",
      "world": "warner",
      "division": "D-II"
    },
    "52727": {
      "school_short": "Central Washington",
      "world": "warner",
      "division": "D-II"
    },
    "53156": {
      "school_short": "Chapman",
      "world": "warner",
      "division": "D-III"
    },
    "53222": {
      "school_short": "Christopher Newport",
      "world": "warner",
      "division": "D-III"
    },
    "52797": {
      "school_short": "Clark Atlanta",
      "world": "warner",
      "division": "D-II"
    },
    "52925": {
      "school_short": "Colgate",
      "world": "warner",
      "division": "D-IAA"
    },
    "52741": {
      "school_short": "Concord",
      "world": "warner",
      "division": "D-II"
    },
    "52934": {
      "school_short": "Bethune-Cookman",
      "world": "warner",
      "division": "D-IAA"
    },
    "53197": {
      "school_short": "Bridgewater",
      "world": "warner",
      "division": "D-III"
    },
    "53107": {
      "school_short": "Carroll",
      "world": "warner",
      "division": "D-III"
    },
    "53131": {
      "school_short": "Bridgewater State",
      "world": "warner",
      "division": "D-III"
    },
    "53054": {
      "school_short": "Concordia (WI)",
      "world": "warner",
      "division": "D-III"
    },
    "52749": {
      "school_short": "Concordia",
      "world": "warner",
      "division": "D-II"
    },
    "53210": {
      "school_short": "DePauw",
      "world": "warner",
      "division": "D-III"
    },
    "53029": {
      "school_short": "Dickinson",
      "world": "warner",
      "division": "D-III"
    },
    "52965": {
      "school_short": "Drake",
      "world": "warner",
      "division": "D-IAA"
    },
    "52804": {
      "school_short": "Duke",
      "world": "warner",
      "division": "D-IA"
    },
    "52931": {
      "school_short": "Duquesne",
      "world": "warner",
      "division": "D-IAA"
    },
    "53168": {
      "school_short": "Earlham",
      "world": "warner",
      "division": "D-III"
    },
    "52994": {
      "school_short": "East Central",
      "world": "warner",
      "division": "D-II"
    },
    "53171": {
      "school_short": "Carnegie Mellon",
      "world": "warner",
      "division": "D-III"
    },
    "53227": {
      "school_short": "Chowan",
      "world": "warner",
      "division": "D-III"
    },
    "53114": {
      "school_short": "Bethel",
      "world": "warner",
      "division": "D-III"
    },
    "52762": {
      "school_short": "Clarion",
      "world": "warner",
      "division": "D-II"
    },
    "52926": {
      "school_short": "Holy Cross",
      "world": "warner",
      "division": "D-IAA"
    },
    "52733": {
      "school_short": "Bryant",
      "world": "warner",
      "division": "D-II"
    },
    "53028": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "warner",
      "division": "D-III"
    },
    "52916": {
      "school_short": "Brown",
      "world": "warner",
      "division": "D-IAA"
    },
    "52918": {
      "school_short": "Dartmouth",
      "world": "warner",
      "division": "D-IAA"
    },
    "52655": {
      "school_short": "Boise State",
      "world": "warner",
      "division": "D-IA"
    },
    "52958": {
      "school_short": "Eastern Kentucky",
      "world": "warner",
      "division": "D-IAA"
    },
    "52893": {
      "school_short": "Eastern Washington",
      "world": "warner",
      "division": "D-IAA"
    },
    "52763": {
      "school_short": "Edinboro",
      "world": "warner",
      "division": "D-II"
    },
    "52701": {
      "school_short": "Elizabeth City",
      "world": "warner",
      "division": "D-II"
    },
    "53126": {
      "school_short": "Endicott",
      "world": "warner",
      "division": "D-III"
    },
    "53085": {
      "school_short": "Colorado",
      "world": "warner",
      "division": "D-III"
    },
    "52803": {
      "school_short": "Clemson",
      "world": "warner",
      "division": "D-IA"
    },
    "52928": {
      "school_short": "Florida A&M",
      "world": "warner",
      "division": "D-IAA"
    },
    "52779": {
      "school_short": "Carson-Newman",
      "world": "warner",
      "division": "D-II"
    },
    "52666": {
      "school_short": "William & Mary",
      "world": "warner",
      "division": "D-IAA"
    },
    "53138": {
      "school_short": "Colby",
      "world": "warner",
      "division": "D-III"
    },
    "52814": {
      "school_short": "Boston",
      "world": "warner",
      "division": "D-IA"
    },
    "52988": {
      "school_short": "Delta State",
      "world": "warner",
      "division": "D-II"
    },
    "53196": {
      "school_short": "Defiance",
      "world": "warner",
      "division": "D-III"
    },
    "53209": {
      "school_short": "Centre",
      "world": "warner",
      "division": "D-III"
    },
    "53066": {
      "school_short": "Central",
      "world": "warner",
      "division": "D-III"
    },
    "53090": {
      "school_short": "Delaware Valley",
      "world": "warner",
      "division": "D-III"
    },
    "53195": {
      "school_short": "Mount St. Joseph",
      "world": "warner",
      "division": "D-III"
    },
    "53119": {
      "school_short": "Carleton",
      "world": "warner",
      "division": "D-III"
    },
    "52836": {
      "school_short": "DePaul",
      "world": "warner",
      "division": "D-IA"
    },
    "52881": {
      "school_short": "Arizona State",
      "world": "warner",
      "division": "D-IA"
    },
    "52894": {
      "school_short": "Cal Poly",
      "world": "warner",
      "division": "D-IAA"
    },
    "52767": {
      "school_short": "Chadron State",
      "world": "warner",
      "division": "D-II"
    },
    "53162": {
      "school_short": "Wooster",
      "world": "warner",
      "division": "D-III"
    },
    "53155": {
      "school_short": "Buffalo",
      "world": "warner",
      "division": "D-III"
    },
    "53186": {
      "school_short": "Capital",
      "world": "warner",
      "division": "D-III"
    },
    "52869": {
      "school_short": "Bowling Green",
      "world": "warner",
      "division": "D-IA"
    },
    "52975": {
      "school_short": "Coastal Carolina",
      "world": "warner",
      "division": "D-IAA"
    },
    "52868": {
      "school_short": "Eastern Michigan",
      "world": "warner",
      "division": "D-IA"
    },
    "53027": {
      "school_short": "California Lutheran",
      "world": "warner",
      "division": "D-III"
    },
    "53144": {
      "school_short": "Bowdoin",
      "world": "warner",
      "division": "D-III"
    },
    "52683": {
      "school_short": "Elon",
      "world": "warner",
      "division": "D-IAA"
    },
    "52924": {
      "school_short": "Bucknell",
      "world": "warner",
      "division": "D-IAA"
    },
    "53071": {
      "school_short": "Coe",
      "world": "warner",
      "division": "D-III"
    },
    "52974": {
      "school_short": "Charleston Southern",
      "world": "warner",
      "division": "D-IAA"
    },
    "53198": {
      "school_short": "Catholic",
      "world": "warner",
      "division": "D-III"
    },
    "53095": {
      "school_short": "Fairleigh Dickinson",
      "world": "warner",
      "division": "D-III"
    },
    "53223": {
      "school_short": "Ferrum",
      "world": "warner",
      "division": "D-III"
    },
    "53132": {
      "school_short": "Fitchburg State",
      "world": "warner",
      "division": "D-III"
    },
    "52809": {
      "school_short": "Florida State",
      "world": "warner",
      "division": "D-IA"
    },
    "53180": {
      "school_short": "Frostburg State",
      "world": "warner",
      "division": "D-III"
    },
    "52677": {
      "school_short": "Furman",
      "world": "warner",
      "division": "D-IAA"
    },
    "53072": {
      "school_short": "Cornell",
      "world": "warner",
      "division": "D-III"
    },
    "52971": {
      "school_short": "Davidson",
      "world": "warner",
      "division": "D-IAA"
    },
    "52930": {
      "school_short": "Delaware State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52682": {
      "school_short": "East Tennessee State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52706": {
      "school_short": "Fayetteville State",
      "world": "warner",
      "division": "D-II"
    },
    "52927": {
      "school_short": "Fordham",
      "world": "warner",
      "division": "D-IAA"
    },
    "52769": {
      "school_short": "Fort Hays State",
      "world": "warner",
      "division": "D-II"
    },
    "52774": {
      "school_short": "Fort Lewis",
      "world": "warner",
      "division": "D-II"
    },
    "53030": {
      "school_short": "Franklin & Marshall",
      "world": "warner",
      "division": "D-III"
    },
    "53115": {
      "school_short": "Concordia",
      "world": "warner",
      "division": "D-III"
    },
    "53060": {
      "school_short": "Concordia (IL)",
      "world": "warner",
      "division": "D-III"
    },
    "53167": {
      "school_short": "Denison",
      "world": "warner",
      "division": "D-III"
    },
    "53123": {
      "school_short": "Grove City",
      "world": "warner",
      "division": "D-III"
    },
    "53207": {
      "school_short": "Hanover",
      "world": "warner",
      "division": "D-III"
    },
    "52983": {
      "school_short": "Harding",
      "world": "warner",
      "division": "D-II"
    },
    "53191": {
      "school_short": "Heidelberg",
      "world": "warner",
      "division": "D-III"
    },
    "52989": {
      "school_short": "Henderson State",
      "world": "warner",
      "division": "D-II"
    },
    "53087": {
      "school_short": "Husson",
      "world": "warner",
      "division": "D-III"
    },
    "53062": {
      "school_short": "Illinois Wesleyan",
      "world": "warner",
      "division": "D-III"
    },
    "52764": {
      "school_short": "Indiana (PA)",
      "world": "warner",
      "division": "D-II"
    },
    "52955": {
      "school_short": "Iona",
      "world": "warner",
      "division": "D-IAA"
    },
    "52820": {
      "school_short": "Iowa State",
      "world": "warner",
      "division": "D-IA"
    },
    "52691": {
      "school_short": "Jackson State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53187": {
      "school_short": "John Carroll",
      "world": "warner",
      "division": "D-III"
    },
    "52707": {
      "school_short": "Johnson C. Smith",
      "world": "warner",
      "division": "D-II"
    },
    "52976": {
      "school_short": "Ferris State",
      "world": "warner",
      "division": "D-II"
    },
    "53019": {
      "school_short": "Howard Payne",
      "world": "warner",
      "division": "D-III"
    },
    "53049": {
      "school_short": "Hartwick",
      "world": "warner",
      "division": "D-III"
    },
    "52851": {
      "school_short": "East Carolina",
      "world": "warner",
      "division": "D-IA"
    },
    "52919": {
      "school_short": "Harvard",
      "world": "warner",
      "division": "D-IAA"
    },
    "53179": {
      "school_short": "Eastern Oregon",
      "world": "warner",
      "division": "D-III"
    },
    "53061": {
      "school_short": "Elmhurst",
      "world": "warner",
      "division": "D-III"
    },
    "53102": {
      "school_short": "Illinois",
      "world": "warner",
      "division": "D-III"
    },
    "53007": {
      "school_short": "Emporia State",
      "world": "warner",
      "division": "D-II"
    },
    "52912": {
      "school_short": "Florida International",
      "world": "warner",
      "division": "D-IAA"
    },
    "52815": {
      "school_short": "Kansas State",
      "world": "warner",
      "division": "D-IA"
    },
    "52800": {
      "school_short": "Kentucky Wesleyan",
      "world": "warner",
      "division": "D-II"
    },
    "53091": {
      "school_short": "King`s",
      "world": "warner",
      "division": "D-III"
    },
    "53109": {
      "school_short": "Knox",
      "world": "warner",
      "division": "D-III"
    },
    "52949": {
      "school_short": "Lafayette",
      "world": "warner",
      "division": "D-IAA"
    },
    "52948": {
      "school_short": "Georgetown",
      "world": "warner",
      "division": "D-IAA"
    },
    "52793": {
      "school_short": "Fort Valley State",
      "world": "warner",
      "division": "D-II"
    },
    "53169": {
      "school_short": "Hiram",
      "world": "warner",
      "division": "D-III"
    },
    "52667": {
      "school_short": "James Madison",
      "world": "warner",
      "division": "D-IAA"
    },
    "52848": {
      "school_short": "Indiana",
      "world": "warner",
      "division": "D-IA"
    },
    "53017": {
      "school_short": "East Texas Baptist",
      "world": "warner",
      "division": "D-III"
    },
    "53199": {
      "school_short": "Emory and Henry",
      "world": "warner",
      "division": "D-III"
    },
    "53108": {
      "school_short": "Grinnell",
      "world": "warner",
      "division": "D-III"
    },
    "52672": {
      "school_short": "Hofstra",
      "world": "warner",
      "division": "D-IAA"
    },
    "52705": {
      "school_short": "Gannon",
      "world": "warner",
      "division": "D-II"
    },
    "52742": {
      "school_short": "Fairmont State",
      "world": "warner",
      "division": "D-II"
    },
    "52972": {
      "school_short": "Jacksonville",
      "world": "warner",
      "division": "D-IAA"
    },
    "53147": {
      "school_short": "Framingham State",
      "world": "warner",
      "division": "D-III"
    },
    "53055": {
      "school_short": "Eureka",
      "world": "warner",
      "division": "D-III"
    },
    "52880": {
      "school_short": "BYU",
      "world": "warner",
      "division": "D-IA"
    },
    "52917": {
      "school_short": "Columbia",
      "world": "warner",
      "division": "D-IAA"
    },
    "53163": {
      "school_short": "Kenyon",
      "world": "warner",
      "division": "D-III"
    },
    "53050": {
      "school_short": "Ithaca",
      "world": "warner",
      "division": "D-III"
    },
    "53036": {
      "school_short": "Hobart",
      "world": "warner",
      "division": "D-III"
    },
    "53080": {
      "school_short": "Hope",
      "world": "warner",
      "division": "D-III"
    },
    "52959": {
      "school_short": "Jacksonville State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52898": {
      "school_short": "Idaho State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53032": {
      "school_short": "Johns Hopkins",
      "world": "warner",
      "division": "D-III"
    },
    "53149": {
      "school_short": "Kean",
      "world": "warner",
      "division": "D-III"
    },
    "52905": {
      "school_short": "Indiana State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53103": {
      "school_short": "Lake Forest",
      "world": "warner",
      "division": "D-III"
    },
    "52935": {
      "school_short": "Hampton",
      "world": "warner",
      "division": "D-IAA"
    },
    "53002": {
      "school_short": "Eastern New Mexico",
      "world": "warner",
      "division": "D-II"
    },
    "52693": {
      "school_short": "Gardner-Webb",
      "world": "warner",
      "division": "D-IAA"
    },
    "53224": {
      "school_short": "Greensboro",
      "world": "warner",
      "division": "D-III"
    },
    "52787": {
      "school_short": "Glenville",
      "world": "warner",
      "division": "D-II"
    },
    "52694": {
      "school_short": "Grambling State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52713": {
      "school_short": "Grand Valley State",
      "world": "warner",
      "division": "D-II"
    },
    "53145": {
      "school_short": "Hamilton",
      "world": "warner",
      "division": "D-III"
    },
    "53120": {
      "school_short": "Hamline",
      "world": "warner",
      "division": "D-III"
    },
    "53201": {
      "school_short": "Hampden-Sydney",
      "world": "warner",
      "division": "D-III"
    },
    "52699": {
      "school_short": "Liberty",
      "world": "warner",
      "division": "D-IAA"
    },
    "53174": {
      "school_short": "Linfield",
      "world": "warner",
      "division": "D-III"
    },
    "52708": {
      "school_short": "Livingstone",
      "world": "warner",
      "division": "D-II"
    },
    "53092": {
      "school_short": "Lycoming",
      "world": "warner",
      "division": "D-III"
    },
    "53084": {
      "school_short": "Macalester",
      "world": "warner",
      "division": "D-III"
    },
    "53058": {
      "school_short": "MacMurray",
      "world": "warner",
      "division": "D-III"
    },
    "53228": {
      "school_short": "Maranatha Baptist",
      "world": "warner",
      "division": "D-III"
    },
    "53192": {
      "school_short": "Marietta",
      "world": "warner",
      "division": "D-III"
    },
    "52956": {
      "school_short": "Marist",
      "world": "warner",
      "division": "D-IAA"
    },
    "52837": {
      "school_short": "Marquette",
      "world": "warner",
      "division": "D-IA"
    },
    "53086": {
      "school_short": "Martin Luther",
      "world": "warner",
      "division": "D-III"
    },
    "53134": {
      "school_short": "Massachusetts Maritime",
      "world": "warner",
      "division": "D-III"
    },
    "52685": {
      "school_short": "McNeese State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53181": {
      "school_short": "Menlo",
      "world": "warner",
      "division": "D-III"
    },
    "52735": {
      "school_short": "Merrimack",
      "world": "warner",
      "division": "D-II"
    },
    "52840": {
      "school_short": "Michigan State",
      "world": "warner",
      "division": "D-IA"
    },
    "52978": {
      "school_short": "Michigan Tech",
      "world": "warner",
      "division": "D-II"
    },
    "53139": {
      "school_short": "Middlebury",
      "world": "warner",
      "division": "D-III"
    },
    "52759": {
      "school_short": "Millersville",
      "world": "warner",
      "division": "D-II"
    },
    "53024": {
      "school_short": "Mississippi",
      "world": "warner",
      "division": "D-III"
    },
    "53008": {
      "school_short": "Missouri Western State",
      "world": "warner",
      "division": "D-II"
    },
    "53104": {
      "school_short": "Monmouth (IL)",
      "world": "warner",
      "division": "D-III"
    },
    "52940": {
      "school_short": "Monmouth",
      "world": "warner",
      "division": "D-IAA"
    },
    "53133": {
      "school_short": "Maine Maritime",
      "world": "warner",
      "division": "D-III"
    },
    "53067": {
      "school_short": "Loras",
      "world": "warner",
      "division": "D-III"
    },
    "52714": {
      "school_short": "Mercyhurst",
      "world": "warner",
      "division": "D-II"
    },
    "53012": {
      "school_short": "Missouri Southern State",
      "world": "warner",
      "division": "D-II"
    },
    "52910": {
      "school_short": "Missouri State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52770": {
      "school_short": "Midwestern State",
      "world": "warner",
      "division": "D-II"
    },
    "52904": {
      "school_short": "Illinois State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52865": {
      "school_short": "Kent State",
      "world": "warner",
      "division": "D-IA"
    },
    "52678": {
      "school_short": "Georgia Southern",
      "world": "warner",
      "division": "D-IAA"
    },
    "53116": {
      "school_short": "Gustavus Adolphus",
      "world": "warner",
      "division": "D-III"
    },
    "52692": {
      "school_short": "Mississippi Valley State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53021": {
      "school_short": "McMurry",
      "world": "warner",
      "division": "D-III"
    },
    "53225": {
      "school_short": "Methodist",
      "world": "warner",
      "division": "D-III"
    },
    "52643": {
      "school_short": "Middle Tennessee State",
      "world": "warner",
      "division": "D-IA"
    },
    "52720": {
      "school_short": "Minnesota State-Mankato",
      "world": "warner",
      "division": "D-II"
    },
    "52900": {
      "school_short": "Montana State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53057": {
      "school_short": "Lakeland",
      "world": "warner",
      "division": "D-III"
    },
    "52798": {
      "school_short": "Lane",
      "world": "warner",
      "division": "D-II"
    },
    "53110": {
      "school_short": "Lawrence",
      "world": "warner",
      "division": "D-III"
    },
    "53208": {
      "school_short": "Manchester",
      "world": "warner",
      "division": "D-III"
    },
    "52847": {
      "school_short": "Purdue",
      "world": "warner",
      "division": "D-IA"
    },
    "53189": {
      "school_short": "Muskingum",
      "world": "warner",
      "division": "D-III"
    },
    "53230": {
      "school_short": "Nebraska Wesleyan",
      "world": "warner",
      "division": "D-III"
    },
    "52648": {
      "school_short": "New Mexico State",
      "world": "warner",
      "division": "D-IA"
    },
    "52786": {
      "school_short": "Newberry",
      "world": "warner",
      "division": "D-II"
    },
    "52686": {
      "school_short": "Nicholls State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52785": {
      "school_short": "Lenoir-Rhyne",
      "world": "warner",
      "division": "D-II"
    },
    "52936": {
      "school_short": "Howard",
      "world": "warner",
      "division": "D-IAA"
    },
    "53031": {
      "school_short": "Gettysburg",
      "world": "warner",
      "division": "D-III"
    },
    "53033": {
      "school_short": "McDaniel",
      "world": "warner",
      "division": "D-III"
    },
    "52781": {
      "school_short": "Mars Hill",
      "world": "warner",
      "division": "D-II"
    },
    "52866": {
      "school_short": "Ohio",
      "world": "warner",
      "division": "D-IA"
    },
    "52805": {
      "school_short": "Georgia Tech",
      "world": "warner",
      "division": "D-IA"
    },
    "53173": {
      "school_short": "Lewis and Clark",
      "world": "warner",
      "division": "D-III"
    },
    "52795": {
      "school_short": "Miles",
      "world": "warner",
      "division": "D-II"
    },
    "53016": {
      "school_short": "Lock Haven",
      "world": "warner",
      "division": "D-II"
    },
    "53241": {
      "school_short": "Millikin",
      "world": "warner",
      "division": "D-III"
    },
    "52932": {
      "school_short": "La Salle",
      "world": "warner",
      "division": "D-IAA"
    },
    "53034": {
      "school_short": "Muhlenberg",
      "world": "warner",
      "division": "D-III"
    },
    "52637": {
      "school_short": "LSU",
      "world": "warner",
      "division": "D-IA"
    },
    "52950": {
      "school_short": "Lehigh",
      "world": "warner",
      "division": "D-IAA"
    },
    "52638": {
      "school_short": "Mississippi State",
      "world": "warner",
      "division": "D-IA"
    },
    "53068": {
      "school_short": "Luther",
      "world": "warner",
      "division": "D-III"
    },
    "52855": {
      "school_short": "Marshall",
      "world": "warner",
      "division": "D-IA"
    },
    "53020": {
      "school_short": "Louisiana",
      "world": "warner",
      "division": "D-III"
    },
    "52929": {
      "school_short": "Norfolk State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52721": {
      "school_short": "North Dakota State",
      "world": "warner",
      "division": "D-II"
    },
    "53243": {
      "school_short": "North Park",
      "world": "warner",
      "division": "D-III"
    },
    "52995": {
      "school_short": "Northeastern State",
      "world": "warner",
      "division": "D-II"
    },
    "52687": {
      "school_short": "Northwestern State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52979": {
      "school_short": "Northwood",
      "world": "warner",
      "division": "D-II"
    },
    "53041": {
      "school_short": "Norwich",
      "world": "warner",
      "division": "D-III"
    },
    "53164": {
      "school_short": "Oberlin",
      "world": "warner",
      "division": "D-III"
    },
    "53216": {
      "school_short": "Occidental",
      "world": "warner",
      "division": "D-III"
    },
    "53083": {
      "school_short": "Olivet",
      "world": "warner",
      "division": "D-III"
    },
    "53193": {
      "school_short": "Otterbein",
      "world": "warner",
      "division": "D-III"
    },
    "52984": {
      "school_short": "Ouachita Baptist",
      "world": "warner",
      "division": "D-II"
    },
    "53042": {
      "school_short": "Plymouth State",
      "world": "warner",
      "division": "D-III"
    },
    "53217": {
      "school_short": "Pomona-Pitzers",
      "world": "warner",
      "division": "D-III"
    },
    "53182": {
      "school_short": "Principia",
      "world": "warner",
      "division": "D-III"
    },
    "52802": {
      "school_short": "Quincy",
      "world": "warner",
      "division": "D-II"
    },
    "53202": {
      "school_short": "Randolph-Macon",
      "world": "warner",
      "division": "D-III"
    },
    "53037": {
      "school_short": "Rensselaer Tech",
      "world": "warner",
      "division": "D-III"
    },
    "53009": {
      "school_short": "Northwest Missouri State",
      "world": "warner",
      "division": "D-II"
    },
    "52846": {
      "school_short": "Penn State",
      "world": "warner",
      "division": "D-IA"
    },
    "52895": {
      "school_short": "Portland State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53150": {
      "school_short": "Montclair State",
      "world": "warner",
      "division": "D-III"
    },
    "53098": {
      "school_short": "Moravian",
      "world": "warner",
      "division": "D-III"
    },
    "52973": {
      "school_short": "Morehead State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52937": {
      "school_short": "Morgan State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52716": {
      "school_short": "Saginaw Valley State",
      "world": "warner",
      "division": "D-II"
    },
    "52739": {
      "school_short": "Saint Anselm",
      "world": "warner",
      "division": "D-II"
    },
    "53127": {
      "school_short": "Nichols",
      "world": "warner",
      "division": "D-III"
    },
    "52771": {
      "school_short": "Oklahoma Panhandle",
      "world": "warner",
      "division": "D-II"
    },
    "52758": {
      "school_short": "Mansfield",
      "world": "warner",
      "division": "D-II"
    },
    "53667": {
      "school_short": "Eureka",
      "world": "heisman",
      "division": "D-III"
    },
    "53170": {
      "school_short": "Ohio Wesleyan",
      "world": "warner",
      "division": "D-III"
    },
    "52776": {
      "school_short": "New Mexico Highlands",
      "world": "warner",
      "division": "D-II"
    },
    "52662": {
      "school_short": "San Jose State",
      "world": "warner",
      "division": "D-IA"
    },
    "53128": {
      "school_short": "Salve Regina",
      "world": "warner",
      "division": "D-III"
    },
    "52702": {
      "school_short": "Shaw",
      "world": "warner",
      "division": "D-II"
    },
    "52788": {
      "school_short": "Shepherd",
      "world": "warner",
      "division": "D-II"
    },
    "52996": {
      "school_short": "SE Oklahoma-Durant",
      "world": "warner",
      "division": "D-II"
    },
    "52990": {
      "school_short": "Southern Arkansas",
      "world": "warner",
      "division": "D-II"
    },
    "52736": {
      "school_short": "Southern Connecticut",
      "world": "warner",
      "division": "D-II"
    },
    "52906": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "warner",
      "division": "D-IAA"
    },
    "52915": {
      "school_short": "Southern Utah",
      "world": "warner",
      "division": "D-IAA"
    },
    "53013": {
      "school_short": "Southwest Baptist",
      "world": "warner",
      "division": "D-II"
    },
    "53175": {
      "school_short": "Pacific Lutheran",
      "world": "warner",
      "division": "D-III"
    },
    "52661": {
      "school_short": "San Diego State",
      "world": "warner",
      "division": "D-IA"
    },
    "52823": {
      "school_short": "Oklahoma State",
      "world": "warner",
      "division": "D-IA"
    },
    "52852": {
      "school_short": "Rice",
      "world": "warner",
      "division": "D-IA"
    },
    "53226": {
      "school_short": "Shenandoah",
      "world": "warner",
      "division": "D-III"
    },
    "52673": {
      "school_short": "Northeastern",
      "world": "warner",
      "division": "D-IAA"
    },
    "52734": {
      "school_short": "Long Island",
      "world": "warner",
      "division": "D-II"
    },
    "52695": {
      "school_short": "Prairie View",
      "world": "warner",
      "division": "D-IAA"
    },
    "52715": {
      "school_short": "Northern Michigan",
      "world": "warner",
      "division": "D-II"
    },
    "52810": {
      "school_short": "North Carolina State",
      "world": "warner",
      "division": "D-IA"
    },
    "53242": {
      "school_short": "North Central",
      "world": "warner",
      "division": "D-III"
    },
    "52960": {
      "school_short": "Murray State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52941": {
      "school_short": "Robert Morris",
      "world": "warner",
      "division": "D-IAA"
    },
    "52828": {
      "school_short": "Syracuse",
      "world": "warner",
      "division": "D-IA"
    },
    "53188": {
      "school_short": "Mount Union",
      "world": "warner",
      "division": "D-III"
    },
    "52782": {
      "school_short": "Presbyterian",
      "world": "warner",
      "division": "D-II"
    },
    "52654": {
      "school_short": "Louisiana Tech",
      "world": "warner",
      "division": "D-IA"
    },
    "53157": {
      "school_short": "Huntingdon",
      "world": "warner",
      "division": "D-III"
    },
    "53010": {
      "school_short": "Pittsburg State",
      "world": "warner",
      "division": "D-II"
    },
    "52841": {
      "school_short": "Northwestern",
      "world": "warner",
      "division": "D-IA"
    },
    "52845": {
      "school_short": "Ohio State",
      "world": "warner",
      "division": "D-IA"
    },
    "52933": {
      "school_short": "Siena",
      "world": "warner",
      "division": "D-IAA"
    },
    "52998": {
      "school_short": "Tarleton State",
      "world": "warner",
      "division": "D-II"
    },
    "52923": {
      "school_short": "Princeton",
      "world": "warner",
      "division": "D-IAA"
    },
    "53069": {
      "school_short": "Simpson",
      "world": "warner",
      "division": "D-III"
    },
    "52962": {
      "school_short": "Southeast Missouri State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53190": {
      "school_short": "Ohio Northern",
      "world": "warner",
      "division": "D-III"
    },
    "52723": {
      "school_short": "St. Cloud State",
      "world": "warner",
      "division": "D-II"
    },
    "53051": {
      "school_short": "St. John Fisher",
      "world": "warner",
      "division": "D-III"
    },
    "53117": {
      "school_short": "St. John`s",
      "world": "warner",
      "division": "D-III"
    },
    "53038": {
      "school_short": "St. Lawrence",
      "world": "warner",
      "division": "D-III"
    },
    "53106": {
      "school_short": "St. Norbert",
      "world": "warner",
      "division": "D-III"
    },
    "53121": {
      "school_short": "St. Olaf",
      "world": "warner",
      "division": "D-III"
    },
    "52740": {
      "school_short": "Stonehill",
      "world": "warner",
      "division": "D-II"
    },
    "52943": {
      "school_short": "Stony Brook",
      "world": "warner",
      "division": "D-IAA"
    },
    "53025": {
      "school_short": "Sul Ross State",
      "world": "warner",
      "division": "D-III"
    },
    "53213": {
      "school_short": "Rose-Hulman",
      "world": "warner",
      "division": "D-III"
    },
    "53152": {
      "school_short": "Cortland",
      "world": "warner",
      "division": "D-III"
    },
    "53100": {
      "school_short": "Salisbury",
      "world": "warner",
      "division": "D-III"
    },
    "52997": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "warner",
      "division": "D-II"
    },
    "53159": {
      "school_short": "Rockford",
      "world": "warner",
      "division": "D-III"
    },
    "53151": {
      "school_short": "Rowan",
      "world": "warner",
      "division": "D-III"
    },
    "52942": {
      "school_short": "Sacred Heart",
      "world": "warner",
      "division": "D-IAA"
    },
    "53141": {
      "school_short": "Tufts",
      "world": "warner",
      "division": "D-III"
    },
    "53044": {
      "school_short": "Merchant Marine",
      "world": "warner",
      "division": "D-III"
    },
    "52986": {
      "school_short": "Central Arkansas",
      "world": "warner",
      "division": "D-II"
    },
    "52668": {
      "school_short": "Delaware",
      "world": "warner",
      "division": "D-IAA"
    },
    "52953": {
      "school_short": "Tennessee Tech",
      "world": "warner",
      "division": "D-IAA"
    },
    "53074": {
      "school_short": "Thiel",
      "world": "warner",
      "division": "D-III"
    },
    "52951": {
      "school_short": "Towson",
      "world": "warner",
      "division": "D-IAA"
    },
    "53140": {
      "school_short": "Trinity",
      "world": "warner",
      "division": "D-III"
    },
    "53214": {
      "school_short": "Trinity (TX)",
      "world": "warner",
      "division": "D-III"
    },
    "52913": {
      "school_short": "Savannah State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52901": {
      "school_short": "Sam Houston State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52961": {
      "school_short": "Samford",
      "world": "warner",
      "division": "D-IAA"
    },
    "53093": {
      "school_short": "Susquehanna",
      "world": "warner",
      "division": "D-III"
    },
    "52653": {
      "school_short": "Troy State",
      "world": "warner",
      "division": "D-IA"
    },
    "52957": {
      "school_short": "St. Peter`s",
      "world": "warner",
      "division": "D-IAA"
    },
    "52939": {
      "school_short": "SC State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52745": {
      "school_short": "Southwest Minnesota State",
      "world": "warner",
      "division": "D-II"
    },
    "53183": {
      "school_short": "Stillman",
      "world": "warner",
      "division": "D-III"
    },
    "53004": {
      "school_short": "Texas A&M-Kingsville",
      "world": "warner",
      "division": "D-II"
    },
    "52783": {
      "school_short": "Tusculum",
      "world": "warner",
      "division": "D-II"
    },
    "53039": {
      "school_short": "Union (NY)",
      "world": "warner",
      "division": "D-III"
    },
    "52991": {
      "school_short": "Arkansas-Monticello",
      "world": "warner",
      "division": "D-II"
    },
    "52698": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "warner",
      "division": "D-IAA"
    },
    "52879": {
      "school_short": "California",
      "world": "warner",
      "division": "D-IA"
    },
    "52856": {
      "school_short": "Central Florida",
      "world": "warner",
      "division": "D-IA"
    },
    "52752": {
      "school_short": "Charleston",
      "world": "warner",
      "division": "D-II"
    },
    "52644": {
      "school_short": "Louisiana Lafayette",
      "world": "warner",
      "division": "D-IA"
    },
    "52710": {
      "school_short": "St. Augustine`s",
      "world": "warner",
      "division": "D-II"
    },
    "53231": {
      "school_short": "Thomas More",
      "world": "warner",
      "division": "D-III"
    },
    "52849": {
      "school_short": "Iowa",
      "world": "warner",
      "division": "D-IA"
    },
    "52944": {
      "school_short": "Albany",
      "world": "warner",
      "division": "D-IAA"
    },
    "52858": {
      "school_short": "Tulane",
      "world": "warner",
      "division": "D-IA"
    },
    "52765": {
      "school_short": "Shippensburg",
      "world": "warner",
      "division": "D-II"
    },
    "52766": {
      "school_short": "Slippery Rock",
      "world": "warner",
      "division": "D-II"
    },
    "53047": {
      "school_short": "Springfield",
      "world": "warner",
      "division": "D-III"
    },
    "52903": {
      "school_short": "Texas State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52980": {
      "school_short": "Findlay",
      "world": "warner",
      "division": "D-II"
    },
    "52884": {
      "school_short": "UCLA",
      "world": "warner",
      "division": "D-IA"
    },
    "52801": {
      "school_short": "Saint Joseph`s",
      "world": "warner",
      "division": "D-II"
    },
    "52861": {
      "school_short": "Houston",
      "world": "warner",
      "division": "D-IA"
    },
    "52833": {
      "school_short": "Louisville",
      "world": "warner",
      "division": "D-IA"
    },
    "52871": {
      "school_short": "Northern Illinois",
      "world": "warner",
      "division": "D-IA"
    },
    "52947": {
      "school_short": "Saint Francis",
      "world": "warner",
      "division": "D-IAA"
    },
    "52860": {
      "school_short": "Southern Methodist",
      "world": "warner",
      "division": "D-IA"
    },
    "53158": {
      "school_short": "Mount Ida",
      "world": "warner",
      "division": "D-III"
    },
    "52885": {
      "school_short": "Stanford",
      "world": "warner",
      "division": "D-IA"
    },
    "52839": {
      "school_short": "Illinois",
      "world": "warner",
      "division": "D-IA"
    },
    "52889": {
      "school_short": "Florida",
      "world": "warner",
      "division": "D-IA"
    },
    "52639": {
      "school_short": "Alabama",
      "world": "warner",
      "division": "D-IA"
    },
    "53088": {
      "school_short": "Brockport",
      "world": "warner",
      "division": "D-III"
    },
    "52738": {
      "school_short": "Pace",
      "world": "warner",
      "division": "D-II"
    },
    "52897": {
      "school_short": "St. Mary`s",
      "world": "warner",
      "division": "D-IAA"
    },
    "52857": {
      "school_short": "Texas Christian",
      "world": "warner",
      "division": "D-IA"
    },
    "53153": {
      "school_short": "New Jersey",
      "world": "warner",
      "division": "D-III"
    },
    "52640": {
      "school_short": "Arkansas",
      "world": "warner",
      "division": "D-IA"
    },
    "52635": {
      "school_short": "Kentucky",
      "world": "warner",
      "division": "D-IA"
    },
    "52664": {
      "school_short": "Hawaii",
      "world": "warner",
      "division": "D-IA"
    },
    "52645": {
      "school_short": "Louisiana Monroe",
      "world": "warner",
      "division": "D-IA"
    },
    "52867": {
      "school_short": "Buffalo",
      "world": "warner",
      "division": "D-IA"
    },
    "52862": {
      "school_short": "Southern Mississippi",
      "world": "warner",
      "division": "D-IA"
    },
    "52669": {
      "school_short": "Massachusetts",
      "world": "warner",
      "division": "D-IAA"
    },
    "53129": {
      "school_short": "UMass-Dartmouth",
      "world": "warner",
      "division": "D-III"
    },
    "52843": {
      "school_short": "Minnesota",
      "world": "warner",
      "division": "D-IA"
    },
    "53014": {
      "school_short": "Missouri-Rolla",
      "world": "warner",
      "division": "D-II"
    },
    "52652": {
      "school_short": "Montana",
      "world": "warner",
      "division": "D-IA"
    },
    "52675": {
      "school_short": "New Hampshire",
      "world": "warner",
      "division": "D-IAA"
    },
    "52657": {
      "school_short": "New Mexico",
      "world": "warner",
      "division": "D-IA"
    },
    "52806": {
      "school_short": "North Carolina",
      "world": "warner",
      "division": "D-IA"
    },
    "52920": {
      "school_short": "Pennsylvania",
      "world": "warner",
      "division": "D-IAA"
    },
    "53219": {
      "school_short": "Redlands",
      "world": "warner",
      "division": "D-III"
    },
    "52634": {
      "school_short": "South Carolina",
      "world": "warner",
      "division": "D-IA"
    },
    "52883": {
      "school_short": "Southern California",
      "world": "warner",
      "division": "D-IA"
    },
    "52811": {
      "school_short": "Maryland",
      "world": "warner",
      "division": "D-IA"
    },
    "52796": {
      "school_short": "Tuskegee",
      "world": "warner",
      "division": "D-II"
    },
    "52697": {
      "school_short": "Texas Southern",
      "world": "warner",
      "division": "D-IAA"
    },
    "52777": {
      "school_short": "Nebraska-Kearney",
      "world": "warner",
      "division": "D-II"
    },
    "52864": {
      "school_short": "Akron",
      "world": "warner",
      "division": "D-IA"
    },
    "52967": {
      "school_short": "San Diego",
      "world": "warner",
      "division": "D-IAA"
    },
    "52890": {
      "school_short": "Richmond",
      "world": "warner",
      "division": "D-IAA"
    },
    "52854": {
      "school_short": "Memphis",
      "world": "warner",
      "division": "D-IA"
    },
    "52665": {
      "school_short": "Nevada",
      "world": "warner",
      "division": "D-IA"
    },
    "52859": {
      "school_short": "Alabama Birmingham",
      "world": "warner",
      "division": "D-IA"
    },
    "53073": {
      "school_short": "Dubuque",
      "world": "warner",
      "division": "D-III"
    },
    "53026": {
      "school_short": "Texas Lutheran",
      "world": "warner",
      "division": "D-III"
    },
    "52684": {
      "school_short": "Tennessee-Chattanooga",
      "world": "warner",
      "division": "D-IAA"
    },
    "52870": {
      "school_short": "Toledo",
      "world": "warner",
      "division": "D-IA"
    },
    "52807": {
      "school_short": "Virginia",
      "world": "warner",
      "division": "D-IA"
    },
    "52987": {
      "school_short": "West Alabama",
      "world": "warner",
      "division": "D-II"
    },
    "52821": {
      "school_short": "Oklahoma",
      "world": "warner",
      "division": "D-IA"
    },
    "52703": {
      "school_short": "Virginia State",
      "world": "warner",
      "division": "D-II"
    },
    "52945": {
      "school_short": "Wagner",
      "world": "warner",
      "division": "D-IAA"
    },
    "52704": {
      "school_short": "Virginia Union",
      "world": "warner",
      "division": "D-II"
    },
    "53076": {
      "school_short": "Waynesburg",
      "world": "warner",
      "division": "D-III"
    },
    "52681": {
      "school_short": "Wofford",
      "world": "warner",
      "division": "D-IAA"
    },
    "52882": {
      "school_short": "Arizona",
      "world": "warner",
      "division": "D-IA"
    },
    "53233": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "warner",
      "division": "D-III"
    },
    "52878": {
      "school_short": "Washington State",
      "world": "warner",
      "division": "D-IA"
    },
    "52649": {
      "school_short": "Idaho",
      "world": "warner",
      "division": "D-IA"
    },
    "52680": {
      "school_short": "Western Carolina",
      "world": "warner",
      "division": "D-IAA"
    },
    "52748": {
      "school_short": "Minnesota-Duluth",
      "world": "warner",
      "division": "D-II"
    },
    "52816": {
      "school_short": "Nebraska",
      "world": "warner",
      "division": "D-IA"
    },
    "52819": {
      "school_short": "Colorado",
      "world": "warner",
      "division": "D-IA"
    },
    "53003": {
      "school_short": "Texas A&M-Commerce",
      "world": "warner",
      "division": "D-II"
    },
    "52746": {
      "school_short": "Minnesota-Crookston",
      "world": "warner",
      "division": "D-II"
    },
    "52726": {
      "school_short": "South Dakota",
      "world": "warner",
      "division": "D-II"
    },
    "52818": {
      "school_short": "Kansas",
      "world": "warner",
      "division": "D-IA"
    },
    "52656": {
      "school_short": "UTEP",
      "world": "warner",
      "division": "D-IA"
    },
    "53234": {
      "school_short": "Wisconsin-La Crosse",
      "world": "warner",
      "division": "D-III"
    },
    "53253": {
      "school_short": "Ole Miss",
      "world": "heisman",
      "division": "D-IA"
    },
    "53015": {
      "school_short": "Washburn-Topeka",
      "world": "warner",
      "division": "D-II"
    },
    "52817": {
      "school_short": "Missouri",
      "world": "warner",
      "division": "D-IA"
    },
    "52992": {
      "school_short": "North Alabama",
      "world": "warner",
      "division": "D-II"
    },
    "52670": {
      "school_short": "Rhode Island",
      "world": "warner",
      "division": "D-IAA"
    },
    "52822": {
      "school_short": "Texas",
      "world": "warner",
      "division": "D-IA"
    },
    "53111": {
      "school_short": "Chicago",
      "world": "warner",
      "division": "D-III"
    },
    "52825": {
      "school_short": "Texas A&M",
      "world": "warner",
      "division": "D-IA"
    },
    "52966": {
      "school_short": "Dayton",
      "world": "warner",
      "division": "D-IAA"
    },
    "52835": {
      "school_short": "South Florida",
      "world": "warner",
      "division": "D-IA"
    },
    "52679": {
      "school_short": "Citadel",
      "world": "warner",
      "division": "D-IAA"
    },
    "52902": {
      "school_short": "Stephen F. Austin",
      "world": "warner",
      "division": "D-IAA"
    },
    "52850": {
      "school_short": "Notre Dame",
      "world": "warner",
      "division": "D-IA"
    },
    "53118": {
      "school_short": "St. Thomas",
      "world": "warner",
      "division": "D-III"
    },
    "53176": {
      "school_short": "Puget Sound",
      "world": "warner",
      "division": "D-III"
    },
    "53040": {
      "school_short": "Rochester",
      "world": "warner",
      "division": "D-III"
    },
    "52969": {
      "school_short": "VMI",
      "world": "warner",
      "division": "D-IAA"
    },
    "52911": {
      "school_short": "Northern Iowa",
      "world": "warner",
      "division": "D-IAA"
    },
    "53075": {
      "school_short": "Washington and Jefferson",
      "world": "warner",
      "division": "D-III"
    },
    "53052": {
      "school_short": "Utica",
      "world": "warner",
      "division": "D-III"
    },
    "52896": {
      "school_short": "Weber State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53124": {
      "school_short": "Westminster (PA)",
      "world": "warner",
      "division": "D-III"
    },
    "52760": {
      "school_short": "West Chester",
      "world": "warner",
      "division": "D-II"
    },
    "53064": {
      "school_short": "Wheaton",
      "world": "warner",
      "division": "D-III"
    },
    "52754": {
      "school_short": "West Virginia State",
      "world": "warner",
      "division": "D-II"
    },
    "52907": {
      "school_short": "Western Illinois",
      "world": "warner",
      "division": "D-IAA"
    },
    "52772": {
      "school_short": "Western New Mexico",
      "world": "warner",
      "division": "D-II"
    },
    "52778": {
      "school_short": "Western State (CO)",
      "world": "warner",
      "division": "D-II"
    },
    "52730": {
      "school_short": "Western Washington",
      "world": "warner",
      "division": "D-II"
    },
    "52751": {
      "school_short": "Wayne State",
      "world": "warner",
      "division": "D-II"
    },
    "53146": {
      "school_short": "Wesleyan",
      "world": "warner",
      "division": "D-III"
    },
    "52886": {
      "school_short": "Air Force",
      "world": "warner",
      "division": "D-IA"
    },
    "52651": {
      "school_short": "Utah State",
      "world": "warner",
      "division": "D-IA"
    },
    "52725": {
      "school_short": "North Dakota",
      "world": "warner",
      "division": "D-II"
    },
    "53135": {
      "school_short": "Westfield State",
      "world": "warner",
      "division": "D-III"
    },
    "52842": {
      "school_short": "Michigan",
      "world": "warner",
      "division": "D-IA"
    },
    "52872": {
      "school_short": "Western Michigan",
      "world": "warner",
      "division": "D-IA"
    },
    "52724": {
      "school_short": "Nebraska-Omaha",
      "world": "warner",
      "division": "D-II"
    },
    "53239": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "warner",
      "division": "D-III"
    },
    "52789": {
      "school_short": "West Virginia Tech",
      "world": "warner",
      "division": "D-II"
    },
    "53005": {
      "school_short": "West Texas A&M",
      "world": "warner",
      "division": "D-II"
    },
    "52808": {
      "school_short": "Wake Forest",
      "world": "warner",
      "division": "D-IA"
    },
    "53130": {
      "school_short": "Western New England",
      "world": "warner",
      "division": "D-III"
    },
    "52671": {
      "school_short": "Villanova",
      "world": "warner",
      "division": "D-IAA"
    },
    "53160": {
      "school_short": "Wesley",
      "world": "warner",
      "division": "D-III"
    },
    "53240": {
      "school_short": "Wisconsin-Stout",
      "world": "warner",
      "division": "D-III"
    },
    "52659": {
      "school_short": "Wyoming",
      "world": "warner",
      "division": "D-IA"
    },
    "53165": {
      "school_short": "Wabash",
      "world": "warner",
      "division": "D-III"
    },
    "53546": {
      "school_short": "Bethune-Cookman",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53796": {
      "school_short": "Blackburn",
      "world": "heisman",
      "division": "D-III"
    },
    "53612": {
      "school_short": "Abilene Christian",
      "world": "heisman",
      "division": "D-II"
    },
    "53302": {
      "school_short": "Alcorn State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53691": {
      "school_short": "Alma",
      "world": "heisman",
      "division": "D-III"
    },
    "53343": {
      "school_short": "American International",
      "world": "heisman",
      "division": "D-II"
    },
    "53725": {
      "school_short": "Augsburg",
      "world": "heisman",
      "division": "D-III"
    },
    "53331": {
      "school_short": "Augustana",
      "world": "heisman",
      "division": "D-II"
    },
    "53665": {
      "school_short": "Aurora",
      "world": "heisman",
      "division": "D-III"
    },
    "53833": {
      "school_short": "Averett",
      "world": "heisman",
      "division": "D-III"
    },
    "53485": {
      "school_short": "Ball State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53671": {
      "school_short": "Benedictine",
      "world": "heisman",
      "division": "D-III"
    },
    "53734": {
      "school_short": "Bethany",
      "world": "heisman",
      "division": "D-III"
    },
    "53817": {
      "school_short": "Bluffton",
      "world": "heisman",
      "division": "D-III"
    },
    "53154": {
      "school_short": "William Paterson",
      "world": "warner",
      "division": "D-III"
    },
    "53142": {
      "school_short": "Williams",
      "world": "warner",
      "division": "D-III"
    },
    "52711": {
      "school_short": "Winston-Salem State",
      "world": "warner",
      "division": "D-II"
    },
    "53082": {
      "school_short": "Wisconsin Lutheran",
      "world": "warner",
      "division": "D-III"
    },
    "53166": {
      "school_short": "Wittenberg",
      "world": "warner",
      "division": "D-III"
    },
    "52877": {
      "school_short": "Washington",
      "world": "warner",
      "division": "D-IA"
    },
    "53220": {
      "school_short": "Whittier",
      "world": "warner",
      "division": "D-III"
    },
    "52729": {
      "school_short": "Western Oregon",
      "world": "warner",
      "division": "D-II"
    },
    "52647": {
      "school_short": "Army",
      "world": "warner",
      "division": "D-IA"
    },
    "53070": {
      "school_short": "Wartburg",
      "world": "warner",
      "division": "D-III"
    },
    "53022": {
      "school_short": "Mary Hardin-Baylor",
      "world": "warner",
      "division": "D-III"
    },
    "52844": {
      "school_short": "Wisconsin",
      "world": "warner",
      "division": "D-IA"
    },
    "52641": {
      "school_short": "Ole Miss",
      "world": "warner",
      "division": "D-IA"
    },
    "52832": {
      "school_short": "West Virginia",
      "world": "warner",
      "division": "D-IA"
    },
    "53112": {
      "school_short": "Washington (MO)",
      "world": "warner",
      "division": "D-III"
    },
    "53367": {
      "school_short": "Bloomsburg",
      "world": "heisman",
      "division": "D-II"
    },
    "52812": {
      "school_short": "Miami (FL)",
      "world": "warner",
      "division": "D-IA"
    },
    "52646": {
      "school_short": "Navy",
      "world": "warner",
      "division": "D-IA"
    },
    "53203": {
      "school_short": "Washington and Lee",
      "world": "warner",
      "division": "D-III"
    },
    "52658": {
      "school_short": "Utah",
      "world": "warner",
      "division": "D-IA"
    },
    "53177": {
      "school_short": "Whitworth",
      "world": "warner",
      "division": "D-III"
    },
    "52908": {
      "school_short": "Western Kentucky",
      "world": "warner",
      "division": "D-IAA"
    },
    "53267": {
      "school_short": "Boise State",
      "world": "heisman",
      "division": "D-IA"
    },
    "52813": {
      "school_short": "Virginia Tech",
      "world": "warner",
      "division": "D-IA"
    },
    "52633": {
      "school_short": "Vanderbilt",
      "world": "warner",
      "division": "D-IA"
    },
    "52853": {
      "school_short": "Tulsa",
      "world": "warner",
      "division": "D-IA"
    },
    "53094": {
      "school_short": "Wilkes",
      "world": "warner",
      "division": "D-III"
    },
    "52876": {
      "school_short": "Oregon",
      "world": "warner",
      "division": "D-IA"
    },
    "52968": {
      "school_short": "Valparaiso",
      "world": "warner",
      "division": "D-IAA"
    },
    "52753": {
      "school_short": "West Liberty State",
      "world": "warner",
      "division": "D-II"
    },
    "52993": {
      "school_short": "Valdosta State",
      "world": "warner",
      "division": "D-II"
    },
    "53046": {
      "school_short": "Worcester Tech",
      "world": "warner",
      "division": "D-III"
    },
    "53385": {
      "school_short": "Adams State",
      "world": "heisman",
      "division": "D-II"
    },
    "53301": {
      "school_short": "Alabama State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53755": {
      "school_short": "Bates",
      "world": "heisman",
      "division": "D-III"
    },
    "53537": {
      "school_short": "Colgate",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53774": {
      "school_short": "Wooster",
      "world": "heisman",
      "division": "D-III"
    },
    "53345": {
      "school_short": "Bryant",
      "world": "heisman",
      "division": "D-II"
    },
    "53536": {
      "school_short": "Bucknell",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53576": {
      "school_short": "Butler",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53660": {
      "school_short": "Alfred",
      "world": "heisman",
      "division": "D-III"
    },
    "53349": {
      "school_short": "Assumption",
      "world": "heisman",
      "division": "D-II"
    },
    "53582": {
      "school_short": "Austin Peay",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53594": {
      "school_short": "Arkansas Tech",
      "world": "heisman",
      "division": "D-II"
    },
    "53235": {
      "school_short": "Wisconsin-Platteville",
      "world": "warner",
      "division": "D-III"
    },
    "53254": {
      "school_short": "Arkansas State",
      "world": "heisman",
      "division": "D-IA"
    },
    "52921": {
      "school_short": "Yale",
      "world": "warner",
      "division": "D-IAA"
    },
    "53701": {
      "school_short": "Albright",
      "world": "heisman",
      "division": "D-III"
    },
    "53404": {
      "school_short": "Benedict",
      "world": "heisman",
      "division": "D-II"
    },
    "53403": {
      "school_short": "Albany State",
      "world": "heisman",
      "division": "D-II"
    },
    "53035": {
      "school_short": "Ursinus",
      "world": "warner",
      "division": "D-III"
    },
    "53677": {
      "school_short": "Buena Vista",
      "world": "heisman",
      "division": "D-III"
    },
    "53784": {
      "school_short": "Case Western",
      "world": "heisman",
      "division": "D-III"
    },
    "53392": {
      "school_short": "Catawba",
      "world": "heisman",
      "division": "D-II"
    },
    "53558": {
      "school_short": "Central Connecticut",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53379": {
      "school_short": "Chadron State",
      "world": "heisman",
      "division": "D-II"
    },
    "53374": {
      "school_short": "Clarion",
      "world": "heisman",
      "division": "D-II"
    },
    "53750": {
      "school_short": "Colby",
      "world": "heisman",
      "division": "D-III"
    },
    "53538": {
      "school_short": "Holy Cross",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53672": {
      "school_short": "Concordia (IL)",
      "world": "heisman",
      "division": "D-III"
    },
    "53666": {
      "school_short": "Concordia (WI)",
      "world": "heisman",
      "division": "D-III"
    },
    "53361": {
      "school_short": "Concordia",
      "world": "heisman",
      "division": "D-II"
    },
    "53534": {
      "school_short": "Cornell",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53684": {
      "school_short": "Cornell",
      "world": "heisman",
      "division": "D-III"
    },
    "53373": {
      "school_short": "California (PA)",
      "world": "heisman",
      "division": "D-II"
    },
    "53731": {
      "school_short": "Carleton",
      "world": "heisman",
      "division": "D-III"
    },
    "53353": {
      "school_short": "Concord",
      "world": "heisman",
      "division": "D-II"
    },
    "53756": {
      "school_short": "Bowdoin",
      "world": "heisman",
      "division": "D-III"
    },
    "53481": {
      "school_short": "Bowling Green",
      "world": "heisman",
      "division": "D-IA"
    },
    "53809": {
      "school_short": "Bridgewater",
      "world": "heisman",
      "division": "D-III"
    },
    "53642": {
      "school_short": "Franklin & Marshall",
      "world": "heisman",
      "division": "D-III"
    },
    "53792": {
      "school_short": "Frostburg State",
      "world": "heisman",
      "division": "D-III"
    },
    "53737": {
      "school_short": "Curry",
      "world": "heisman",
      "division": "D-III"
    },
    "53583": {
      "school_short": "Davidson",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53808": {
      "school_short": "Defiance",
      "world": "heisman",
      "division": "D-III"
    },
    "53780": {
      "school_short": "Earlham",
      "world": "heisman",
      "division": "D-III"
    },
    "53248": {
      "school_short": "Auburn",
      "world": "heisman",
      "division": "D-IA"
    },
    "53426": {
      "school_short": "Boston",
      "world": "heisman",
      "division": "D-IA"
    },
    "53768": {
      "school_short": "Chapman",
      "world": "heisman",
      "division": "D-III"
    },
    "53344": {
      "school_short": "Bentley",
      "world": "heisman",
      "division": "D-II"
    },
    "53136": {
      "school_short": "Worcester State",
      "world": "warner",
      "division": "D-III"
    },
    "52909": {
      "school_short": "Youngstown State",
      "world": "warner",
      "division": "D-IAA"
    },
    "53635": {
      "school_short": "Austin",
      "world": "heisman",
      "division": "D-III"
    },
    "53528": {
      "school_short": "Brown",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53300": {
      "school_short": "Alabama A&M",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53816": {
      "school_short": "Anderson",
      "world": "heisman",
      "division": "D-III"
    },
    "53821": {
      "school_short": "Centre",
      "world": "heisman",
      "division": "D-III"
    },
    "53713": {
      "school_short": "Beloit",
      "world": "heisman",
      "division": "D-III"
    },
    "53529": {
      "school_short": "Columbia",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53690": {
      "school_short": "Albion",
      "world": "heisman",
      "division": "D-III"
    },
    "53727": {
      "school_short": "Concordia",
      "world": "heisman",
      "division": "D-III"
    },
    "53767": {
      "school_short": "Buffalo",
      "world": "heisman",
      "division": "D-III"
    },
    "53743": {
      "school_short": "Bridgewater State",
      "world": "heisman",
      "division": "D-III"
    },
    "53773": {
      "school_short": "Allegheny",
      "world": "heisman",
      "division": "D-III"
    },
    "53675": {
      "school_short": "Augustana (IL)",
      "world": "heisman",
      "division": "D-III"
    },
    "53438": {
      "school_short": "Baylor",
      "world": "heisman",
      "division": "D-IA"
    },
    "53683": {
      "school_short": "Coe",
      "world": "heisman",
      "division": "D-III"
    },
    "53450": {
      "school_short": "Colorado State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53807": {
      "school_short": "Mount St. Joseph",
      "world": "heisman",
      "division": "D-III"
    },
    "53194": {
      "school_short": "Wilmington (OH)",
      "world": "warner",
      "division": "D-III"
    },
    "53506": {
      "school_short": "Cal Poly",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53613": {
      "school_short": "Angelo State",
      "world": "heisman",
      "division": "D-II"
    },
    "53178": {
      "school_short": "Willamette",
      "world": "warner",
      "division": "D-III"
    },
    "53324": {
      "school_short": "Ashland",
      "world": "heisman",
      "division": "D-II"
    },
    "53045": {
      "school_short": "Western Connecticut State",
      "world": "warner",
      "division": "D-III"
    },
    "53834": {
      "school_short": "Christopher Newport",
      "world": "heisman",
      "division": "D-III"
    },
    "53606": {
      "school_short": "East Central",
      "world": "heisman",
      "division": "D-II"
    },
    "53542": {
      "school_short": "Delaware State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53564": {
      "school_short": "Eastern Illinois",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53614": {
      "school_short": "Eastern New Mexico",
      "world": "heisman",
      "division": "D-II"
    },
    "53791": {
      "school_short": "Eastern Oregon",
      "world": "heisman",
      "division": "D-III"
    },
    "53505": {
      "school_short": "Eastern Washington",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53811": {
      "school_short": "Emory and Henry",
      "world": "heisman",
      "division": "D-III"
    },
    "53619": {
      "school_short": "Emporia State",
      "world": "heisman",
      "division": "D-II"
    },
    "53738": {
      "school_short": "Endicott",
      "world": "heisman",
      "division": "D-III"
    },
    "53530": {
      "school_short": "Dartmouth",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53339": {
      "school_short": "Central Washington",
      "world": "heisman",
      "division": "D-II"
    },
    "53409": {
      "school_short": "Clark Atlanta",
      "world": "heisman",
      "division": "D-II"
    },
    "53278": {
      "school_short": "William & Mary",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53856": {
      "school_short": "Carthage",
      "world": "heisman",
      "division": "D-III"
    },
    "53839": {
      "school_short": "Chowan",
      "world": "heisman",
      "division": "D-III"
    },
    "53486": {
      "school_short": "Central Michigan",
      "world": "heisman",
      "division": "D-IA"
    },
    "53375": {
      "school_short": "Edinboro",
      "world": "heisman",
      "division": "D-II"
    },
    "53330": {
      "school_short": "Cheyney",
      "world": "heisman",
      "division": "D-II"
    },
    "53586": {
      "school_short": "Charleston Southern",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53822": {
      "school_short": "DePauw",
      "world": "heisman",
      "division": "D-III"
    },
    "53818": {
      "school_short": "Franklin",
      "world": "heisman",
      "division": "D-III"
    },
    "53678": {
      "school_short": "Central",
      "world": "heisman",
      "division": "D-III"
    },
    "53463": {
      "school_short": "East Carolina",
      "world": "heisman",
      "division": "D-IA"
    },
    "53313": {
      "school_short": "Elizabeth City",
      "world": "heisman",
      "division": "D-II"
    },
    "53641": {
      "school_short": "Dickinson",
      "world": "heisman",
      "division": "D-III"
    },
    "53386": {
      "school_short": "Fort Lewis",
      "world": "heisman",
      "division": "D-II"
    },
    "53759": {
      "school_short": "Framingham State",
      "world": "heisman",
      "division": "D-III"
    },
    "53317": {
      "school_short": "Gannon",
      "world": "heisman",
      "division": "D-II"
    },
    "53290": {
      "school_short": "Georgia Southern",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53295": {
      "school_short": "Elon",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53707": {
      "school_short": "Fairleigh Dickinson",
      "world": "heisman",
      "division": "D-III"
    },
    "53588": {
      "school_short": "Ferris State",
      "world": "heisman",
      "division": "D-II"
    },
    "53744": {
      "school_short": "Fitchburg State",
      "world": "heisman",
      "division": "D-III"
    },
    "53399": {
      "school_short": "Glenville",
      "world": "heisman",
      "division": "D-II"
    },
    "53702": {
      "school_short": "Delaware Valley",
      "world": "heisman",
      "division": "D-III"
    },
    "53600": {
      "school_short": "Delta State",
      "world": "heisman",
      "division": "D-II"
    },
    "53779": {
      "school_short": "Denison",
      "world": "heisman",
      "division": "D-III"
    },
    "53720": {
      "school_short": "Grinnell",
      "world": "heisman",
      "division": "D-III"
    },
    "53728": {
      "school_short": "Gustavus Adolphus",
      "world": "heisman",
      "division": "D-III"
    },
    "53595": {
      "school_short": "Harding",
      "world": "heisman",
      "division": "D-II"
    },
    "53661": {
      "school_short": "Hartwick",
      "world": "heisman",
      "division": "D-III"
    },
    "53601": {
      "school_short": "Henderson State",
      "world": "heisman",
      "division": "D-II"
    },
    "53781": {
      "school_short": "Hiram",
      "world": "heisman",
      "division": "D-III"
    },
    "53284": {
      "school_short": "Hofstra",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53631": {
      "school_short": "Howard Payne",
      "world": "heisman",
      "division": "D-III"
    },
    "53517": {
      "school_short": "Indiana State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53567": {
      "school_short": "Iona",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53799": {
      "school_short": "John Carroll",
      "world": "heisman",
      "division": "D-III"
    },
    "53708": {
      "school_short": "Juniata",
      "world": "heisman",
      "division": "D-III"
    },
    "53761": {
      "school_short": "Kean",
      "world": "heisman",
      "division": "D-III"
    },
    "53477": {
      "school_short": "Kent State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53775": {
      "school_short": "Kenyon",
      "world": "heisman",
      "division": "D-III"
    },
    "53721": {
      "school_short": "Knox",
      "world": "heisman",
      "division": "D-III"
    },
    "53722": {
      "school_short": "Lawrence",
      "world": "heisman",
      "division": "D-III"
    },
    "53312": {
      "school_short": "Bowie State",
      "world": "heisman",
      "division": "D-II"
    },
    "53577": {
      "school_short": "Drake",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53798": {
      "school_short": "Capital",
      "world": "heisman",
      "division": "D-III"
    },
    "53416": {
      "school_short": "Duke",
      "world": "heisman",
      "division": "D-IA"
    },
    "53703": {
      "school_short": "King`s",
      "world": "heisman",
      "division": "D-III"
    },
    "53480": {
      "school_short": "Eastern Michigan",
      "world": "heisman",
      "division": "D-IA"
    },
    "53510": {
      "school_short": "Idaho State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53810": {
      "school_short": "Catholic",
      "world": "heisman",
      "division": "D-III"
    },
    "53783": {
      "school_short": "Carnegie Mellon",
      "world": "heisman",
      "division": "D-III"
    },
    "53391": {
      "school_short": "Carson-Newman",
      "world": "heisman",
      "division": "D-II"
    },
    "53406": {
      "school_short": "Kentucky State",
      "world": "heisman",
      "division": "D-II"
    },
    "53639": {
      "school_short": "California Lutheran",
      "world": "heisman",
      "division": "D-III"
    },
    "53662": {
      "school_short": "Ithaca",
      "world": "heisman",
      "division": "D-III"
    },
    "53697": {
      "school_short": "Colorado",
      "world": "heisman",
      "division": "D-III"
    },
    "53504": {
      "school_short": "California State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53548": {
      "school_short": "Howard",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53587": {
      "school_short": "Coastal Carolina",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53272": {
      "school_short": "Fresno State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53643": {
      "school_short": "Gettysburg",
      "world": "heisman",
      "division": "D-III"
    },
    "53561": {
      "school_short": "Lafayette",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53719": {
      "school_short": "Carroll",
      "world": "heisman",
      "division": "D-III"
    },
    "53549": {
      "school_short": "Morgan State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53699": {
      "school_short": "Husson",
      "world": "heisman",
      "division": "D-III"
    },
    "54295": {
      "school_short": "Coe",
      "world": "dobie",
      "division": "D-III"
    },
    "53417": {
      "school_short": "Georgia Tech",
      "world": "heisman",
      "division": "D-IA"
    },
    "53303": {
      "school_short": "Jackson State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53570": {
      "school_short": "Eastern Kentucky",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53819": {
      "school_short": "Hanover",
      "world": "heisman",
      "division": "D-III"
    },
    "53539": {
      "school_short": "Fordham",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53735": {
      "school_short": "Grove City",
      "world": "heisman",
      "division": "D-III"
    },
    "53715": {
      "school_short": "Lake Forest",
      "world": "heisman",
      "division": "D-III"
    },
    "53503": {
      "school_short": "Florida Atlantic",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53427": {
      "school_short": "Kansas State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53692": {
      "school_short": "Hope",
      "world": "heisman",
      "division": "D-III"
    },
    "53835": {
      "school_short": "Ferrum",
      "world": "heisman",
      "division": "D-III"
    },
    "53376": {
      "school_short": "Indiana (PA)",
      "world": "heisman",
      "division": "D-II"
    },
    "53410": {
      "school_short": "Lane",
      "world": "heisman",
      "division": "D-II"
    },
    "53630": {
      "school_short": "Hardin-Simmons",
      "world": "heisman",
      "division": "D-III"
    },
    "53769": {
      "school_short": "Huntingdon",
      "world": "heisman",
      "division": "D-III"
    },
    "53421": {
      "school_short": "Florida State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53306": {
      "school_short": "Grambling State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53411": {
      "school_short": "Morehouse",
      "world": "heisman",
      "division": "D-II"
    },
    "53289": {
      "school_short": "Furman",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53524": {
      "school_short": "Florida International",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53544": {
      "school_short": "La Salle",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53709": {
      "school_short": "Lebanon Valley",
      "world": "heisman",
      "division": "D-III"
    },
    "53836": {
      "school_short": "Greensboro",
      "world": "heisman",
      "division": "D-III"
    },
    "53732": {
      "school_short": "Hamline",
      "world": "heisman",
      "division": "D-III"
    },
    "53813": {
      "school_short": "Hampden-Sydney",
      "world": "heisman",
      "division": "D-III"
    },
    "53547": {
      "school_short": "Hampton",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53648": {
      "school_short": "Hobart",
      "world": "heisman",
      "division": "D-III"
    },
    "53620": {
      "school_short": "Missouri Western State",
      "world": "heisman",
      "division": "D-II"
    },
    "53716": {
      "school_short": "Monmouth (IL)",
      "world": "heisman",
      "division": "D-III"
    },
    "53680": {
      "school_short": "Luther",
      "world": "heisman",
      "division": "D-III"
    },
    "53820": {
      "school_short": "Manchester",
      "world": "heisman",
      "division": "D-III"
    },
    "53804": {
      "school_short": "Marietta",
      "world": "heisman",
      "division": "D-III"
    },
    "53449": {
      "school_short": "Marquette",
      "world": "heisman",
      "division": "D-IA"
    },
    "53746": {
      "school_short": "Massachusetts Maritime",
      "world": "heisman",
      "division": "D-III"
    },
    "53297": {
      "school_short": "McNeese State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53326": {
      "school_short": "Mercyhurst",
      "world": "heisman",
      "division": "D-II"
    },
    "53387": {
      "school_short": "Mesa State",
      "world": "heisman",
      "division": "D-II"
    },
    "53475": {
      "school_short": "Miami (OH)",
      "world": "heisman",
      "division": "D-IA"
    },
    "53751": {
      "school_short": "Middlebury",
      "world": "heisman",
      "division": "D-III"
    },
    "53382": {
      "school_short": "Midwestern State",
      "world": "heisman",
      "division": "D-II"
    },
    "53250": {
      "school_short": "Mississippi State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53304": {
      "school_short": "Mississippi Valley State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53624": {
      "school_short": "Missouri Southern State",
      "world": "heisman",
      "division": "D-II"
    },
    "53762": {
      "school_short": "Montclair State",
      "world": "heisman",
      "division": "D-III"
    },
    "53710": {
      "school_short": "Moravian",
      "world": "heisman",
      "division": "D-III"
    },
    "53585": {
      "school_short": "Morehead State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53311": {
      "school_short": "Liberty",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53543": {
      "school_short": "Duquesne",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53405": {
      "school_short": "Fort Valley State",
      "world": "heisman",
      "division": "D-II"
    },
    "53668": {
      "school_short": "Greenville",
      "world": "heisman",
      "division": "D-III"
    },
    "53305": {
      "school_short": "Gardner-Webb",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53714": {
      "school_short": "Illinois",
      "world": "heisman",
      "division": "D-III"
    },
    "53560": {
      "school_short": "Georgetown",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53669": {
      "school_short": "Lakeland",
      "world": "heisman",
      "division": "D-III"
    },
    "53279": {
      "school_short": "James Madison",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53812": {
      "school_short": "Guilford",
      "world": "heisman",
      "division": "D-III"
    },
    "53432": {
      "school_short": "Iowa State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53452": {
      "school_short": "Michigan State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53674": {
      "school_short": "Illinois Wesleyan",
      "world": "heisman",
      "division": "D-III"
    },
    "53512": {
      "school_short": "Montana State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53354": {
      "school_short": "Fairmont State",
      "world": "heisman",
      "division": "D-II"
    },
    "53644": {
      "school_short": "Johns Hopkins",
      "world": "heisman",
      "division": "D-III"
    },
    "53757": {
      "school_short": "Hamilton",
      "world": "heisman",
      "division": "D-III"
    },
    "53249": {
      "school_short": "LSU",
      "world": "heisman",
      "division": "D-IA"
    },
    "53393": {
      "school_short": "Mars Hill",
      "world": "heisman",
      "division": "D-II"
    },
    "53584": {
      "school_short": "Jacksonville",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53704": {
      "school_short": "Lycoming",
      "world": "heisman",
      "division": "D-III"
    },
    "53531": {
      "school_short": "Harvard",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53325": {
      "school_short": "Grand Valley State",
      "world": "heisman",
      "division": "D-II"
    },
    "53793": {
      "school_short": "Menlo",
      "world": "heisman",
      "division": "D-III"
    },
    "53841": {
      "school_short": "Maryville",
      "world": "heisman",
      "division": "D-III"
    },
    "53786": {
      "school_short": "Linfield",
      "world": "heisman",
      "division": "D-III"
    },
    "53670": {
      "school_short": "MacMurray",
      "world": "heisman",
      "division": "D-III"
    },
    "53840": {
      "school_short": "Maranatha Baptist",
      "world": "heisman",
      "division": "D-III"
    },
    "53633": {
      "school_short": "McMurry",
      "world": "heisman",
      "division": "D-III"
    },
    "53853": {
      "school_short": "Millikin",
      "world": "heisman",
      "division": "D-III"
    },
    "53320": {
      "school_short": "Livingstone",
      "world": "heisman",
      "division": "D-II"
    },
    "53628": {
      "school_short": "Lock Haven",
      "world": "heisman",
      "division": "D-II"
    },
    "53568": {
      "school_short": "Marist",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53696": {
      "school_short": "Macalester",
      "world": "heisman",
      "division": "D-III"
    },
    "53371": {
      "school_short": "Millersville",
      "world": "heisman",
      "division": "D-II"
    },
    "53370": {
      "school_short": "Mansfield",
      "world": "heisman",
      "division": "D-II"
    },
    "53327": {
      "school_short": "Northern Michigan",
      "world": "heisman",
      "division": "D-II"
    },
    "53407": {
      "school_short": "Miles",
      "world": "heisman",
      "division": "D-II"
    },
    "53698": {
      "school_short": "Martin Luther",
      "world": "heisman",
      "division": "D-III"
    },
    "53590": {
      "school_short": "Michigan Tech",
      "world": "heisman",
      "division": "D-II"
    },
    "53552": {
      "school_short": "Monmouth",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53785": {
      "school_short": "Lewis and Clark",
      "world": "heisman",
      "division": "D-III"
    },
    "53645": {
      "school_short": "McDaniel",
      "world": "heisman",
      "division": "D-III"
    },
    "53507": {
      "school_short": "Portland State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53522": {
      "school_short": "Missouri State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53412": {
      "school_short": "Kentucky Wesleyan",
      "world": "heisman",
      "division": "D-II"
    },
    "53636": {
      "school_short": "Mississippi",
      "world": "heisman",
      "division": "D-III"
    },
    "53646": {
      "school_short": "Muhlenberg",
      "world": "heisman",
      "division": "D-III"
    },
    "53801": {
      "school_short": "Muskingum",
      "world": "heisman",
      "division": "D-III"
    },
    "53541": {
      "school_short": "Norfolk State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53794": {
      "school_short": "Principia",
      "world": "heisman",
      "division": "D-III"
    },
    "53285": {
      "school_short": "Northeastern",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53653": {
      "school_short": "Norwich",
      "world": "heisman",
      "division": "D-III"
    },
    "53776": {
      "school_short": "Oberlin",
      "world": "heisman",
      "division": "D-III"
    },
    "53802": {
      "school_short": "Ohio Northern",
      "world": "heisman",
      "division": "D-III"
    },
    "53457": {
      "school_short": "Ohio State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53458": {
      "school_short": "Penn State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53553": {
      "school_short": "Robert Morris",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53763": {
      "school_short": "Rowan",
      "world": "heisman",
      "division": "D-III"
    },
    "53383": {
      "school_short": "Oklahoma Panhandle",
      "world": "heisman",
      "division": "D-II"
    },
    "53422": {
      "school_short": "North Carolina State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53787": {
      "school_short": "Pacific Lutheran",
      "world": "heisman",
      "division": "D-III"
    },
    "53649": {
      "school_short": "Rensselaer Tech",
      "world": "heisman",
      "division": "D-III"
    },
    "53770": {
      "school_short": "Mount Ida",
      "world": "heisman",
      "division": "D-III"
    },
    "53328": {
      "school_short": "Saginaw Valley State",
      "world": "heisman",
      "division": "D-II"
    },
    "53351": {
      "school_short": "Saint Anselm",
      "world": "heisman",
      "division": "D-II"
    },
    "53740": {
      "school_short": "Salve Regina",
      "world": "heisman",
      "division": "D-III"
    },
    "53513": {
      "school_short": "Sam Houston State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53274": {
      "school_short": "San Jose State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53545": {
      "school_short": "Siena",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53347": {
      "school_short": "Merrimack",
      "world": "heisman",
      "division": "D-II"
    },
    "53266": {
      "school_short": "Louisiana Tech",
      "world": "heisman",
      "division": "D-IA"
    },
    "53745": {
      "school_short": "Maine Maritime",
      "world": "heisman",
      "division": "D-III"
    },
    "53679": {
      "school_short": "Loras",
      "world": "heisman",
      "division": "D-III"
    },
    "53782": {
      "school_short": "Ohio Wesleyan",
      "world": "heisman",
      "division": "D-III"
    },
    "53435": {
      "school_short": "Oklahoma State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53824": {
      "school_short": "Rhodes",
      "world": "heisman",
      "division": "D-III"
    },
    "53695": {
      "school_short": "Olivet",
      "world": "heisman",
      "division": "D-III"
    },
    "53460": {
      "school_short": "Indiana",
      "world": "heisman",
      "division": "D-IA"
    },
    "53459": {
      "school_short": "Purdue",
      "world": "heisman",
      "division": "D-IA"
    },
    "53837": {
      "school_short": "Methodist",
      "world": "heisman",
      "division": "D-III"
    },
    "53571": {
      "school_short": "Jacksonville State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53562": {
      "school_short": "Lehigh",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53805": {
      "school_short": "Otterbein",
      "world": "heisman",
      "division": "D-III"
    },
    "53299": {
      "school_short": "Northwestern State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53525": {
      "school_short": "Savannah State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53414": {
      "school_short": "Quincy",
      "world": "heisman",
      "division": "D-II"
    },
    "53825": {
      "school_short": "Rose-Hulman",
      "world": "heisman",
      "division": "D-III"
    },
    "53632": {
      "school_short": "Louisiana",
      "world": "heisman",
      "division": "D-III"
    },
    "53717": {
      "school_short": "Ripon",
      "world": "heisman",
      "division": "D-III"
    },
    "53319": {
      "school_short": "Johnson C. Smith",
      "world": "heisman",
      "division": "D-II"
    },
    "53739": {
      "school_short": "Nichols",
      "world": "heisman",
      "division": "D-III"
    },
    "53760": {
      "school_short": "MIT",
      "world": "heisman",
      "division": "D-III"
    },
    "53565": {
      "school_short": "Tennessee Tech",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53823": {
      "school_short": "Millsaps",
      "world": "heisman",
      "division": "D-III"
    },
    "53467": {
      "school_short": "Marshall",
      "world": "heisman",
      "division": "D-IA"
    },
    "53829": {
      "school_short": "Pomona-Pitzers",
      "world": "heisman",
      "division": "D-III"
    },
    "53453": {
      "school_short": "Northwestern",
      "world": "heisman",
      "division": "D-IA"
    },
    "53535": {
      "school_short": "Princeton",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53607": {
      "school_short": "Northeastern State",
      "world": "heisman",
      "division": "D-II"
    },
    "53554": {
      "school_short": "Sacred Heart",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53273": {
      "school_short": "San Diego State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53394": {
      "school_short": "Presbyterian",
      "world": "heisman",
      "division": "D-II"
    },
    "53400": {
      "school_short": "Shepherd",
      "world": "heisman",
      "division": "D-II"
    },
    "53362": {
      "school_short": "Northern State",
      "world": "heisman",
      "division": "D-II"
    },
    "53842": {
      "school_short": "Nebraska Wesleyan",
      "world": "heisman",
      "division": "D-III"
    },
    "53314": {
      "school_short": "Shaw",
      "world": "heisman",
      "division": "D-II"
    },
    "53596": {
      "school_short": "Ouachita Baptist",
      "world": "heisman",
      "division": "D-II"
    },
    "53487": {
      "school_short": "Oregon State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53398": {
      "school_short": "Newberry",
      "world": "heisman",
      "division": "D-II"
    },
    "53621": {
      "school_short": "Northwest Missouri State",
      "world": "heisman",
      "division": "D-II"
    },
    "53551": {
      "school_short": "SC State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53260": {
      "school_short": "New Mexico State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53526": {
      "school_short": "Southeastern Louisiana",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53348": {
      "school_short": "Southern Connecticut",
      "world": "heisman",
      "division": "D-II"
    },
    "53518": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53308": {
      "school_short": "Southern-Baton Rouge",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53322": {
      "school_short": "St. Augustine`s",
      "world": "heisman",
      "division": "D-II"
    },
    "53335": {
      "school_short": "St. Cloud State",
      "world": "heisman",
      "division": "D-II"
    },
    "53729": {
      "school_short": "St. John`s",
      "world": "heisman",
      "division": "D-III"
    },
    "53718": {
      "school_short": "St. Norbert",
      "world": "heisman",
      "division": "D-III"
    },
    "53575": {
      "school_short": "Tennessee State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53712": {
      "school_short": "Salisbury",
      "world": "heisman",
      "division": "D-III"
    },
    "53625": {
      "school_short": "Southwest Baptist",
      "world": "heisman",
      "division": "D-II"
    },
    "53659": {
      "school_short": "Springfield",
      "world": "heisman",
      "division": "D-III"
    },
    "53733": {
      "school_short": "St. Olaf",
      "world": "heisman",
      "division": "D-III"
    },
    "53514": {
      "school_short": "Stephen F. Austin",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53637": {
      "school_short": "Sul Ross State",
      "world": "heisman",
      "division": "D-III"
    },
    "53705": {
      "school_short": "Susquehanna",
      "world": "heisman",
      "division": "D-III"
    },
    "53559": {
      "school_short": "Saint Francis",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53838": {
      "school_short": "Shenandoah",
      "world": "heisman",
      "division": "D-III"
    },
    "53329": {
      "school_short": "Indianapolis",
      "world": "heisman",
      "division": "D-II"
    },
    "53616": {
      "school_short": "Texas A&M-Kingsville",
      "world": "heisman",
      "division": "D-II"
    },
    "53686": {
      "school_short": "Thiel",
      "world": "heisman",
      "division": "D-III"
    },
    "53843": {
      "school_short": "Thomas More",
      "world": "heisman",
      "division": "D-III"
    },
    "53265": {
      "school_short": "Troy State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53623": {
      "school_short": "Truman State",
      "world": "heisman",
      "division": "D-II"
    },
    "53656": {
      "school_short": "Merchant Marine",
      "world": "heisman",
      "division": "D-III"
    },
    "53651": {
      "school_short": "Union (NY)",
      "world": "heisman",
      "division": "D-III"
    },
    "53471": {
      "school_short": "Alabama Birmingham",
      "world": "heisman",
      "division": "D-IA"
    },
    "53251": {
      "school_short": "Alabama",
      "world": "heisman",
      "division": "D-IA"
    },
    "53252": {
      "school_short": "Arkansas",
      "world": "heisman",
      "division": "D-IA"
    },
    "53310": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53483": {
      "school_short": "Northern Illinois",
      "world": "heisman",
      "division": "D-IA"
    },
    "53765": {
      "school_short": "New Jersey",
      "world": "heisman",
      "division": "D-III"
    },
    "53681": {
      "school_short": "Simpson",
      "world": "heisman",
      "division": "D-III"
    },
    "53685": {
      "school_short": "Dubuque",
      "world": "heisman",
      "division": "D-III"
    },
    "53298": {
      "school_short": "Nicholls State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53464": {
      "school_short": "Rice",
      "world": "heisman",
      "division": "D-IA"
    },
    "53764": {
      "school_short": "Cortland",
      "world": "heisman",
      "division": "D-III"
    },
    "53334": {
      "school_short": "South Dakota State",
      "world": "heisman",
      "division": "D-II"
    },
    "53321": {
      "school_short": "North Carolina Central",
      "world": "heisman",
      "division": "D-II"
    },
    "53855": {
      "school_short": "North Park",
      "world": "heisman",
      "division": "D-III"
    },
    "53388": {
      "school_short": "New Mexico Highlands",
      "world": "heisman",
      "division": "D-II"
    },
    "53814": {
      "school_short": "Randolph-Macon",
      "world": "heisman",
      "division": "D-III"
    },
    "53610": {
      "school_short": "Tarleton State",
      "world": "heisman",
      "division": "D-II"
    },
    "53752": {
      "school_short": "Trinity",
      "world": "heisman",
      "division": "D-III"
    },
    "53591": {
      "school_short": "Northwood",
      "world": "heisman",
      "division": "D-II"
    },
    "53307": {
      "school_short": "Prairie View",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53333": {
      "school_short": "North Dakota State",
      "world": "heisman",
      "division": "D-II"
    },
    "53436": {
      "school_short": "Texas Tech",
      "world": "heisman",
      "division": "D-IA"
    },
    "53854": {
      "school_short": "North Central",
      "world": "heisman",
      "division": "D-III"
    },
    "53461": {
      "school_short": "Iowa",
      "world": "heisman",
      "division": "D-IA"
    },
    "53795": {
      "school_short": "Stillman",
      "world": "heisman",
      "division": "D-III"
    },
    "53470": {
      "school_short": "Tulane",
      "world": "heisman",
      "division": "D-IA"
    },
    "53479": {
      "school_short": "Buffalo",
      "world": "heisman",
      "division": "D-IA"
    },
    "53771": {
      "school_short": "Rockford",
      "world": "heisman",
      "division": "D-III"
    },
    "53572": {
      "school_short": "Murray State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53497": {
      "school_short": "Stanford",
      "world": "heisman",
      "division": "D-IA"
    },
    "53377": {
      "school_short": "Shippensburg",
      "world": "heisman",
      "division": "D-II"
    },
    "53573": {
      "school_short": "Samford",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53609": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "heisman",
      "division": "D-II"
    },
    "53555": {
      "school_short": "Stony Brook",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53527": {
      "school_short": "Southern Utah",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53603": {
      "school_short": "Arkansas-Monticello",
      "world": "heisman",
      "division": "D-II"
    },
    "53650": {
      "school_short": "St. Lawrence",
      "world": "heisman",
      "division": "D-III"
    },
    "53556": {
      "school_short": "Albany",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53350": {
      "school_short": "Pace",
      "world": "heisman",
      "division": "D-II"
    },
    "53291": {
      "school_short": "Citadel",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53446": {
      "school_short": "Cincinnati",
      "world": "heisman",
      "division": "D-IA"
    },
    "53515": {
      "school_short": "Texas State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53663": {
      "school_short": "St. John Fisher",
      "world": "heisman",
      "division": "D-III"
    },
    "53352": {
      "school_short": "Stonehill",
      "world": "heisman",
      "division": "D-II"
    },
    "53602": {
      "school_short": "Southern Arkansas",
      "world": "heisman",
      "division": "D-II"
    },
    "53569": {
      "school_short": "St. Peter`s",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53700": {
      "school_short": "Brockport",
      "world": "heisman",
      "division": "D-III"
    },
    "53256": {
      "school_short": "Louisiana Lafayette",
      "world": "heisman",
      "division": "D-IA"
    },
    "53408": {
      "school_short": "Tuskegee",
      "world": "heisman",
      "division": "D-II"
    },
    "53261": {
      "school_short": "Idaho",
      "world": "heisman",
      "division": "D-IA"
    },
    "53563": {
      "school_short": "Towson",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53476": {
      "school_short": "Akron",
      "world": "heisman",
      "division": "D-IA"
    },
    "53281": {
      "school_short": "Massachusetts",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53360": {
      "school_short": "Minnesota-Duluth",
      "world": "heisman",
      "division": "D-II"
    },
    "53264": {
      "school_short": "Montana",
      "world": "heisman",
      "division": "D-IA"
    },
    "53831": {
      "school_short": "Redlands",
      "world": "heisman",
      "division": "D-III"
    },
    "53502": {
      "school_short": "Richmond",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53447": {
      "school_short": "South Florida",
      "world": "heisman",
      "division": "D-IA"
    },
    "53500": {
      "school_short": "Tennessee",
      "world": "heisman",
      "division": "D-IA"
    },
    "53434": {
      "school_short": "Texas",
      "world": "heisman",
      "division": "D-IA"
    },
    "53848": {
      "school_short": "Wisconsin-River Falls",
      "world": "heisman",
      "division": "D-III"
    },
    "53433": {
      "school_short": "Oklahoma",
      "world": "heisman",
      "division": "D-IA"
    },
    "53336": {
      "school_short": "Nebraska-Omaha",
      "world": "heisman",
      "division": "D-II"
    },
    "53851": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "heisman",
      "division": "D-III"
    },
    "53611": {
      "school_short": "Central Oklahoma",
      "world": "heisman",
      "division": "D-II"
    },
    "53465": {
      "school_short": "Tulsa",
      "world": "heisman",
      "division": "D-IA"
    },
    "53830": {
      "school_short": "La Verne",
      "world": "heisman",
      "division": "D-III"
    },
    "53652": {
      "school_short": "Rochester",
      "world": "heisman",
      "division": "D-III"
    },
    "53419": {
      "school_short": "Virginia",
      "world": "heisman",
      "division": "D-IA"
    },
    "53282": {
      "school_short": "Rhode Island",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53466": {
      "school_short": "Memphis",
      "world": "heisman",
      "division": "D-IA"
    },
    "53429": {
      "school_short": "Missouri",
      "world": "heisman",
      "division": "D-IA"
    },
    "53598": {
      "school_short": "Central Arkansas",
      "world": "heisman",
      "division": "D-II"
    },
    "53509": {
      "school_short": "St. Mary`s",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53431": {
      "school_short": "Colorado",
      "world": "heisman",
      "division": "D-IA"
    },
    "53309": {
      "school_short": "Texas Southern",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53269": {
      "school_short": "New Mexico",
      "world": "heisman",
      "division": "D-IA"
    },
    "53634": {
      "school_short": "Mary Hardin-Baylor",
      "world": "heisman",
      "division": "D-III"
    },
    "53338": {
      "school_short": "South Dakota",
      "world": "heisman",
      "division": "D-II"
    },
    "53413": {
      "school_short": "Saint Joseph`s",
      "world": "heisman",
      "division": "D-II"
    },
    "53482": {
      "school_short": "Toledo",
      "world": "heisman",
      "division": "D-IA"
    },
    "53430": {
      "school_short": "Kansas",
      "world": "heisman",
      "division": "D-IA"
    },
    "53472": {
      "school_short": "Southern Methodist",
      "world": "heisman",
      "division": "D-IA"
    },
    "53599": {
      "school_short": "West Alabama",
      "world": "heisman",
      "division": "D-II"
    },
    "53441": {
      "school_short": "Temple",
      "world": "heisman",
      "division": "D-IA"
    },
    "53440": {
      "school_short": "Syracuse",
      "world": "heisman",
      "division": "D-IA"
    },
    "53608": {
      "school_short": "SE Oklahoma-Durant",
      "world": "heisman",
      "division": "D-II"
    },
    "53423": {
      "school_short": "Maryland",
      "world": "heisman",
      "division": "D-IA"
    },
    "53597": {
      "school_short": "West Georgia",
      "world": "heisman",
      "division": "D-II"
    },
    "53442": {
      "school_short": "Connecticut",
      "world": "heisman",
      "division": "D-IA"
    },
    "53489": {
      "school_short": "Washington",
      "world": "heisman",
      "division": "D-IA"
    },
    "53469": {
      "school_short": "Texas Christian",
      "world": "heisman",
      "division": "D-IA"
    },
    "53638": {
      "school_short": "Texas Lutheran",
      "world": "heisman",
      "division": "D-III"
    },
    "53826": {
      "school_short": "Trinity (TX)",
      "world": "heisman",
      "division": "D-III"
    },
    "53741": {
      "school_short": "UMass-Dartmouth",
      "world": "heisman",
      "division": "D-III"
    },
    "53455": {
      "school_short": "Minnesota",
      "world": "heisman",
      "division": "D-IA"
    },
    "53456": {
      "school_short": "Wisconsin",
      "world": "heisman",
      "division": "D-IA"
    },
    "53578": {
      "school_short": "Dayton",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53474": {
      "school_short": "Southern Mississippi",
      "world": "heisman",
      "division": "D-IA"
    },
    "53626": {
      "school_short": "Missouri-Rolla",
      "world": "heisman",
      "division": "D-II"
    },
    "53788": {
      "school_short": "Puget Sound",
      "world": "heisman",
      "division": "D-III"
    },
    "53730": {
      "school_short": "St. Thomas",
      "world": "heisman",
      "division": "D-III"
    },
    "53846": {
      "school_short": "Wisconsin-La Crosse",
      "world": "heisman",
      "division": "D-III"
    },
    "53520": {
      "school_short": "Western Kentucky",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53747": {
      "school_short": "Westfield State",
      "world": "heisman",
      "division": "D-III"
    },
    "53271": {
      "school_short": "Wyoming",
      "world": "heisman",
      "division": "D-IA"
    },
    "53451": {
      "school_short": "Illinois",
      "world": "heisman",
      "division": "D-IA"
    },
    "53395": {
      "school_short": "Tusculum",
      "world": "heisman",
      "division": "D-II"
    },
    "53523": {
      "school_short": "Northern Iowa",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53364": {
      "school_short": "Charleston",
      "world": "heisman",
      "division": "D-II"
    },
    "53468": {
      "school_short": "Central Florida",
      "world": "heisman",
      "division": "D-IA"
    },
    "53647": {
      "school_short": "Ursinus",
      "world": "heisman",
      "division": "D-III"
    },
    "53498": {
      "school_short": "Air Force",
      "world": "heisman",
      "division": "D-IA"
    },
    "53777": {
      "school_short": "Wabash",
      "world": "heisman",
      "division": "D-III"
    },
    "53557": {
      "school_short": "Wagner",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53420": {
      "school_short": "Wake Forest",
      "world": "heisman",
      "division": "D-IA"
    },
    "53789": {
      "school_short": "Whitworth",
      "world": "heisman",
      "division": "D-III"
    },
    "53401": {
      "school_short": "West Virginia Tech",
      "world": "heisman",
      "division": "D-II"
    },
    "53736": {
      "school_short": "Westminster (PA)",
      "world": "heisman",
      "division": "D-III"
    },
    "53772": {
      "school_short": "Wesley",
      "world": "heisman",
      "division": "D-III"
    },
    "53676": {
      "school_short": "Wheaton",
      "world": "heisman",
      "division": "D-III"
    },
    "53372": {
      "school_short": "West Chester",
      "world": "heisman",
      "division": "D-II"
    },
    "53292": {
      "school_short": "Western Carolina",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53519": {
      "school_short": "Western Illinois",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53484": {
      "school_short": "Western Michigan",
      "world": "heisman",
      "division": "D-IA"
    },
    "53742": {
      "school_short": "Western New England",
      "world": "heisman",
      "division": "D-III"
    },
    "53384": {
      "school_short": "Western New Mexico",
      "world": "heisman",
      "division": "D-II"
    },
    "53341": {
      "school_short": "Western Oregon",
      "world": "heisman",
      "division": "D-II"
    },
    "53390": {
      "school_short": "Western State (CO)",
      "world": "heisman",
      "division": "D-II"
    },
    "53832": {
      "school_short": "Whittier",
      "world": "heisman",
      "division": "D-III"
    },
    "53758": {
      "school_short": "Wesleyan",
      "world": "heisman",
      "division": "D-III"
    },
    "53581": {
      "school_short": "VMI",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53315": {
      "school_short": "Virginia State",
      "world": "heisman",
      "division": "D-II"
    },
    "53688": {
      "school_short": "Waynesburg",
      "world": "heisman",
      "division": "D-III"
    },
    "53849": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "heisman",
      "division": "D-III"
    },
    "53852": {
      "school_short": "Wisconsin-Stout",
      "world": "heisman",
      "division": "D-III"
    },
    "54303": {
      "school_short": "Alma",
      "world": "dobie",
      "division": "D-III"
    },
    "53966": {
      "school_short": "American International",
      "world": "dobie",
      "division": "D-II"
    },
    "53617": {
      "school_short": "West Texas A&M",
      "world": "heisman",
      "division": "D-II"
    },
    "53604": {
      "school_short": "North Alabama",
      "world": "heisman",
      "division": "D-II"
    },
    "53499": {
      "school_short": "Georgia",
      "world": "heisman",
      "division": "D-IA"
    },
    "53847": {
      "school_short": "Wisconsin-Platteville",
      "world": "heisman",
      "division": "D-III"
    },
    "53490": {
      "school_short": "Washington State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53532": {
      "school_short": "Pennsylvania",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54361": {
      "school_short": "Amherst",
      "world": "dobie",
      "division": "D-III"
    },
    "53605": {
      "school_short": "Valdosta State",
      "world": "heisman",
      "division": "D-II"
    },
    "53270": {
      "school_short": "Utah",
      "world": "heisman",
      "division": "D-IA"
    },
    "53363": {
      "school_short": "Wayne State",
      "world": "heisman",
      "division": "D-II"
    },
    "53257": {
      "school_short": "Louisiana Monroe",
      "world": "heisman",
      "division": "D-IA"
    },
    "53275": {
      "school_short": "UNLV",
      "world": "heisman",
      "division": "D-IA"
    },
    "53566": {
      "school_short": "Tennessee-Martin",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53711": {
      "school_short": "Widener",
      "world": "heisman",
      "division": "D-III"
    },
    "53454": {
      "school_short": "Michigan",
      "world": "heisman",
      "division": "D-IA"
    },
    "53850": {
      "school_short": "Wisconsin-Whitewater",
      "world": "heisman",
      "division": "D-III"
    },
    "53280": {
      "school_short": "Delaware",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53286": {
      "school_short": "Maine",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53277": {
      "school_short": "Nevada",
      "world": "heisman",
      "division": "D-IA"
    },
    "53418": {
      "school_short": "North Carolina",
      "world": "heisman",
      "division": "D-IA"
    },
    "53501": {
      "school_short": "Florida",
      "world": "heisman",
      "division": "D-IA"
    },
    "53428": {
      "school_short": "Nebraska",
      "world": "heisman",
      "division": "D-IA"
    },
    "53706": {
      "school_short": "Wilkes",
      "world": "heisman",
      "division": "D-III"
    },
    "53287": {
      "school_short": "New Hampshire",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53263": {
      "school_short": "Utah State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53508": {
      "school_short": "Weber State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53615": {
      "school_short": "Texas A&M-Commerce",
      "world": "heisman",
      "division": "D-II"
    },
    "53815": {
      "school_short": "Washington and Lee",
      "world": "heisman",
      "division": "D-III"
    },
    "53444": {
      "school_short": "West Virginia",
      "world": "heisman",
      "division": "D-IA"
    },
    "53724": {
      "school_short": "Washington (MO)",
      "world": "heisman",
      "division": "D-III"
    },
    "54272": {
      "school_short": "Alfred",
      "world": "dobie",
      "division": "D-III"
    },
    "53790": {
      "school_short": "Willamette",
      "world": "heisman",
      "division": "D-III"
    },
    "53365": {
      "school_short": "West Liberty State",
      "world": "heisman",
      "division": "D-II"
    },
    "53682": {
      "school_short": "Wartburg",
      "world": "heisman",
      "division": "D-III"
    },
    "53462": {
      "school_short": "Notre Dame",
      "world": "heisman",
      "division": "D-IA"
    },
    "53366": {
      "school_short": "West Virginia State",
      "world": "heisman",
      "division": "D-II"
    },
    "53337": {
      "school_short": "North Dakota",
      "world": "heisman",
      "division": "D-II"
    },
    "53342": {
      "school_short": "Western Washington",
      "world": "heisman",
      "division": "D-II"
    },
    "54385": {
      "school_short": "Allegheny",
      "world": "dobie",
      "division": "D-III"
    },
    "53844": {
      "school_short": "Westminster (MO)",
      "world": "heisman",
      "division": "D-III"
    },
    "54428": {
      "school_short": "Anderson",
      "world": "dobie",
      "division": "D-III"
    },
    "54208": {
      "school_short": "Angelo State",
      "world": "dobie",
      "division": "D-II"
    },
    "53913": {
      "school_short": "Auburn",
      "world": "dobie",
      "division": "D-IA"
    },
    "54225": {
      "school_short": "Augustana",
      "world": "dobie",
      "division": "D-II"
    },
    "54367": {
      "school_short": "Bates",
      "world": "dobie",
      "division": "D-III"
    },
    "53445": {
      "school_short": "Louisville",
      "world": "heisman",
      "division": "D-IA"
    },
    "53276": {
      "school_short": "Hawaii",
      "world": "heisman",
      "division": "D-IA"
    },
    "54050": {
      "school_short": "Baylor",
      "world": "dobie",
      "division": "D-IA"
    },
    "53978": {
      "school_short": "Bemidji State",
      "world": "dobie",
      "division": "D-II"
    },
    "54283": {
      "school_short": "Benedictine",
      "world": "dobie",
      "division": "D-III"
    },
    "53967": {
      "school_short": "Bentley",
      "world": "dobie",
      "division": "D-II"
    },
    "54133": {
      "school_short": "Bethune-Cookman",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54408": {
      "school_short": "Blackburn",
      "world": "dobie",
      "division": "D-III"
    },
    "53990": {
      "school_short": "Bloomsburg",
      "world": "dobie",
      "division": "D-II"
    },
    "54429": {
      "school_short": "Bluffton",
      "world": "dobie",
      "division": "D-III"
    },
    "54068": {
      "school_short": "Boise State",
      "world": "dobie",
      "division": "D-IA"
    },
    "53889": {
      "school_short": "Bowling Green",
      "world": "dobie",
      "division": "D-IA"
    },
    "53754": {
      "school_short": "Williams",
      "world": "heisman",
      "division": "D-III"
    },
    "53293": {
      "school_short": "Wofford",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53658": {
      "school_short": "Worcester Tech",
      "world": "heisman",
      "division": "D-III"
    },
    "53694": {
      "school_short": "Wisconsin Lutheran",
      "world": "heisman",
      "division": "D-III"
    },
    "53919": {
      "school_short": "Arkansas State",
      "world": "dobie",
      "division": "D-IA"
    },
    "53972": {
      "school_short": "Assumption",
      "world": "dobie",
      "division": "D-II"
    },
    "54301": {
      "school_short": "Adrian",
      "world": "dobie",
      "division": "D-III"
    },
    "53949": {
      "school_short": "Alabama A&M",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54263": {
      "school_short": "Albany State",
      "world": "dobie",
      "division": "D-II"
    },
    "54313": {
      "school_short": "Albright",
      "world": "dobie",
      "division": "D-III"
    },
    "53968": {
      "school_short": "Bryant",
      "world": "dobie",
      "division": "D-II"
    },
    "54422": {
      "school_short": "Catholic",
      "world": "dobie",
      "division": "D-III"
    },
    "54213": {
      "school_short": "Central Missouri State",
      "world": "dobie",
      "division": "D-II"
    },
    "54433": {
      "school_short": "Centre",
      "world": "dobie",
      "division": "D-III"
    },
    "54380": {
      "school_short": "Chapman",
      "world": "dobie",
      "division": "D-III"
    },
    "53935": {
      "school_short": "Charleston Southern",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54446": {
      "school_short": "Christopher Newport",
      "world": "dobie",
      "division": "D-III"
    },
    "54234": {
      "school_short": "Clarion",
      "world": "dobie",
      "division": "D-II"
    },
    "54027": {
      "school_short": "Clemson",
      "world": "dobie",
      "division": "D-IA"
    },
    "53396": {
      "school_short": "Wingate",
      "world": "heisman",
      "division": "D-II"
    },
    "54338": {
      "school_short": "Bethel",
      "world": "dobie",
      "division": "D-III"
    },
    "54451": {
      "school_short": "Chowan",
      "world": "dobie",
      "division": "D-III"
    },
    "53627": {
      "school_short": "Washburn-Topeka",
      "world": "heisman",
      "division": "D-II"
    },
    "54337": {
      "school_short": "Augsburg",
      "world": "dobie",
      "division": "D-III"
    },
    "53593": {
      "school_short": "Wayne State",
      "world": "heisman",
      "division": "D-II"
    },
    "54368": {
      "school_short": "Bowdoin",
      "world": "dobie",
      "division": "D-III"
    },
    "53951": {
      "school_short": "Alcorn State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54302": {
      "school_short": "Albion",
      "world": "dobie",
      "division": "D-III"
    },
    "53962": {
      "school_short": "Central Washington",
      "world": "dobie",
      "division": "D-II"
    },
    "53894": {
      "school_short": "Central Michigan",
      "world": "dobie",
      "division": "D-IA"
    },
    "53936": {
      "school_short": "Coastal Carolina",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53806": {
      "school_short": "Wilmington (OH)",
      "world": "heisman",
      "division": "D-III"
    },
    "54346": {
      "school_short": "Bethany",
      "world": "dobie",
      "division": "D-III"
    },
    "54409": {
      "school_short": "Baldwin-Wallace",
      "world": "dobie",
      "division": "D-III"
    },
    "54239": {
      "school_short": "Chadron State",
      "world": "dobie",
      "division": "D-II"
    },
    "53402": {
      "school_short": "West Virginia Wesleyan",
      "world": "heisman",
      "division": "D-II"
    },
    "54445": {
      "school_short": "Averett",
      "world": "dobie",
      "division": "D-III"
    },
    "54010": {
      "school_short": "Austin",
      "world": "dobie",
      "division": "D-III"
    },
    "54343": {
      "school_short": "Carleton",
      "world": "dobie",
      "division": "D-III"
    },
    "54245": {
      "school_short": "Adams State",
      "world": "dobie",
      "division": "D-II"
    },
    "53748": {
      "school_short": "Worcester State",
      "world": "heisman",
      "division": "D-III"
    },
    "54038": {
      "school_short": "Boston",
      "world": "dobie",
      "division": "D-IA"
    },
    "54410": {
      "school_short": "Capital",
      "world": "dobie",
      "division": "D-III"
    },
    "53827": {
      "school_short": "South-Sewanee",
      "world": "heisman",
      "division": "D-III"
    },
    "54207": {
      "school_short": "Abilene Christian",
      "world": "dobie",
      "division": "D-II"
    },
    "54287": {
      "school_short": "Augustana (IL)",
      "world": "dobie",
      "division": "D-III"
    },
    "54165": {
      "school_short": "Bowie State",
      "world": "dobie",
      "division": "D-II"
    },
    "53993": {
      "school_short": "Benedict",
      "world": "dobie",
      "division": "D-II"
    },
    "53283": {
      "school_short": "Villanova",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53687": {
      "school_short": "Washington and Jefferson",
      "world": "heisman",
      "division": "D-III"
    },
    "54290": {
      "school_short": "Central",
      "world": "dobie",
      "division": "D-III"
    },
    "53323": {
      "school_short": "Winston-Salem State",
      "world": "heisman",
      "division": "D-II"
    },
    "53893": {
      "school_short": "Ball State",
      "world": "dobie",
      "division": "D-IA"
    },
    "53950": {
      "school_short": "Alabama State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54115": {
      "school_short": "Brown",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54189": {
      "school_short": "Arkansas Tech",
      "world": "dobie",
      "division": "D-II"
    },
    "54362": {
      "school_short": "Colby",
      "world": "dobie",
      "division": "D-III"
    },
    "54124": {
      "school_short": "Colgate",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54125": {
      "school_short": "Holy Cross",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54386": {
      "school_short": "Wooster",
      "world": "dobie",
      "division": "D-III"
    },
    "54116": {
      "school_short": "Columbia",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53976": {
      "school_short": "Concord",
      "world": "dobie",
      "division": "D-II"
    },
    "54339": {
      "school_short": "Concordia",
      "world": "dobie",
      "division": "D-III"
    },
    "54284": {
      "school_short": "Concordia (IL)",
      "world": "dobie",
      "division": "D-III"
    },
    "53984": {
      "school_short": "Concordia",
      "world": "dobie",
      "division": "D-II"
    },
    "54349": {
      "school_short": "Curry",
      "world": "dobie",
      "division": "D-III"
    },
    "53932": {
      "school_short": "Davidson",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54129": {
      "school_short": "Delaware State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54296": {
      "school_short": "Cornell",
      "world": "dobie",
      "division": "D-III"
    },
    "54145": {
      "school_short": "Central Connecticut",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54421": {
      "school_short": "Bridgewater",
      "world": "dobie",
      "division": "D-III"
    },
    "54355": {
      "school_short": "Bridgewater State",
      "world": "dobie",
      "division": "D-III"
    },
    "54289": {
      "school_short": "Buena Vista",
      "world": "dobie",
      "division": "D-III"
    },
    "54379": {
      "school_short": "Buffalo",
      "world": "dobie",
      "division": "D-III"
    },
    "53925": {
      "school_short": "Butler",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54331": {
      "school_short": "Carroll",
      "world": "dobie",
      "division": "D-III"
    },
    "54251": {
      "school_short": "Carson-Newman",
      "world": "dobie",
      "division": "D-II"
    },
    "54468": {
      "school_short": "Carthage",
      "world": "dobie",
      "division": "D-III"
    },
    "54314": {
      "school_short": "Delaware Valley",
      "world": "dobie",
      "division": "D-III"
    },
    "54391": {
      "school_short": "Denison",
      "world": "dobie",
      "division": "D-III"
    },
    "54201": {
      "school_short": "East Central",
      "world": "dobie",
      "division": "D-II"
    },
    "54004": {
      "school_short": "East Texas Baptist",
      "world": "dobie",
      "division": "D-III"
    },
    "54235": {
      "school_short": "Edinboro",
      "world": "dobie",
      "division": "D-II"
    },
    "54166": {
      "school_short": "Elizabeth City",
      "world": "dobie",
      "division": "D-II"
    },
    "53944": {
      "school_short": "Elon",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54214": {
      "school_short": "Emporia State",
      "world": "dobie",
      "division": "D-II"
    },
    "54350": {
      "school_short": "Endicott",
      "world": "dobie",
      "division": "D-III"
    },
    "54171": {
      "school_short": "Fayetteville State",
      "world": "dobie",
      "division": "D-II"
    },
    "54183": {
      "school_short": "Ferris State",
      "world": "dobie",
      "division": "D-II"
    },
    "54447": {
      "school_short": "Ferrum",
      "world": "dobie",
      "division": "D-III"
    },
    "54111": {
      "school_short": "Florida International",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53994": {
      "school_short": "Fort Valley State",
      "world": "dobie",
      "division": "D-II"
    },
    "54017": {
      "school_short": "Franklin & Marshall",
      "world": "dobie",
      "division": "D-III"
    },
    "54404": {
      "school_short": "Frostburg State",
      "world": "dobie",
      "division": "D-III"
    },
    "54170": {
      "school_short": "Gannon",
      "world": "dobie",
      "division": "D-II"
    },
    "53954": {
      "school_short": "Gardner-Webb",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53955": {
      "school_short": "Grambling State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53533": {
      "school_short": "Yale",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54420": {
      "school_short": "Defiance",
      "world": "dobie",
      "division": "D-III"
    },
    "53900": {
      "school_short": "BYU",
      "world": "dobie",
      "division": "D-IA"
    },
    "54277": {
      "school_short": "Aurora",
      "world": "dobie",
      "division": "D-III"
    },
    "54430": {
      "school_short": "Franklin",
      "world": "dobie",
      "division": "D-III"
    },
    "53998": {
      "school_short": "Clark Atlanta",
      "world": "dobie",
      "division": "D-II"
    },
    "54195": {
      "school_short": "Delta State",
      "world": "dobie",
      "division": "D-II"
    },
    "54246": {
      "school_short": "Fort Lewis",
      "world": "dobie",
      "division": "D-II"
    },
    "54278": {
      "school_short": "Concordia (WI)",
      "world": "dobie",
      "division": "D-III"
    },
    "54073": {
      "school_short": "Fresno State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54015": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "dobie",
      "division": "D-III"
    },
    "54285": {
      "school_short": "Elmhurst",
      "world": "dobie",
      "division": "D-III"
    },
    "54356": {
      "school_short": "Fitchburg State",
      "world": "dobie",
      "division": "D-III"
    },
    "54177": {
      "school_short": "Ashland",
      "world": "dobie",
      "division": "D-II"
    },
    "54241": {
      "school_short": "Fort Hays State",
      "world": "dobie",
      "division": "D-II"
    },
    "54029": {
      "school_short": "Georgia Tech",
      "world": "dobie",
      "division": "D-IA"
    },
    "53977": {
      "school_short": "Fairmont State",
      "world": "dobie",
      "division": "D-II"
    },
    "54117": {
      "school_short": "Dartmouth",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53901": {
      "school_short": "Arizona State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54259": {
      "school_short": "Glenville",
      "world": "dobie",
      "division": "D-II"
    },
    "53937": {
      "school_short": "Appalachian State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54325": {
      "school_short": "Beloit",
      "world": "dobie",
      "division": "D-III"
    },
    "54434": {
      "school_short": "DePauw",
      "world": "dobie",
      "division": "D-III"
    },
    "54395": {
      "school_short": "Carnegie Mellon",
      "world": "dobie",
      "division": "D-III"
    },
    "54127": {
      "school_short": "Florida A&M",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54209": {
      "school_short": "Eastern New Mexico",
      "world": "dobie",
      "division": "D-II"
    },
    "54423": {
      "school_short": "Emory and Henry",
      "world": "dobie",
      "division": "D-III"
    },
    "53858": {
      "school_short": "Colorado State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54240": {
      "school_short": "Colorado School of Mines",
      "world": "dobie",
      "division": "D-II"
    },
    "53938": {
      "school_short": "Furman",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54091": {
      "school_short": "California State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54123": {
      "school_short": "Bucknell",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54392": {
      "school_short": "Earlham",
      "world": "dobie",
      "division": "D-III"
    },
    "53888": {
      "school_short": "Eastern Michigan",
      "world": "dobie",
      "division": "D-IA"
    },
    "54371": {
      "school_short": "Framingham State",
      "world": "dobie",
      "division": "D-III"
    },
    "54332": {
      "school_short": "Grinnell",
      "world": "dobie",
      "division": "D-III"
    },
    "54028": {
      "school_short": "Duke",
      "world": "dobie",
      "division": "D-IA"
    },
    "54403": {
      "school_short": "Eastern Oregon",
      "world": "dobie",
      "division": "D-III"
    },
    "54319": {
      "school_short": "Fairleigh Dickinson",
      "world": "dobie",
      "division": "D-III"
    },
    "54425": {
      "school_short": "Hampden-Sydney",
      "world": "dobie",
      "division": "D-III"
    },
    "54134": {
      "school_short": "Hampton",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54431": {
      "school_short": "Hanover",
      "world": "dobie",
      "division": "D-III"
    },
    "54393": {
      "school_short": "Hiram",
      "world": "dobie",
      "division": "D-III"
    },
    "54190": {
      "school_short": "Harding",
      "world": "dobie",
      "division": "D-II"
    },
    "54005": {
      "school_short": "Hardin-Simmons",
      "world": "dobie",
      "division": "D-III"
    },
    "54085": {
      "school_short": "Hofstra",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54304": {
      "school_short": "Hope",
      "world": "dobie",
      "division": "D-III"
    },
    "54006": {
      "school_short": "Howard Payne",
      "world": "dobie",
      "division": "D-III"
    },
    "54103": {
      "school_short": "Illinois State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54104": {
      "school_short": "Indiana State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54236": {
      "school_short": "Indiana (PA)",
      "world": "dobie",
      "division": "D-II"
    },
    "53868": {
      "school_short": "Indiana",
      "world": "dobie",
      "division": "D-IA"
    },
    "54154": {
      "school_short": "Iona",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54274": {
      "school_short": "Ithaca",
      "world": "dobie",
      "division": "D-III"
    },
    "53952": {
      "school_short": "Jackson State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54080": {
      "school_short": "James Madison",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54172": {
      "school_short": "Johnson C. Smith",
      "world": "dobie",
      "division": "D-II"
    },
    "54320": {
      "school_short": "Juniata",
      "world": "dobie",
      "division": "D-III"
    },
    "54039": {
      "school_short": "Kansas State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54001": {
      "school_short": "Kentucky Wesleyan",
      "world": "dobie",
      "division": "D-II"
    },
    "54333": {
      "school_short": "Knox",
      "world": "dobie",
      "division": "D-III"
    },
    "54148": {
      "school_short": "Lafayette",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54281": {
      "school_short": "Lakeland",
      "world": "dobie",
      "division": "D-III"
    },
    "53999": {
      "school_short": "Lane",
      "world": "dobie",
      "division": "D-II"
    },
    "54321": {
      "school_short": "Lebanon Valley",
      "world": "dobie",
      "division": "D-III"
    },
    "54397": {
      "school_short": "Lewis and Clark",
      "world": "dobie",
      "division": "D-III"
    },
    "54164": {
      "school_short": "Liberty",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54223": {
      "school_short": "Lock Haven",
      "world": "dobie",
      "division": "D-II"
    },
    "54311": {
      "school_short": "Husson",
      "world": "dobie",
      "division": "D-III"
    },
    "54398": {
      "school_short": "Linfield",
      "world": "dobie",
      "division": "D-III"
    },
    "54340": {
      "school_short": "Gustavus Adolphus",
      "world": "dobie",
      "division": "D-III"
    },
    "54344": {
      "school_short": "Hamline",
      "world": "dobie",
      "division": "D-III"
    },
    "54118": {
      "school_short": "Harvard",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54415": {
      "school_short": "Heidelberg",
      "world": "dobie",
      "division": "D-III"
    },
    "54196": {
      "school_short": "Henderson State",
      "world": "dobie",
      "division": "D-II"
    },
    "54135": {
      "school_short": "Howard",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54381": {
      "school_short": "Huntingdon",
      "world": "dobie",
      "division": "D-III"
    },
    "54097": {
      "school_short": "Idaho State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54334": {
      "school_short": "Lawrence",
      "world": "dobie",
      "division": "D-III"
    },
    "54257": {
      "school_short": "Lenoir-Rhyne",
      "world": "dobie",
      "division": "D-II"
    },
    "54369": {
      "school_short": "Hamilton",
      "world": "dobie",
      "division": "D-III"
    },
    "54178": {
      "school_short": "Grand Valley State",
      "world": "dobie",
      "division": "D-II"
    },
    "53871": {
      "school_short": "East Carolina",
      "world": "dobie",
      "division": "D-IA"
    },
    "53885": {
      "school_short": "Kent State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54396": {
      "school_short": "Case Western",
      "world": "dobie",
      "division": "D-III"
    },
    "54279": {
      "school_short": "Eureka",
      "world": "dobie",
      "division": "D-III"
    },
    "54280": {
      "school_short": "Greenville",
      "world": "dobie",
      "division": "D-III"
    },
    "54093": {
      "school_short": "Cal Poly",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53969": {
      "school_short": "Long Island",
      "world": "dobie",
      "division": "D-II"
    },
    "54184": {
      "school_short": "Hillsdale",
      "world": "dobie",
      "division": "D-II"
    },
    "54347": {
      "school_short": "Grove City",
      "world": "dobie",
      "division": "D-III"
    },
    "54131": {
      "school_short": "La Salle",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53991": {
      "school_short": "East Stroudsburg",
      "world": "dobie",
      "division": "D-II"
    },
    "54315": {
      "school_short": "King`s",
      "world": "dobie",
      "division": "D-III"
    },
    "54033": {
      "school_short": "Florida State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54327": {
      "school_short": "Lake Forest",
      "world": "dobie",
      "division": "D-III"
    },
    "54044": {
      "school_short": "Iowa State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54309": {
      "school_short": "Colorado",
      "world": "dobie",
      "division": "D-III"
    },
    "53933": {
      "school_short": "Jacksonville",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54273": {
      "school_short": "Hartwick",
      "world": "dobie",
      "division": "D-III"
    },
    "54252": {
      "school_short": "Catawba",
      "world": "dobie",
      "division": "D-II"
    },
    "54286": {
      "school_short": "Illinois Wesleyan",
      "world": "dobie",
      "division": "D-III"
    },
    "54305": {
      "school_short": "Kalamazoo",
      "world": "dobie",
      "division": "D-III"
    },
    "53926": {
      "school_short": "Drake",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54387": {
      "school_short": "Kenyon",
      "world": "dobie",
      "division": "D-III"
    },
    "54016": {
      "school_short": "Dickinson",
      "world": "dobie",
      "division": "D-III"
    },
    "54158": {
      "school_short": "Jacksonville State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54373": {
      "school_short": "Kean",
      "world": "dobie",
      "division": "D-III"
    },
    "54092": {
      "school_short": "Eastern Washington",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53995": {
      "school_short": "Kentucky State",
      "world": "dobie",
      "division": "D-II"
    },
    "54326": {
      "school_short": "Illinois",
      "world": "dobie",
      "division": "D-III"
    },
    "54310": {
      "school_short": "Martin Luther",
      "world": "dobie",
      "division": "D-III"
    },
    "54020": {
      "school_short": "McDaniel",
      "world": "dobie",
      "division": "D-III"
    },
    "54405": {
      "school_short": "Menlo",
      "world": "dobie",
      "division": "D-III"
    },
    "53883": {
      "school_short": "Miami (OH)",
      "world": "dobie",
      "division": "D-IA"
    },
    "53920": {
      "school_short": "Middle Tennessee State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54363": {
      "school_short": "Middlebury",
      "world": "dobie",
      "division": "D-III"
    },
    "54242": {
      "school_short": "Midwestern State",
      "world": "dobie",
      "division": "D-II"
    },
    "53996": {
      "school_short": "Miles",
      "world": "dobie",
      "division": "D-II"
    },
    "54231": {
      "school_short": "Millersville",
      "world": "dobie",
      "division": "D-II"
    },
    "54465": {
      "school_short": "Millikin",
      "world": "dobie",
      "division": "D-III"
    },
    "53979": {
      "school_short": "Minnesota State-Moorhead",
      "world": "dobie",
      "division": "D-II"
    },
    "53915": {
      "school_short": "Mississippi State",
      "world": "dobie",
      "division": "D-IA"
    },
    "53953": {
      "school_short": "Mississippi Valley State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54215": {
      "school_short": "Missouri Western State",
      "world": "dobie",
      "division": "D-II"
    },
    "54328": {
      "school_short": "Monmouth (IL)",
      "world": "dobie",
      "division": "D-III"
    },
    "54099": {
      "school_short": "Montana State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54374": {
      "school_short": "Montclair State",
      "world": "dobie",
      "division": "D-III"
    },
    "54000": {
      "school_short": "Morehouse",
      "world": "dobie",
      "division": "D-II"
    },
    "54382": {
      "school_short": "Mount Ida",
      "world": "dobie",
      "division": "D-III"
    },
    "54021": {
      "school_short": "Muhlenberg",
      "world": "dobie",
      "division": "D-III"
    },
    "54159": {
      "school_short": "Murray State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54454": {
      "school_short": "Nebraska Wesleyan",
      "world": "dobie",
      "division": "D-III"
    },
    "54248": {
      "school_short": "New Mexico Highlands",
      "world": "dobie",
      "division": "D-II"
    },
    "54357": {
      "school_short": "Maine Maritime",
      "world": "dobie",
      "division": "D-III"
    },
    "54358": {
      "school_short": "Massachusetts Maritime",
      "world": "dobie",
      "division": "D-III"
    },
    "54179": {
      "school_short": "Mercyhurst",
      "world": "dobie",
      "division": "D-II"
    },
    "54449": {
      "school_short": "Methodist",
      "world": "dobie",
      "division": "D-III"
    },
    "54185": {
      "school_short": "Michigan Tech",
      "world": "dobie",
      "division": "D-II"
    },
    "54322": {
      "school_short": "Moravian",
      "world": "dobie",
      "division": "D-III"
    },
    "54291": {
      "school_short": "Loras",
      "world": "dobie",
      "division": "D-III"
    },
    "54007": {
      "school_short": "Louisiana",
      "world": "dobie",
      "division": "D-III"
    },
    "54416": {
      "school_short": "Marietta",
      "world": "dobie",
      "division": "D-III"
    },
    "54155": {
      "school_short": "Marist",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53857": {
      "school_short": "Marquette",
      "world": "dobie",
      "division": "D-IA"
    },
    "54329": {
      "school_short": "Ripon",
      "world": "dobie",
      "division": "D-III"
    },
    "54227": {
      "school_short": "North Dakota State",
      "world": "dobie",
      "division": "D-II"
    },
    "54467": {
      "school_short": "North Park",
      "world": "dobie",
      "division": "D-III"
    },
    "53948": {
      "school_short": "Northwestern State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53861": {
      "school_short": "Northwestern",
      "world": "dobie",
      "division": "D-IA"
    },
    "54186": {
      "school_short": "Northwood",
      "world": "dobie",
      "division": "D-II"
    },
    "54202": {
      "school_short": "Northeastern State",
      "world": "dobie",
      "division": "D-II"
    },
    "54265": {
      "school_short": "Norwich",
      "world": "dobie",
      "division": "D-III"
    },
    "54388": {
      "school_short": "Oberlin",
      "world": "dobie",
      "division": "D-III"
    },
    "54440": {
      "school_short": "Occidental",
      "world": "dobie",
      "division": "D-III"
    },
    "54414": {
      "school_short": "Ohio Northern",
      "world": "dobie",
      "division": "D-III"
    },
    "54047": {
      "school_short": "Oklahoma State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54307": {
      "school_short": "Olivet",
      "world": "dobie",
      "division": "D-III"
    },
    "53895": {
      "school_short": "Oregon State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54417": {
      "school_short": "Otterbein",
      "world": "dobie",
      "division": "D-III"
    },
    "54247": {
      "school_short": "Mesa State",
      "world": "dobie",
      "division": "D-II"
    },
    "54011": {
      "school_short": "Mississippi",
      "world": "dobie",
      "division": "D-III"
    },
    "53970": {
      "school_short": "Merrimack",
      "world": "dobie",
      "division": "D-II"
    },
    "54008": {
      "school_short": "McMurry",
      "world": "dobie",
      "division": "D-III"
    },
    "53875": {
      "school_short": "Marshall",
      "world": "dobie",
      "division": "D-IA"
    },
    "54453": {
      "school_short": "Maryville",
      "world": "dobie",
      "division": "D-III"
    },
    "54018": {
      "school_short": "Gettysburg",
      "world": "dobie",
      "division": "D-III"
    },
    "54141": {
      "school_short": "Sacred Heart",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54292": {
      "school_short": "Luther",
      "world": "dobie",
      "division": "D-III"
    },
    "54412": {
      "school_short": "Mount Union",
      "world": "dobie",
      "division": "D-III"
    },
    "54067": {
      "school_short": "Louisiana Tech",
      "world": "dobie",
      "division": "D-IA"
    },
    "54424": {
      "school_short": "Guilford",
      "world": "dobie",
      "division": "D-III"
    },
    "54435": {
      "school_short": "Millsaps",
      "world": "dobie",
      "division": "D-III"
    },
    "54019": {
      "school_short": "Johns Hopkins",
      "world": "dobie",
      "division": "D-III"
    },
    "54139": {
      "school_short": "Monmouth",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54372": {
      "school_short": "MIT",
      "world": "dobie",
      "division": "D-III"
    },
    "54308": {
      "school_short": "Macalester",
      "world": "dobie",
      "division": "D-III"
    },
    "54448": {
      "school_short": "Greensboro",
      "world": "dobie",
      "division": "D-III"
    },
    "54126": {
      "school_short": "Fordham",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54136": {
      "school_short": "Morgan State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54149": {
      "school_short": "Lehigh",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54432": {
      "school_short": "Manchester",
      "world": "dobie",
      "division": "D-III"
    },
    "53865": {
      "school_short": "Ohio State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54452": {
      "school_short": "Maranatha Baptist",
      "world": "dobie",
      "division": "D-III"
    },
    "54230": {
      "school_short": "Mansfield",
      "world": "dobie",
      "division": "D-II"
    },
    "54191": {
      "school_short": "Ouachita Baptist",
      "world": "dobie",
      "division": "D-II"
    },
    "53973": {
      "school_short": "Pace",
      "world": "dobie",
      "division": "D-II"
    },
    "54399": {
      "school_short": "Pacific Lutheran",
      "world": "dobie",
      "division": "D-III"
    },
    "53866": {
      "school_short": "Penn State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54217": {
      "school_short": "Pittsburg State",
      "world": "dobie",
      "division": "D-II"
    },
    "54254": {
      "school_short": "Presbyterian",
      "world": "dobie",
      "division": "D-II"
    },
    "54406": {
      "school_short": "Principia",
      "world": "dobie",
      "division": "D-III"
    },
    "54003": {
      "school_short": "Quincy",
      "world": "dobie",
      "division": "D-II"
    },
    "54024": {
      "school_short": "Rensselaer Tech",
      "world": "dobie",
      "division": "D-III"
    },
    "53872": {
      "school_short": "Rice",
      "world": "dobie",
      "division": "D-IA"
    },
    "54383": {
      "school_short": "Rockford",
      "world": "dobie",
      "division": "D-III"
    },
    "53974": {
      "school_short": "Saint Anselm",
      "world": "dobie",
      "division": "D-II"
    },
    "54146": {
      "school_short": "Saint Francis",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54243": {
      "school_short": "Oklahoma Panhandle",
      "world": "dobie",
      "division": "D-II"
    },
    "54437": {
      "school_short": "Rose-Hulman",
      "world": "dobie",
      "division": "D-III"
    },
    "54394": {
      "school_short": "Ohio Wesleyan",
      "world": "dobie",
      "division": "D-III"
    },
    "53867": {
      "school_short": "Purdue",
      "world": "dobie",
      "division": "D-IA"
    },
    "54181": {
      "school_short": "Saginaw Valley State",
      "world": "dobie",
      "division": "D-II"
    },
    "54061": {
      "school_short": "New Mexico State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54351": {
      "school_short": "Nichols",
      "world": "dobie",
      "division": "D-III"
    },
    "54128": {
      "school_short": "Norfolk State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54174": {
      "school_short": "North Carolina Central",
      "world": "dobie",
      "division": "D-II"
    },
    "54466": {
      "school_short": "North Central",
      "world": "dobie",
      "division": "D-III"
    },
    "54086": {
      "school_short": "Northeastern",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54180": {
      "school_short": "Northern Michigan",
      "world": "dobie",
      "division": "D-II"
    },
    "53985": {
      "school_short": "Northern State",
      "world": "dobie",
      "division": "D-II"
    },
    "54216": {
      "school_short": "Northwest Missouri State",
      "world": "dobie",
      "division": "D-II"
    },
    "53886": {
      "school_short": "Ohio",
      "world": "dobie",
      "division": "D-IA"
    },
    "54112": {
      "school_short": "Savannah State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54167": {
      "school_short": "Shaw",
      "world": "dobie",
      "division": "D-II"
    },
    "54450": {
      "school_short": "Shenandoah",
      "world": "dobie",
      "division": "D-III"
    },
    "54237": {
      "school_short": "Shippensburg",
      "world": "dobie",
      "division": "D-II"
    },
    "54132": {
      "school_short": "Siena",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54312": {
      "school_short": "Brockport",
      "world": "dobie",
      "division": "D-III"
    },
    "54352": {
      "school_short": "Salve Regina",
      "world": "dobie",
      "division": "D-III"
    },
    "54161": {
      "school_short": "Southeast Missouri State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54113": {
      "school_short": "Southeastern Louisiana",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54203": {
      "school_short": "SE Oklahoma-Durant",
      "world": "dobie",
      "division": "D-II"
    },
    "54197": {
      "school_short": "Southern Arkansas",
      "world": "dobie",
      "division": "D-II"
    },
    "54114": {
      "school_short": "Southern Utah",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54220": {
      "school_short": "Southwest Baptist",
      "world": "dobie",
      "division": "D-II"
    },
    "54271": {
      "school_short": "Springfield",
      "world": "dobie",
      "division": "D-III"
    },
    "54229": {
      "school_short": "St. Cloud State",
      "world": "dobie",
      "division": "D-II"
    },
    "54341": {
      "school_short": "St. John`s",
      "world": "dobie",
      "division": "D-III"
    },
    "54025": {
      "school_short": "St. Lawrence",
      "world": "dobie",
      "division": "D-III"
    },
    "54330": {
      "school_short": "St. Norbert",
      "world": "dobie",
      "division": "D-III"
    },
    "54156": {
      "school_short": "St. Peter`s",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53891": {
      "school_short": "Northern Illinois",
      "world": "dobie",
      "division": "D-IA"
    },
    "54122": {
      "school_short": "Princeton",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54175": {
      "school_short": "St. Augustine`s",
      "world": "dobie",
      "division": "D-II"
    },
    "54137": {
      "school_short": "NC A&T",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54441": {
      "school_short": "Pomona-Pitzers",
      "world": "dobie",
      "division": "D-III"
    },
    "54316": {
      "school_short": "Lycoming",
      "world": "dobie",
      "division": "D-III"
    },
    "53975": {
      "school_short": "Stonehill",
      "world": "dobie",
      "division": "D-II"
    },
    "54275": {
      "school_short": "St. John Fisher",
      "world": "dobie",
      "division": "D-III"
    },
    "54226": {
      "school_short": "Minnesota State-Mankato",
      "world": "dobie",
      "division": "D-II"
    },
    "54098": {
      "school_short": "Northern Arizona",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54096": {
      "school_short": "St. Mary`s",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53946": {
      "school_short": "McNeese State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53934": {
      "school_short": "Morehead State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53860": {
      "school_short": "Michigan State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54260": {
      "school_short": "Shepherd",
      "world": "dobie",
      "division": "D-II"
    },
    "54345": {
      "school_short": "St. Olaf",
      "world": "dobie",
      "division": "D-III"
    },
    "54375": {
      "school_short": "Rowan",
      "world": "dobie",
      "division": "D-III"
    },
    "54426": {
      "school_short": "Randolph-Macon",
      "world": "dobie",
      "division": "D-III"
    },
    "54094": {
      "school_short": "Portland State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53956": {
      "school_short": "Prairie View",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54051": {
      "school_short": "Rutgers",
      "world": "dobie",
      "division": "D-IA"
    },
    "53971": {
      "school_short": "Southern Connecticut",
      "world": "dobie",
      "division": "D-II"
    },
    "53980": {
      "school_short": "Southwest Minnesota State",
      "world": "dobie",
      "division": "D-II"
    },
    "54228": {
      "school_short": "South Dakota State",
      "world": "dobie",
      "division": "D-II"
    },
    "54407": {
      "school_short": "Stillman",
      "world": "dobie",
      "division": "D-III"
    },
    "54142": {
      "school_short": "Stony Brook",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54012": {
      "school_short": "Sul Ross State",
      "world": "dobie",
      "division": "D-III"
    },
    "54317": {
      "school_short": "Susquehanna",
      "world": "dobie",
      "division": "D-III"
    },
    "54048": {
      "school_short": "Texas Tech",
      "world": "dobie",
      "division": "D-IA"
    },
    "54376": {
      "school_short": "Cortland",
      "world": "dobie",
      "division": "D-III"
    },
    "54138": {
      "school_short": "SC State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54204": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "dobie",
      "division": "D-II"
    },
    "54162": {
      "school_short": "Tennessee State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54100": {
      "school_short": "Sam Houston State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54160": {
      "school_short": "Samford",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54293": {
      "school_short": "Simpson",
      "world": "dobie",
      "division": "D-III"
    },
    "54377": {
      "school_short": "New Jersey",
      "world": "dobie",
      "division": "D-III"
    },
    "54066": {
      "school_short": "Troy State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54218": {
      "school_short": "Truman State",
      "world": "dobie",
      "division": "D-II"
    },
    "53878": {
      "school_short": "Tulane",
      "world": "dobie",
      "division": "D-IA"
    },
    "53997": {
      "school_short": "Tuskegee",
      "world": "dobie",
      "division": "D-II"
    },
    "53887": {
      "school_short": "Buffalo",
      "world": "dobie",
      "division": "D-IA"
    },
    "54198": {
      "school_short": "Arkansas-Monticello",
      "world": "dobie",
      "division": "D-II"
    },
    "54163": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53987": {
      "school_short": "Charleston",
      "world": "dobie",
      "division": "D-II"
    },
    "53927": {
      "school_short": "Dayton",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54081": {
      "school_short": "Delaware",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54297": {
      "school_short": "Dubuque",
      "world": "dobie",
      "division": "D-III"
    },
    "53907": {
      "school_short": "Georgia",
      "world": "dobie",
      "division": "D-IA"
    },
    "53859": {
      "school_short": "Illinois",
      "world": "dobie",
      "division": "D-IA"
    },
    "53869": {
      "school_short": "Iowa",
      "world": "dobie",
      "division": "D-IA"
    },
    "54042": {
      "school_short": "Kansas",
      "world": "dobie",
      "division": "D-IA"
    },
    "53912": {
      "school_short": "Kentucky",
      "world": "dobie",
      "division": "D-IA"
    },
    "54442": {
      "school_short": "La Verne",
      "world": "dobie",
      "division": "D-III"
    },
    "53921": {
      "school_short": "Louisiana Lafayette",
      "world": "dobie",
      "division": "D-IA"
    },
    "53922": {
      "school_short": "Louisiana Monroe",
      "world": "dobie",
      "division": "D-IA"
    },
    "54035": {
      "school_short": "Maryland",
      "world": "dobie",
      "division": "D-IA"
    },
    "54082": {
      "school_short": "Massachusetts",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54353": {
      "school_short": "UMass-Dartmouth",
      "world": "dobie",
      "division": "D-III"
    },
    "53981": {
      "school_short": "Minnesota-Crookston",
      "world": "dobie",
      "division": "D-II"
    },
    "54026": {
      "school_short": "Union (NY)",
      "world": "dobie",
      "division": "D-III"
    },
    "53874": {
      "school_short": "Memphis",
      "world": "dobie",
      "division": "D-IA"
    },
    "53909": {
      "school_short": "Florida",
      "world": "dobie",
      "division": "D-IA"
    },
    "53877": {
      "school_short": "Texas Christian",
      "world": "dobie",
      "division": "D-IA"
    },
    "53880": {
      "school_short": "Southern Methodist",
      "world": "dobie",
      "division": "D-IA"
    },
    "54187": {
      "school_short": "Findlay",
      "world": "dobie",
      "division": "D-II"
    },
    "54238": {
      "school_short": "Slippery Rock",
      "world": "dobie",
      "division": "D-II"
    },
    "54101": {
      "school_short": "Stephen F. Austin",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54013": {
      "school_short": "Texas Lutheran",
      "world": "dobie",
      "division": "D-III"
    },
    "54002": {
      "school_short": "Saint Joseph`s",
      "world": "dobie",
      "division": "D-II"
    },
    "54205": {
      "school_short": "Tarleton State",
      "world": "dobie",
      "division": "D-II"
    },
    "54043": {
      "school_short": "Colorado",
      "world": "dobie",
      "division": "D-IA"
    },
    "53862": {
      "school_short": "Michigan",
      "world": "dobie",
      "division": "D-IA"
    },
    "54298": {
      "school_short": "Thiel",
      "world": "dobie",
      "division": "D-III"
    },
    "54455": {
      "school_short": "Thomas More",
      "world": "dobie",
      "division": "D-III"
    },
    "54087": {
      "school_short": "Maine",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54206": {
      "school_short": "Central Oklahoma",
      "world": "dobie",
      "division": "D-II"
    },
    "54152": {
      "school_short": "Tennessee Tech",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54255": {
      "school_short": "Tusculum",
      "world": "dobie",
      "division": "D-II"
    },
    "54365": {
      "school_short": "Tufts",
      "world": "dobie",
      "division": "D-III"
    },
    "53884": {
      "school_short": "Akron",
      "world": "dobie",
      "division": "D-IA"
    },
    "53905": {
      "school_short": "Stanford",
      "world": "dobie",
      "division": "D-IA"
    },
    "54075": {
      "school_short": "San Jose State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54211": {
      "school_short": "Texas A&M-Kingsville",
      "world": "dobie",
      "division": "D-II"
    },
    "53876": {
      "school_short": "Central Florida",
      "world": "dobie",
      "division": "D-IA"
    },
    "54143": {
      "school_short": "Albany",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54266": {
      "school_short": "Plymouth State",
      "world": "dobie",
      "division": "D-III"
    },
    "54102": {
      "school_short": "Texas State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54074": {
      "school_short": "San Diego State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54058": {
      "school_short": "Cincinnati",
      "world": "dobie",
      "division": "D-IA"
    },
    "54057": {
      "school_short": "Louisville",
      "world": "dobie",
      "division": "D-IA"
    },
    "54052": {
      "school_short": "Syracuse",
      "world": "dobie",
      "division": "D-IA"
    },
    "53917": {
      "school_short": "Arkansas",
      "world": "dobie",
      "division": "D-IA"
    },
    "54335": {
      "school_short": "Chicago",
      "world": "dobie",
      "division": "D-III"
    },
    "53916": {
      "school_short": "Alabama",
      "world": "dobie",
      "division": "D-IA"
    },
    "54036": {
      "school_short": "Miami (FL)",
      "world": "dobie",
      "division": "D-IA"
    },
    "53902": {
      "school_short": "Arizona",
      "world": "dobie",
      "division": "D-IA"
    },
    "54062": {
      "school_short": "Idaho",
      "world": "dobie",
      "division": "D-IA"
    },
    "53940": {
      "school_short": "Citadel",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54150": {
      "school_short": "Towson",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54364": {
      "school_short": "Trinity",
      "world": "dobie",
      "division": "D-III"
    },
    "53918": {
      "school_short": "Ole Miss",
      "world": "dobie",
      "division": "D-IA"
    },
    "54065": {
      "school_short": "Montana",
      "world": "dobie",
      "division": "D-IA"
    },
    "54078": {
      "school_short": "Nevada",
      "world": "dobie",
      "division": "D-IA"
    },
    "54076": {
      "school_short": "UNLV",
      "world": "dobie",
      "division": "D-IA"
    },
    "54199": {
      "school_short": "North Alabama",
      "world": "dobie",
      "division": "D-II"
    },
    "54063": {
      "school_short": "North Texas",
      "world": "dobie",
      "division": "D-IA"
    },
    "54443": {
      "school_short": "Redlands",
      "world": "dobie",
      "division": "D-III"
    },
    "54083": {
      "school_short": "Rhode Island",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53961": {
      "school_short": "South Dakota",
      "world": "dobie",
      "division": "D-II"
    },
    "54342": {
      "school_short": "St. Thomas",
      "world": "dobie",
      "division": "D-III"
    },
    "54153": {
      "school_short": "Tennessee-Martin",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54069": {
      "school_short": "UTEP",
      "world": "dobie",
      "division": "D-IA"
    },
    "53890": {
      "school_short": "Toledo",
      "world": "dobie",
      "division": "D-IA"
    },
    "54071": {
      "school_short": "Utah",
      "world": "dobie",
      "division": "D-IA"
    },
    "54192": {
      "school_short": "West Georgia",
      "world": "dobie",
      "division": "D-II"
    },
    "54458": {
      "school_short": "Wisconsin-La Crosse",
      "world": "dobie",
      "division": "D-III"
    },
    "54460": {
      "school_short": "Wisconsin-River Falls",
      "world": "dobie",
      "division": "D-III"
    },
    "54464": {
      "school_short": "Wisconsin-Stout",
      "world": "dobie",
      "division": "D-III"
    },
    "54072": {
      "school_short": "Wyoming",
      "world": "dobie",
      "division": "D-IA"
    },
    "54022": {
      "school_short": "Ursinus",
      "world": "dobie",
      "division": "D-III"
    },
    "54070": {
      "school_short": "New Mexico",
      "world": "dobie",
      "division": "D-IA"
    },
    "54046": {
      "school_short": "Texas",
      "world": "dobie",
      "division": "D-IA"
    },
    "54457": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "dobie",
      "division": "D-III"
    },
    "54463": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "dobie",
      "division": "D-III"
    },
    "54249": {
      "school_short": "Nebraska-Kearney",
      "world": "dobie",
      "division": "D-II"
    },
    "53959": {
      "school_short": "Nebraska-Omaha",
      "world": "dobie",
      "division": "D-II"
    },
    "54194": {
      "school_short": "West Alabama",
      "world": "dobie",
      "division": "D-II"
    },
    "54444": {
      "school_short": "Whittier",
      "world": "dobie",
      "division": "D-III"
    },
    "54306": {
      "school_short": "Wisconsin Lutheran",
      "world": "dobie",
      "division": "D-III"
    },
    "54276": {
      "school_short": "Utica",
      "world": "dobie",
      "division": "D-III"
    },
    "54389": {
      "school_short": "Wabash",
      "world": "dobie",
      "division": "D-III"
    },
    "54064": {
      "school_short": "Utah State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54088": {
      "school_short": "New Hampshire",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54264": {
      "school_short": "Rochester",
      "world": "dobie",
      "division": "D-III"
    },
    "53960": {
      "school_short": "North Dakota",
      "world": "dobie",
      "division": "D-II"
    },
    "53983": {
      "school_short": "Minnesota-Duluth",
      "world": "dobie",
      "division": "D-II"
    },
    "53945": {
      "school_short": "Tennessee-Chattanooga",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54045": {
      "school_short": "Oklahoma",
      "world": "dobie",
      "division": "D-IA"
    },
    "53903": {
      "school_short": "Southern California",
      "world": "dobie",
      "division": "D-IA"
    },
    "53928": {
      "school_short": "San Diego",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53870": {
      "school_short": "Notre Dame",
      "world": "dobie",
      "division": "D-IA"
    },
    "54182": {
      "school_short": "Indianapolis",
      "world": "dobie",
      "division": "D-II"
    },
    "53863": {
      "school_short": "Minnesota",
      "world": "dobie",
      "division": "D-IA"
    },
    "54418": {
      "school_short": "Wilmington (OH)",
      "world": "dobie",
      "division": "D-III"
    },
    "54030": {
      "school_short": "North Carolina",
      "world": "dobie",
      "division": "D-IA"
    },
    "53908": {
      "school_short": "Tennessee",
      "world": "dobie",
      "division": "D-IA"
    },
    "54221": {
      "school_short": "Missouri-Rolla",
      "world": "dobie",
      "division": "D-II"
    },
    "54110": {
      "school_short": "Northern Iowa",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54461": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "dobie",
      "division": "D-III"
    },
    "54077": {
      "school_short": "Hawaii",
      "world": "dobie",
      "division": "D-IA"
    },
    "53904": {
      "school_short": "UCLA",
      "world": "dobie",
      "division": "D-IA"
    },
    "54438": {
      "school_short": "Trinity (TX)",
      "world": "dobie",
      "division": "D-III"
    },
    "53873": {
      "school_short": "Tulsa",
      "world": "dobie",
      "division": "D-IA"
    },
    "54049": {
      "school_short": "Texas A&M",
      "world": "dobie",
      "division": "D-IA"
    },
    "54055": {
      "school_short": "Pittsburgh",
      "world": "dobie",
      "division": "D-IA"
    },
    "54119": {
      "school_short": "Pennsylvania",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54439": {
      "school_short": "South-Sewanee",
      "world": "dobie",
      "division": "D-III"
    },
    "53897": {
      "school_short": "Washington",
      "world": "dobie",
      "division": "D-IA"
    },
    "54041": {
      "school_short": "Missouri",
      "world": "dobie",
      "division": "D-IA"
    },
    "53882": {
      "school_short": "Southern Mississippi",
      "world": "dobie",
      "division": "D-IA"
    },
    "53881": {
      "school_short": "Houston",
      "world": "dobie",
      "division": "D-IA"
    },
    "54462": {
      "school_short": "Wisconsin-Whitewater",
      "world": "dobie",
      "division": "D-III"
    },
    "54089": {
      "school_short": "Richmond",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53911": {
      "school_short": "South Carolina",
      "world": "dobie",
      "division": "D-IA"
    },
    "54268": {
      "school_short": "Merchant Marine",
      "world": "dobie",
      "division": "D-III"
    },
    "54400": {
      "school_short": "Puget Sound",
      "world": "dobie",
      "division": "D-III"
    },
    "54032": {
      "school_short": "Wake Forest",
      "world": "dobie",
      "division": "D-IA"
    },
    "54294": {
      "school_short": "Wartburg",
      "world": "dobie",
      "division": "D-III"
    },
    "54222": {
      "school_short": "Washburn-Topeka",
      "world": "dobie",
      "division": "D-II"
    },
    "54427": {
      "school_short": "Washington and Lee",
      "world": "dobie",
      "division": "D-III"
    },
    "54095": {
      "school_short": "Weber State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54384": {
      "school_short": "Wesley",
      "world": "dobie",
      "division": "D-III"
    },
    "53941": {
      "school_short": "Western Carolina",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54269": {
      "school_short": "Western Connecticut State",
      "world": "dobie",
      "division": "D-III"
    },
    "54106": {
      "school_short": "Western Illinois",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54107": {
      "school_short": "Western Kentucky",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53892": {
      "school_short": "Western Michigan",
      "world": "dobie",
      "division": "D-IA"
    },
    "54401": {
      "school_short": "Whitworth",
      "world": "dobie",
      "division": "D-III"
    },
    "54402": {
      "school_short": "Willamette",
      "world": "dobie",
      "division": "D-III"
    },
    "54366": {
      "school_short": "Williams",
      "world": "dobie",
      "division": "D-III"
    },
    "54256": {
      "school_short": "Wingate",
      "world": "dobie",
      "division": "D-II"
    },
    "53942": {
      "school_short": "Wofford",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54813": {
      "school_short": "East Central",
      "world": "hayes",
      "division": "D-II"
    },
    "53986": {
      "school_short": "Wayne State",
      "world": "dobie",
      "division": "D-II"
    },
    "54261": {
      "school_short": "West Virginia Tech",
      "world": "dobie",
      "division": "D-II"
    },
    "54348": {
      "school_short": "Westminster (PA)",
      "world": "dobie",
      "division": "D-III"
    },
    "53930": {
      "school_short": "VMI",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54144": {
      "school_short": "Wagner",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54300": {
      "school_short": "Waynesburg",
      "world": "dobie",
      "division": "D-III"
    },
    "54212": {
      "school_short": "West Texas A&M",
      "world": "dobie",
      "division": "D-II"
    },
    "54262": {
      "school_short": "West Virginia Wesleyan",
      "world": "dobie",
      "division": "D-II"
    },
    "54250": {
      "school_short": "Western State (CO)",
      "world": "dobie",
      "division": "D-II"
    },
    "53965": {
      "school_short": "Western Washington",
      "world": "dobie",
      "division": "D-II"
    },
    "54037": {
      "school_short": "Virginia Tech",
      "world": "dobie",
      "division": "D-IA"
    },
    "54169": {
      "school_short": "Virginia Union",
      "world": "dobie",
      "division": "D-II"
    },
    "54378": {
      "school_short": "William Paterson",
      "world": "dobie",
      "division": "D-III"
    },
    "54884": {
      "school_short": "Alfred",
      "world": "hayes",
      "division": "D-III"
    },
    "55040": {
      "school_short": "Anderson",
      "world": "hayes",
      "division": "D-III"
    },
    "54549": {
      "school_short": "Appalachian State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54531": {
      "school_short": "Arkansas State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54801": {
      "school_short": "Arkansas Tech",
      "world": "hayes",
      "division": "D-II"
    },
    "54789": {
      "school_short": "Ashland",
      "world": "hayes",
      "division": "D-II"
    },
    "54837": {
      "school_short": "Augustana",
      "world": "hayes",
      "division": "D-II"
    },
    "54899": {
      "school_short": "Augustana (IL)",
      "world": "hayes",
      "division": "D-III"
    },
    "54543": {
      "school_short": "Austin Peay",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54979": {
      "school_short": "Bates",
      "world": "hayes",
      "division": "D-III"
    },
    "54937": {
      "school_short": "Beloit",
      "world": "hayes",
      "division": "D-III"
    },
    "54359": {
      "school_short": "Westfield State",
      "world": "dobie",
      "division": "D-III"
    },
    "54889": {
      "school_short": "Aurora",
      "world": "hayes",
      "division": "D-III"
    },
    "54505": {
      "school_short": "Ball State",
      "world": "hayes",
      "division": "D-IA"
    },
    "53989": {
      "school_short": "West Virginia State",
      "world": "dobie",
      "division": "D-II"
    },
    "54973": {
      "school_short": "Amherst",
      "world": "hayes",
      "division": "D-III"
    },
    "54288": {
      "school_short": "Wheaton",
      "world": "dobie",
      "division": "D-III"
    },
    "54949": {
      "school_short": "Augsburg",
      "world": "hayes",
      "division": "D-III"
    },
    "54820": {
      "school_short": "Angelo State",
      "world": "hayes",
      "division": "D-II"
    },
    "54168": {
      "school_short": "Virginia State",
      "world": "dobie",
      "division": "D-II"
    },
    "54590": {
      "school_short": "Bemidji State",
      "world": "hayes",
      "division": "D-II"
    },
    "54605": {
      "school_short": "Benedict",
      "world": "hayes",
      "division": "D-II"
    },
    "54584": {
      "school_short": "Assumption",
      "world": "hayes",
      "division": "D-II"
    },
    "54370": {
      "school_short": "Wesleyan",
      "world": "dobie",
      "division": "D-III"
    },
    "55021": {
      "school_short": "Baldwin-Wallace",
      "world": "hayes",
      "division": "D-III"
    },
    "54525": {
      "school_short": "Auburn",
      "world": "hayes",
      "division": "D-IA"
    },
    "53982": {
      "school_short": "Winona State",
      "world": "dobie",
      "division": "D-II"
    },
    "54056": {
      "school_short": "West Virginia",
      "world": "dobie",
      "division": "D-IA"
    },
    "54997": {
      "school_short": "Allegheny",
      "world": "hayes",
      "division": "D-III"
    },
    "54336": {
      "school_short": "Washington (MO)",
      "world": "dobie",
      "division": "D-III"
    },
    "54857": {
      "school_short": "Adams State",
      "world": "hayes",
      "division": "D-II"
    },
    "54915": {
      "school_short": "Alma",
      "world": "hayes",
      "division": "D-III"
    },
    "54456": {
      "school_short": "Westminster (MO)",
      "world": "dobie",
      "division": "D-III"
    },
    "54188": {
      "school_short": "Wayne State",
      "world": "dobie",
      "division": "D-II"
    },
    "54318": {
      "school_short": "Wilkes",
      "world": "dobie",
      "division": "D-III"
    },
    "54084": {
      "school_short": "Villanova",
      "world": "dobie",
      "division": "D-IAA"
    },
    "55057": {
      "school_short": "Averett",
      "world": "hayes",
      "division": "D-III"
    },
    "53964": {
      "school_short": "Western Oregon",
      "world": "dobie",
      "division": "D-II"
    },
    "54622": {
      "school_short": "Austin",
      "world": "hayes",
      "division": "D-III"
    },
    "54354": {
      "school_short": "Western New England",
      "world": "dobie",
      "division": "D-III"
    },
    "54176": {
      "school_short": "Winston-Salem State",
      "world": "dobie",
      "division": "D-II"
    },
    "54390": {
      "school_short": "Wittenberg",
      "world": "dobie",
      "division": "D-III"
    },
    "54244": {
      "school_short": "Western New Mexico",
      "world": "dobie",
      "division": "D-II"
    },
    "54323": {
      "school_short": "Widener",
      "world": "dobie",
      "division": "D-III"
    },
    "53898": {
      "school_short": "Washington State",
      "world": "dobie",
      "division": "D-IA"
    },
    "54895": {
      "school_short": "Benedictine",
      "world": "hayes",
      "division": "D-III"
    },
    "54579": {
      "school_short": "Bentley",
      "world": "hayes",
      "division": "D-II"
    },
    "54950": {
      "school_short": "Bethel",
      "world": "hayes",
      "division": "D-III"
    },
    "54745": {
      "school_short": "Bethune-Cookman",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54602": {
      "school_short": "Bloomsburg",
      "world": "hayes",
      "division": "D-II"
    },
    "55041": {
      "school_short": "Bluffton",
      "world": "hayes",
      "division": "D-III"
    },
    "54980": {
      "school_short": "Bowdoin",
      "world": "hayes",
      "division": "D-III"
    },
    "55033": {
      "school_short": "Bridgewater",
      "world": "hayes",
      "division": "D-III"
    },
    "54967": {
      "school_short": "Bridgewater State",
      "world": "hayes",
      "division": "D-III"
    },
    "54512": {
      "school_short": "BYU",
      "world": "hayes",
      "division": "D-IA"
    },
    "54580": {
      "school_short": "Bryant",
      "world": "hayes",
      "division": "D-II"
    },
    "54735": {
      "school_short": "Bucknell",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54901": {
      "school_short": "Buena Vista",
      "world": "hayes",
      "division": "D-III"
    },
    "54991": {
      "school_short": "Buffalo",
      "world": "hayes",
      "division": "D-III"
    },
    "54537": {
      "school_short": "Butler",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54578": {
      "school_short": "American International",
      "world": "hayes",
      "division": "D-II"
    },
    "54662": {
      "school_short": "Baylor",
      "world": "hayes",
      "division": "D-IA"
    },
    "54777": {
      "school_short": "Bowie State",
      "world": "hayes",
      "division": "D-II"
    },
    "54270": {
      "school_short": "Worcester Tech",
      "world": "dobie",
      "division": "D-III"
    },
    "54120": {
      "school_short": "Yale",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54819": {
      "school_short": "Abilene Christian",
      "world": "hayes",
      "division": "D-II"
    },
    "54561": {
      "school_short": "Alabama A&M",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54563": {
      "school_short": "Alcorn State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54807": {
      "school_short": "Delta State",
      "world": "hayes",
      "division": "D-II"
    },
    "55007": {
      "school_short": "Carnegie Mellon",
      "world": "hayes",
      "division": "D-III"
    },
    "54506": {
      "school_short": "Central Michigan",
      "world": "hayes",
      "division": "D-IA"
    },
    "54825": {
      "school_short": "Central Missouri State",
      "world": "hayes",
      "division": "D-II"
    },
    "54574": {
      "school_short": "Central Washington",
      "world": "hayes",
      "division": "D-II"
    },
    "55058": {
      "school_short": "Christopher Newport",
      "world": "hayes",
      "division": "D-III"
    },
    "54639": {
      "school_short": "Clemson",
      "world": "hayes",
      "division": "D-IA"
    },
    "54907": {
      "school_short": "Coe",
      "world": "hayes",
      "division": "D-III"
    },
    "54736": {
      "school_short": "Colgate",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54852": {
      "school_short": "Colorado School of Mines",
      "world": "hayes",
      "division": "D-II"
    },
    "54470": {
      "school_short": "Colorado State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54728": {
      "school_short": "Columbia",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54951": {
      "school_short": "Concordia",
      "world": "hayes",
      "division": "D-III"
    },
    "54896": {
      "school_short": "Concordia (IL)",
      "world": "hayes",
      "division": "D-III"
    },
    "54890": {
      "school_short": "Concordia (WI)",
      "world": "hayes",
      "division": "D-III"
    },
    "54730": {
      "school_short": "Harvard",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54596": {
      "school_short": "Concordia",
      "world": "hayes",
      "division": "D-II"
    },
    "54733": {
      "school_short": "Cornell",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54544": {
      "school_short": "Davidson",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54741": {
      "school_short": "Delaware State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54672": {
      "school_short": "DePaul",
      "world": "hayes",
      "division": "D-IA"
    },
    "54727": {
      "school_short": "Brown",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54974": {
      "school_short": "Colby",
      "world": "hayes",
      "division": "D-III"
    },
    "54627": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "hayes",
      "division": "D-III"
    },
    "55020": {
      "school_short": "Blackburn",
      "world": "hayes",
      "division": "D-III"
    },
    "54729": {
      "school_short": "Dartmouth",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54926": {
      "school_short": "Delaware Valley",
      "world": "hayes",
      "division": "D-III"
    },
    "54650": {
      "school_short": "Boston",
      "world": "hayes",
      "division": "D-IA"
    },
    "54998": {
      "school_short": "Wooster",
      "world": "hayes",
      "division": "D-III"
    },
    "54588": {
      "school_short": "Concord",
      "world": "hayes",
      "division": "D-II"
    },
    "55032": {
      "school_short": "Defiance",
      "world": "hayes",
      "division": "D-III"
    },
    "54628": {
      "school_short": "Dickinson",
      "world": "hayes",
      "division": "D-III"
    },
    "54538": {
      "school_short": "Drake",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54640": {
      "school_short": "Duke",
      "world": "hayes",
      "division": "D-IA"
    },
    "54742": {
      "school_short": "Duquesne",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55004": {
      "school_short": "Earlham",
      "world": "hayes",
      "division": "D-III"
    },
    "54925": {
      "school_short": "Albright",
      "world": "hayes",
      "division": "D-III"
    },
    "54863": {
      "school_short": "Carson-Newman",
      "world": "hayes",
      "division": "D-II"
    },
    "54501": {
      "school_short": "Bowling Green",
      "world": "hayes",
      "division": "D-IA"
    },
    "54691": {
      "school_short": "William & Mary",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54483": {
      "school_short": "East Carolina",
      "world": "hayes",
      "division": "D-IA"
    },
    "54958": {
      "school_short": "Bethany",
      "world": "hayes",
      "division": "D-III"
    },
    "54875": {
      "school_short": "Albany State",
      "world": "hayes",
      "division": "D-II"
    },
    "54562": {
      "school_short": "Alabama State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54685": {
      "school_short": "Fresno State",
      "world": "hayes",
      "division": "D-IA"
    },
    "55045": {
      "school_short": "Centre",
      "world": "hayes",
      "division": "D-III"
    },
    "54943": {
      "school_short": "Carroll",
      "world": "hayes",
      "division": "D-III"
    },
    "54548": {
      "school_short": "Coastal Carolina",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54921": {
      "school_short": "Colorado",
      "world": "hayes",
      "division": "D-III"
    },
    "54680": {
      "school_short": "Boise State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54913": {
      "school_short": "Adrian",
      "world": "hayes",
      "division": "D-III"
    },
    "54961": {
      "school_short": "Curry",
      "world": "hayes",
      "division": "D-III"
    },
    "54914": {
      "school_short": "Albion",
      "world": "hayes",
      "division": "D-III"
    },
    "55003": {
      "school_short": "Denison",
      "world": "hayes",
      "division": "D-III"
    },
    "54705": {
      "school_short": "Cal Poly",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54851": {
      "school_short": "Chadron State",
      "world": "hayes",
      "division": "D-II"
    },
    "54908": {
      "school_short": "Cornell",
      "world": "hayes",
      "division": "D-III"
    },
    "54992": {
      "school_short": "Chapman",
      "world": "hayes",
      "division": "D-III"
    },
    "54610": {
      "school_short": "Clark Atlanta",
      "world": "hayes",
      "division": "D-II"
    },
    "54737": {
      "school_short": "Holy Cross",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54845": {
      "school_short": "California (PA)",
      "world": "hayes",
      "division": "D-II"
    },
    "55022": {
      "school_short": "Capital",
      "world": "hayes",
      "division": "D-III"
    },
    "54955": {
      "school_short": "Carleton",
      "world": "hayes",
      "division": "D-III"
    },
    "55034": {
      "school_short": "Catholic",
      "world": "hayes",
      "division": "D-III"
    },
    "54902": {
      "school_short": "Central",
      "world": "hayes",
      "division": "D-III"
    },
    "54757": {
      "school_short": "Central Connecticut",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55046": {
      "school_short": "DePauw",
      "world": "hayes",
      "division": "D-III"
    },
    "55036": {
      "school_short": "Guilford",
      "world": "hayes",
      "division": "D-III"
    },
    "55015": {
      "school_short": "Eastern Oregon",
      "world": "hayes",
      "division": "D-III"
    },
    "54704": {
      "school_short": "Eastern Washington",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54847": {
      "school_short": "Edinboro",
      "world": "hayes",
      "division": "D-II"
    },
    "54778": {
      "school_short": "Elizabeth City",
      "world": "hayes",
      "division": "D-II"
    },
    "54931": {
      "school_short": "Fairleigh Dickinson",
      "world": "hayes",
      "division": "D-III"
    },
    "54589": {
      "school_short": "Fairmont State",
      "world": "hayes",
      "division": "D-II"
    },
    "55059": {
      "school_short": "Ferrum",
      "world": "hayes",
      "division": "D-III"
    },
    "54968": {
      "school_short": "Fitchburg State",
      "world": "hayes",
      "division": "D-III"
    },
    "54853": {
      "school_short": "Fort Hays State",
      "world": "hayes",
      "division": "D-II"
    },
    "54858": {
      "school_short": "Fort Lewis",
      "world": "hayes",
      "division": "D-II"
    },
    "54606": {
      "school_short": "Fort Valley State",
      "world": "hayes",
      "division": "D-II"
    },
    "54983": {
      "school_short": "Framingham State",
      "world": "hayes",
      "division": "D-III"
    },
    "54629": {
      "school_short": "Franklin & Marshall",
      "world": "hayes",
      "division": "D-III"
    },
    "55042": {
      "school_short": "Franklin",
      "world": "hayes",
      "division": "D-III"
    },
    "55016": {
      "school_short": "Frostburg State",
      "world": "hayes",
      "division": "D-III"
    },
    "54550": {
      "school_short": "Furman",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54782": {
      "school_short": "Gannon",
      "world": "hayes",
      "division": "D-II"
    },
    "54566": {
      "school_short": "Gardner-Webb",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54759": {
      "school_short": "Georgetown",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54641": {
      "school_short": "Georgia Tech",
      "world": "hayes",
      "division": "D-IA"
    },
    "54871": {
      "school_short": "Glenville",
      "world": "hayes",
      "division": "D-II"
    },
    "55060": {
      "school_short": "Greensboro",
      "world": "hayes",
      "division": "D-III"
    },
    "54944": {
      "school_short": "Grinnell",
      "world": "hayes",
      "division": "D-III"
    },
    "54959": {
      "school_short": "Grove City",
      "world": "hayes",
      "division": "D-III"
    },
    "54956": {
      "school_short": "Hamline",
      "world": "hayes",
      "division": "D-III"
    },
    "54746": {
      "school_short": "Hampton",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54617": {
      "school_short": "Hardin-Simmons",
      "world": "hayes",
      "division": "D-III"
    },
    "54885": {
      "school_short": "Hartwick",
      "world": "hayes",
      "division": "D-III"
    },
    "54808": {
      "school_short": "Henderson State",
      "world": "hayes",
      "division": "D-II"
    },
    "54723": {
      "school_short": "Florida International",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54738": {
      "school_short": "Fordham",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55043": {
      "school_short": "Hanover",
      "world": "hayes",
      "division": "D-III"
    },
    "54802": {
      "school_short": "Harding",
      "world": "hayes",
      "division": "D-II"
    },
    "54555": {
      "school_short": "East Tennessee State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54769": {
      "school_short": "Eastern Kentucky",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54981": {
      "school_short": "Hamilton",
      "world": "hayes",
      "division": "D-III"
    },
    "55063": {
      "school_short": "Chowan",
      "world": "hayes",
      "division": "D-III"
    },
    "54616": {
      "school_short": "East Texas Baptist",
      "world": "hayes",
      "division": "D-III"
    },
    "54864": {
      "school_short": "Catawba",
      "world": "hayes",
      "division": "D-II"
    },
    "54630": {
      "school_short": "Gettysburg",
      "world": "hayes",
      "division": "D-III"
    },
    "54567": {
      "school_short": "Grambling State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54952": {
      "school_short": "Gustavus Adolphus",
      "world": "hayes",
      "division": "D-III"
    },
    "54556": {
      "school_short": "Elon",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55027": {
      "school_short": "Heidelberg",
      "world": "hayes",
      "division": "D-III"
    },
    "54500": {
      "school_short": "Eastern Michigan",
      "world": "hayes",
      "division": "D-IA"
    },
    "55035": {
      "school_short": "Emory and Henry",
      "world": "hayes",
      "division": "D-III"
    },
    "54826": {
      "school_short": "Emporia State",
      "world": "hayes",
      "division": "D-II"
    },
    "54747": {
      "school_short": "Howard",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54709": {
      "school_short": "Idaho State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54938": {
      "school_short": "Illinois",
      "world": "hayes",
      "division": "D-III"
    },
    "54836": {
      "school_short": "Cheyney",
      "world": "hayes",
      "division": "D-II"
    },
    "54891": {
      "school_short": "Eureka",
      "world": "hayes",
      "division": "D-III"
    },
    "54763": {
      "school_short": "Eastern Illinois",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54645": {
      "school_short": "Florida State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54702": {
      "school_short": "Florida Atlantic",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54739": {
      "school_short": "Florida A&M",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54715": {
      "school_short": "Illinois State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54795": {
      "school_short": "Ferris State",
      "world": "hayes",
      "division": "D-II"
    },
    "54821": {
      "school_short": "Eastern New Mexico",
      "world": "hayes",
      "division": "D-II"
    },
    "54696": {
      "school_short": "Villanova",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54703": {
      "school_short": "California State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55008": {
      "school_short": "Case Western",
      "world": "hayes",
      "division": "D-III"
    },
    "54962": {
      "school_short": "Endicott",
      "world": "hayes",
      "division": "D-III"
    },
    "55037": {
      "school_short": "Hampden-Sydney",
      "world": "hayes",
      "division": "D-III"
    },
    "54898": {
      "school_short": "Illinois Wesleyan",
      "world": "hayes",
      "division": "D-III"
    },
    "54564": {
      "school_short": "Jackson State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54545": {
      "school_short": "Jacksonville",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54692": {
      "school_short": "James Madison",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55023": {
      "school_short": "John Carroll",
      "world": "hayes",
      "division": "D-III"
    },
    "54631": {
      "school_short": "Johns Hopkins",
      "world": "hayes",
      "division": "D-III"
    },
    "54497": {
      "school_short": "Kent State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54945": {
      "school_short": "Knox",
      "world": "hayes",
      "division": "D-III"
    },
    "54893": {
      "school_short": "Lakeland",
      "world": "hayes",
      "division": "D-III"
    },
    "54946": {
      "school_short": "Lawrence",
      "world": "hayes",
      "division": "D-III"
    },
    "54761": {
      "school_short": "Lehigh",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54869": {
      "school_short": "Lenoir-Rhyne",
      "world": "hayes",
      "division": "D-II"
    },
    "55009": {
      "school_short": "Lewis and Clark",
      "world": "hayes",
      "division": "D-III"
    },
    "54776": {
      "school_short": "Liberty",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55010": {
      "school_short": "Linfield",
      "world": "hayes",
      "division": "D-III"
    },
    "54903": {
      "school_short": "Loras",
      "world": "hayes",
      "division": "D-III"
    },
    "54928": {
      "school_short": "Lycoming",
      "world": "hayes",
      "division": "D-III"
    },
    "54920": {
      "school_short": "Macalester",
      "world": "hayes",
      "division": "D-III"
    },
    "54894": {
      "school_short": "MacMurray",
      "world": "hayes",
      "division": "D-III"
    },
    "55044": {
      "school_short": "Manchester",
      "world": "hayes",
      "division": "D-III"
    },
    "54842": {
      "school_short": "Mansfield",
      "world": "hayes",
      "division": "D-II"
    },
    "54969": {
      "school_short": "Maine Maritime",
      "world": "hayes",
      "division": "D-III"
    },
    "54923": {
      "school_short": "Husson",
      "world": "hayes",
      "division": "D-III"
    },
    "54480": {
      "school_short": "Indiana",
      "world": "hayes",
      "division": "D-IA"
    },
    "54917": {
      "school_short": "Kalamazoo",
      "world": "hayes",
      "division": "D-III"
    },
    "54985": {
      "school_short": "Kean",
      "world": "hayes",
      "division": "D-III"
    },
    "54613": {
      "school_short": "Kentucky Wesleyan",
      "world": "hayes",
      "division": "D-II"
    },
    "54904": {
      "school_short": "Luther",
      "world": "hayes",
      "division": "D-III"
    },
    "54796": {
      "school_short": "Hillsdale",
      "world": "hayes",
      "division": "D-II"
    },
    "55005": {
      "school_short": "Hiram",
      "world": "hayes",
      "division": "D-III"
    },
    "54697": {
      "school_short": "Hofstra",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54916": {
      "school_short": "Hope",
      "world": "hayes",
      "division": "D-III"
    },
    "54618": {
      "school_short": "Howard Payne",
      "world": "hayes",
      "division": "D-III"
    },
    "54766": {
      "school_short": "Iona",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54656": {
      "school_short": "Iowa State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54886": {
      "school_short": "Ithaca",
      "world": "hayes",
      "division": "D-III"
    },
    "54933": {
      "school_short": "Lebanon Valley",
      "world": "hayes",
      "division": "D-III"
    },
    "54632": {
      "school_short": "McDaniel",
      "world": "hayes",
      "division": "D-III"
    },
    "54620": {
      "school_short": "McMurry",
      "world": "hayes",
      "division": "D-III"
    },
    "54558": {
      "school_short": "McNeese State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54791": {
      "school_short": "Mercyhurst",
      "world": "hayes",
      "division": "D-II"
    },
    "54975": {
      "school_short": "Middlebury",
      "world": "hayes",
      "division": "D-III"
    },
    "54854": {
      "school_short": "Midwestern State",
      "world": "hayes",
      "division": "D-II"
    },
    "54848": {
      "school_short": "Indiana (PA)",
      "world": "hayes",
      "division": "D-II"
    },
    "54604": {
      "school_short": "Kutztown",
      "world": "hayes",
      "division": "D-II"
    },
    "54770": {
      "school_short": "Jacksonville State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54843": {
      "school_short": "Millersville",
      "world": "hayes",
      "division": "D-II"
    },
    "54565": {
      "school_short": "Mississippi Valley State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54760": {
      "school_short": "Lafayette",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54608": {
      "school_short": "Miles",
      "world": "hayes",
      "division": "D-II"
    },
    "54623": {
      "school_short": "Mississippi",
      "world": "hayes",
      "division": "D-III"
    },
    "54892": {
      "school_short": "Greenville",
      "world": "hayes",
      "division": "D-III"
    },
    "54993": {
      "school_short": "Huntingdon",
      "world": "hayes",
      "division": "D-III"
    },
    "54526": {
      "school_short": "LSU",
      "world": "hayes",
      "division": "D-IA"
    },
    "54831": {
      "school_short": "Missouri Southern State",
      "world": "hayes",
      "division": "D-II"
    },
    "54721": {
      "school_short": "Missouri State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54827": {
      "school_short": "Missouri Western State",
      "world": "hayes",
      "division": "D-II"
    },
    "54751": {
      "school_short": "Monmouth",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54711": {
      "school_short": "Montana State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54934": {
      "school_short": "Moravian",
      "world": "hayes",
      "division": "D-III"
    },
    "54546": {
      "school_short": "Morehead State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54612": {
      "school_short": "Morehouse",
      "world": "hayes",
      "division": "D-II"
    },
    "54748": {
      "school_short": "Morgan State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54994": {
      "school_short": "Mount Ida",
      "world": "hayes",
      "division": "D-III"
    },
    "54679": {
      "school_short": "Louisiana Tech",
      "world": "hayes",
      "division": "D-IA"
    },
    "54581": {
      "school_short": "Long Island",
      "world": "hayes",
      "division": "D-II"
    },
    "54999": {
      "school_short": "Kenyon",
      "world": "hayes",
      "division": "D-III"
    },
    "54582": {
      "school_short": "Merrimack",
      "world": "hayes",
      "division": "D-II"
    },
    "54527": {
      "school_short": "Mississippi State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54939": {
      "school_short": "Lake Forest",
      "world": "hayes",
      "division": "D-III"
    },
    "55017": {
      "school_short": "Menlo",
      "world": "hayes",
      "division": "D-III"
    },
    "54785": {
      "school_short": "Livingstone",
      "world": "hayes",
      "division": "D-II"
    },
    "54591": {
      "school_short": "Minnesota State-Moorhead",
      "world": "hayes",
      "division": "D-II"
    },
    "54611": {
      "school_short": "Lane",
      "world": "hayes",
      "division": "D-II"
    },
    "54932": {
      "school_short": "Juniata",
      "world": "hayes",
      "division": "D-III"
    },
    "54835": {
      "school_short": "Lock Haven",
      "world": "hayes",
      "division": "D-II"
    },
    "55047": {
      "school_short": "Millsaps",
      "world": "hayes",
      "division": "D-III"
    },
    "54619": {
      "school_short": "Louisiana",
      "world": "hayes",
      "division": "D-III"
    },
    "55024": {
      "school_short": "Mount Union",
      "world": "hayes",
      "division": "D-III"
    },
    "54633": {
      "school_short": "Muhlenberg",
      "world": "hayes",
      "division": "D-III"
    },
    "54771": {
      "school_short": "Murray State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55025": {
      "school_short": "Muskingum",
      "world": "hayes",
      "division": "D-III"
    },
    "55066": {
      "school_short": "Nebraska Wesleyan",
      "world": "hayes",
      "division": "D-III"
    },
    "54673": {
      "school_short": "New Mexico State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54870": {
      "school_short": "Newberry",
      "world": "hayes",
      "division": "D-II"
    },
    "54963": {
      "school_short": "Nichols",
      "world": "hayes",
      "division": "D-III"
    },
    "54740": {
      "school_short": "Norfolk State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54749": {
      "school_short": "NC A&T",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54786": {
      "school_short": "North Carolina Central",
      "world": "hayes",
      "division": "D-II"
    },
    "55078": {
      "school_short": "North Central",
      "world": "hayes",
      "division": "D-III"
    },
    "55061": {
      "school_short": "Methodist",
      "world": "hayes",
      "division": "D-III"
    },
    "55077": {
      "school_short": "Millikin",
      "world": "hayes",
      "division": "D-III"
    },
    "54986": {
      "school_short": "Montclair State",
      "world": "hayes",
      "division": "D-III"
    },
    "54559": {
      "school_short": "Nicholls State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55064": {
      "school_short": "Maranatha Baptist",
      "world": "hayes",
      "division": "D-III"
    },
    "54469": {
      "school_short": "Marquette",
      "world": "hayes",
      "division": "D-IA"
    },
    "54865": {
      "school_short": "Mars Hill",
      "world": "hayes",
      "division": "D-II"
    },
    "54922": {
      "school_short": "Martin Luther",
      "world": "hayes",
      "division": "D-III"
    },
    "55065": {
      "school_short": "Maryville",
      "world": "hayes",
      "division": "D-III"
    },
    "54984": {
      "school_short": "MIT",
      "world": "hayes",
      "division": "D-III"
    },
    "54970": {
      "school_short": "Massachusetts Maritime",
      "world": "hayes",
      "division": "D-III"
    },
    "54495": {
      "school_short": "Miami (OH)",
      "world": "hayes",
      "division": "D-IA"
    },
    "54872": {
      "school_short": "Shepherd",
      "world": "hayes",
      "division": "D-II"
    },
    "54849": {
      "school_short": "Shippensburg",
      "world": "hayes",
      "division": "D-II"
    },
    "55079": {
      "school_short": "North Park",
      "world": "hayes",
      "division": "D-III"
    },
    "54792": {
      "school_short": "Northern Michigan",
      "world": "hayes",
      "division": "D-II"
    },
    "54597": {
      "school_short": "Northern State",
      "world": "hayes",
      "division": "D-II"
    },
    "54828": {
      "school_short": "Northwest Missouri State",
      "world": "hayes",
      "division": "D-II"
    },
    "55000": {
      "school_short": "Oberlin",
      "world": "hayes",
      "division": "D-III"
    },
    "54829": {
      "school_short": "Pittsburg State",
      "world": "hayes",
      "division": "D-II"
    },
    "55026": {
      "school_short": "Ohio Northern",
      "world": "hayes",
      "division": "D-III"
    },
    "55006": {
      "school_short": "Ohio Wesleyan",
      "world": "hayes",
      "division": "D-III"
    },
    "54919": {
      "school_short": "Olivet",
      "world": "hayes",
      "division": "D-III"
    },
    "54803": {
      "school_short": "Ouachita Baptist",
      "world": "hayes",
      "division": "D-II"
    },
    "54585": {
      "school_short": "Pace",
      "world": "hayes",
      "division": "D-II"
    },
    "55011": {
      "school_short": "Pacific Lutheran",
      "world": "hayes",
      "division": "D-III"
    },
    "54478": {
      "school_short": "Penn State",
      "world": "hayes",
      "division": "D-IA"
    },
    "55053": {
      "school_short": "Pomona-Pitzers",
      "world": "hayes",
      "division": "D-III"
    },
    "54479": {
      "school_short": "Purdue",
      "world": "hayes",
      "division": "D-IA"
    },
    "55038": {
      "school_short": "Randolph-Macon",
      "world": "hayes",
      "division": "D-III"
    },
    "54636": {
      "school_short": "Rensselaer Tech",
      "world": "hayes",
      "division": "D-III"
    },
    "55048": {
      "school_short": "Rhodes",
      "world": "hayes",
      "division": "D-III"
    },
    "54484": {
      "school_short": "Rice",
      "world": "hayes",
      "division": "D-IA"
    },
    "54941": {
      "school_short": "Ripon",
      "world": "hayes",
      "division": "D-III"
    },
    "54866": {
      "school_short": "Presbyterian",
      "world": "hayes",
      "division": "D-II"
    },
    "54507": {
      "school_short": "Oregon State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54706": {
      "school_short": "Portland State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54814": {
      "school_short": "Northeastern State",
      "world": "hayes",
      "division": "D-II"
    },
    "54487": {
      "school_short": "Marshall",
      "world": "hayes",
      "division": "D-IA"
    },
    "54860": {
      "school_short": "New Mexico Highlands",
      "world": "hayes",
      "division": "D-II"
    },
    "55052": {
      "school_short": "Occidental",
      "world": "hayes",
      "division": "D-III"
    },
    "54995": {
      "school_short": "Rockford",
      "world": "hayes",
      "division": "D-III"
    },
    "54987": {
      "school_short": "Rowan",
      "world": "hayes",
      "division": "D-III"
    },
    "54793": {
      "school_short": "Saginaw Valley State",
      "world": "hayes",
      "division": "D-II"
    },
    "54712": {
      "school_short": "Sam Houston State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54772": {
      "school_short": "Samford",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54724": {
      "school_short": "Savannah State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54855": {
      "school_short": "Oklahoma Panhandle",
      "world": "hayes",
      "division": "D-II"
    },
    "55049": {
      "school_short": "Rose-Hulman",
      "world": "hayes",
      "division": "D-III"
    },
    "54568": {
      "school_short": "Prairie View",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55018": {
      "school_short": "Principia",
      "world": "hayes",
      "division": "D-III"
    },
    "54498": {
      "school_short": "Ohio",
      "world": "hayes",
      "division": "D-IA"
    },
    "54878": {
      "school_short": "Plymouth State",
      "world": "hayes",
      "division": "D-III"
    },
    "54586": {
      "school_short": "Saint Anselm",
      "world": "hayes",
      "division": "D-II"
    },
    "54615": {
      "school_short": "Quincy",
      "world": "hayes",
      "division": "D-II"
    },
    "54839": {
      "school_short": "North Dakota State",
      "world": "hayes",
      "division": "D-II"
    },
    "55028": {
      "school_short": "Marietta",
      "world": "hayes",
      "division": "D-III"
    },
    "54646": {
      "school_short": "North Carolina State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54877": {
      "school_short": "Norwich",
      "world": "hayes",
      "division": "D-III"
    },
    "54560": {
      "school_short": "Northwestern State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54940": {
      "school_short": "Monmouth (IL)",
      "world": "hayes",
      "division": "D-III"
    },
    "54477": {
      "school_short": "Ohio State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54779": {
      "school_short": "Shaw",
      "world": "hayes",
      "division": "D-II"
    },
    "54964": {
      "school_short": "Salve Regina",
      "world": "hayes",
      "division": "D-III"
    },
    "54753": {
      "school_short": "Sacred Heart",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54698": {
      "school_short": "Northeastern",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54503": {
      "school_short": "Northern Illinois",
      "world": "hayes",
      "division": "D-IA"
    },
    "54473": {
      "school_short": "Northwestern",
      "world": "hayes",
      "division": "D-IA"
    },
    "54490": {
      "school_short": "Tulane",
      "world": "hayes",
      "division": "D-IA"
    },
    "54905": {
      "school_short": "Simpson",
      "world": "hayes",
      "division": "D-III"
    },
    "54750": {
      "school_short": "SC State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54809": {
      "school_short": "Southern Arkansas",
      "world": "hayes",
      "division": "D-II"
    },
    "54492": {
      "school_short": "Southern Methodist",
      "world": "hayes",
      "division": "D-IA"
    },
    "54726": {
      "school_short": "Southern Utah",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54832": {
      "school_short": "Southwest Baptist",
      "world": "hayes",
      "division": "D-II"
    },
    "54592": {
      "school_short": "Southwest Minnesota State",
      "world": "hayes",
      "division": "D-II"
    },
    "54883": {
      "school_short": "Springfield",
      "world": "hayes",
      "division": "D-III"
    },
    "54841": {
      "school_short": "St. Cloud State",
      "world": "hayes",
      "division": "D-II"
    },
    "54887": {
      "school_short": "St. John Fisher",
      "world": "hayes",
      "division": "D-III"
    },
    "54708": {
      "school_short": "St. Mary`s",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54957": {
      "school_short": "St. Olaf",
      "world": "hayes",
      "division": "D-III"
    },
    "54517": {
      "school_short": "Stanford",
      "world": "hayes",
      "division": "D-IA"
    },
    "54624": {
      "school_short": "Sul Ross State",
      "world": "hayes",
      "division": "D-III"
    },
    "54929": {
      "school_short": "Susquehanna",
      "world": "hayes",
      "division": "D-III"
    },
    "54822": {
      "school_short": "Texas A&M-Commerce",
      "world": "hayes",
      "division": "D-II"
    },
    "54625": {
      "school_short": "Texas Lutheran",
      "world": "hayes",
      "division": "D-III"
    },
    "54660": {
      "school_short": "Texas Tech",
      "world": "hayes",
      "division": "D-IA"
    },
    "54552": {
      "school_short": "Citadel",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54910": {
      "school_short": "Thiel",
      "world": "hayes",
      "division": "D-III"
    },
    "54762": {
      "school_short": "Towson",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54678": {
      "school_short": "Troy State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54830": {
      "school_short": "Truman State",
      "world": "hayes",
      "division": "D-II"
    },
    "54977": {
      "school_short": "Tufts",
      "world": "hayes",
      "division": "D-III"
    },
    "54867": {
      "school_short": "Tusculum",
      "world": "hayes",
      "division": "D-II"
    },
    "54924": {
      "school_short": "Brockport",
      "world": "hayes",
      "division": "D-III"
    },
    "54752": {
      "school_short": "Robert Morris",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54989": {
      "school_short": "New Jersey",
      "world": "hayes",
      "division": "D-III"
    },
    "55029": {
      "school_short": "Otterbein",
      "world": "hayes",
      "division": "D-III"
    },
    "54988": {
      "school_short": "Cortland",
      "world": "hayes",
      "division": "D-III"
    },
    "54744": {
      "school_short": "Siena",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55019": {
      "school_short": "Stillman",
      "world": "hayes",
      "division": "D-III"
    },
    "54823": {
      "school_short": "Texas A&M-Kingsville",
      "world": "hayes",
      "division": "D-II"
    },
    "54664": {
      "school_short": "Syracuse",
      "world": "hayes",
      "division": "D-IA"
    },
    "54815": {
      "school_short": "SE Oklahoma-Durant",
      "world": "hayes",
      "division": "D-II"
    },
    "54768": {
      "school_short": "St. Peter`s",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54489": {
      "school_short": "Texas Christian",
      "world": "hayes",
      "division": "D-IA"
    },
    "54840": {
      "school_short": "South Dakota State",
      "world": "hayes",
      "division": "D-II"
    },
    "54773": {
      "school_short": "Southeast Missouri State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54569": {
      "school_short": "Southern-Baton Rouge",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54942": {
      "school_short": "St. Norbert",
      "world": "hayes",
      "division": "D-III"
    },
    "54976": {
      "school_short": "Trinity",
      "world": "hayes",
      "division": "D-III"
    },
    "54810": {
      "school_short": "Arkansas-Monticello",
      "world": "hayes",
      "division": "D-II"
    },
    "54775": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54488": {
      "school_short": "Central Florida",
      "world": "hayes",
      "division": "D-IA"
    },
    "54818": {
      "school_short": "Central Oklahoma",
      "world": "hayes",
      "division": "D-II"
    },
    "54599": {
      "school_short": "Charleston",
      "world": "hayes",
      "division": "D-II"
    },
    "54947": {
      "school_short": "Chicago",
      "world": "hayes",
      "division": "D-III"
    },
    "54909": {
      "school_short": "Dubuque",
      "world": "hayes",
      "division": "D-III"
    },
    "54609": {
      "school_short": "Tuskegee",
      "world": "hayes",
      "division": "D-II"
    },
    "54587": {
      "school_short": "Stonehill",
      "world": "hayes",
      "division": "D-II"
    },
    "54529": {
      "school_short": "Arkansas",
      "world": "hayes",
      "division": "D-IA"
    },
    "54734": {
      "school_short": "Princeton",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55050": {
      "school_short": "Trinity (TX)",
      "world": "hayes",
      "division": "D-III"
    },
    "54614": {
      "school_short": "Saint Joseph`s",
      "world": "hayes",
      "division": "D-II"
    },
    "54798": {
      "school_short": "Northwood",
      "world": "hayes",
      "division": "D-II"
    },
    "54764": {
      "school_short": "Tennessee Tech",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55067": {
      "school_short": "Thomas More",
      "world": "hayes",
      "division": "D-III"
    },
    "54663": {
      "school_short": "Rutgers",
      "world": "hayes",
      "division": "D-IA"
    },
    "55062": {
      "school_short": "Shenandoah",
      "world": "hayes",
      "division": "D-III"
    },
    "54953": {
      "school_short": "St. John`s",
      "world": "hayes",
      "division": "D-III"
    },
    "54936": {
      "school_short": "Salisbury",
      "world": "hayes",
      "division": "D-III"
    },
    "54637": {
      "school_short": "St. Lawrence",
      "world": "hayes",
      "division": "D-III"
    },
    "54661": {
      "school_short": "Texas A&M",
      "world": "hayes",
      "division": "D-IA"
    },
    "54787": {
      "school_short": "St. Augustine`s",
      "world": "hayes",
      "division": "D-II"
    },
    "54817": {
      "school_short": "Tarleton State",
      "world": "hayes",
      "division": "D-II"
    },
    "54879": {
      "school_short": "Coast Guard",
      "world": "hayes",
      "division": "D-III"
    },
    "54799": {
      "school_short": "Findlay",
      "world": "hayes",
      "division": "D-II"
    },
    "54481": {
      "school_short": "Iowa",
      "world": "hayes",
      "division": "D-IA"
    },
    "54524": {
      "school_short": "Kentucky",
      "world": "hayes",
      "division": "D-IA"
    },
    "54533": {
      "school_short": "Louisiana Lafayette",
      "world": "hayes",
      "division": "D-IA"
    },
    "54699": {
      "school_short": "Maine",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54621": {
      "school_short": "Mary Hardin-Baylor",
      "world": "hayes",
      "division": "D-III"
    },
    "54647": {
      "school_short": "Maryland",
      "world": "hayes",
      "division": "D-IA"
    },
    "54965": {
      "school_short": "UMass-Dartmouth",
      "world": "hayes",
      "division": "D-III"
    },
    "54486": {
      "school_short": "Memphis",
      "world": "hayes",
      "division": "D-IA"
    },
    "54648": {
      "school_short": "Miami (FL)",
      "world": "hayes",
      "division": "D-IA"
    },
    "54530": {
      "school_short": "Ole Miss",
      "world": "hayes",
      "division": "D-IA"
    },
    "54653": {
      "school_short": "Missouri",
      "world": "hayes",
      "division": "D-IA"
    },
    "54833": {
      "school_short": "Missouri-Rolla",
      "world": "hayes",
      "division": "D-II"
    },
    "54571": {
      "school_short": "Nebraska-Omaha",
      "world": "hayes",
      "division": "D-II"
    },
    "54690": {
      "school_short": "Nevada",
      "world": "hayes",
      "division": "D-IA"
    },
    "54682": {
      "school_short": "New Mexico",
      "world": "hayes",
      "division": "D-IA"
    },
    "54474": {
      "school_short": "Michigan",
      "world": "hayes",
      "division": "D-IA"
    },
    "54595": {
      "school_short": "Minnesota-Duluth",
      "world": "hayes",
      "division": "D-II"
    },
    "54688": {
      "school_short": "UNLV",
      "world": "hayes",
      "division": "D-IA"
    },
    "54880": {
      "school_short": "Merchant Marine",
      "world": "hayes",
      "division": "D-III"
    },
    "54638": {
      "school_short": "Union (NY)",
      "world": "hayes",
      "division": "D-III"
    },
    "54491": {
      "school_short": "Alabama Birmingham",
      "world": "hayes",
      "division": "D-IA"
    },
    "54700": {
      "school_short": "New Hampshire",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54499": {
      "school_short": "Buffalo",
      "world": "hayes",
      "division": "D-IA"
    },
    "54528": {
      "school_short": "Alabama",
      "world": "hayes",
      "division": "D-IA"
    },
    "54593": {
      "school_short": "Minnesota-Crookston",
      "world": "hayes",
      "division": "D-II"
    },
    "54534": {
      "school_short": "Louisiana Monroe",
      "world": "hayes",
      "division": "D-IA"
    },
    "54714": {
      "school_short": "Texas State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54805": {
      "school_short": "Central Arkansas",
      "world": "hayes",
      "division": "D-II"
    },
    "54861": {
      "school_short": "Nebraska-Kearney",
      "world": "hayes",
      "division": "D-II"
    },
    "55054": {
      "school_short": "La Verne",
      "world": "hayes",
      "division": "D-III"
    },
    "54694": {
      "school_short": "Massachusetts",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54677": {
      "school_short": "Montana",
      "world": "hayes",
      "division": "D-IA"
    },
    "54781": {
      "school_short": "Virginia Union",
      "world": "hayes",
      "division": "D-II"
    },
    "55001": {
      "school_short": "Wabash",
      "world": "hayes",
      "division": "D-III"
    },
    "54722": {
      "school_short": "Northern Iowa",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54876": {
      "school_short": "Rochester",
      "world": "hayes",
      "division": "D-III"
    },
    "54523": {
      "school_short": "South Carolina",
      "world": "hayes",
      "division": "D-IA"
    },
    "54573": {
      "school_short": "South Dakota",
      "world": "hayes",
      "division": "D-II"
    },
    "54671": {
      "school_short": "South Florida",
      "world": "hayes",
      "division": "D-IA"
    },
    "54515": {
      "school_short": "Southern California",
      "world": "hayes",
      "division": "D-IA"
    },
    "54557": {
      "school_short": "Tennessee-Chattanooga",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54765": {
      "school_short": "Tennessee-Martin",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54502": {
      "school_short": "Toledo",
      "world": "hayes",
      "division": "D-IA"
    },
    "54485": {
      "school_short": "Tulsa",
      "world": "hayes",
      "division": "D-IA"
    },
    "54683": {
      "school_short": "Utah",
      "world": "hayes",
      "division": "D-IA"
    },
    "54643": {
      "school_short": "Virginia",
      "world": "hayes",
      "division": "D-IA"
    },
    "55069": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "hayes",
      "division": "D-III"
    },
    "55070": {
      "school_short": "Wisconsin-La Crosse",
      "world": "hayes",
      "division": "D-III"
    },
    "55072": {
      "school_short": "Wisconsin-River Falls",
      "world": "hayes",
      "division": "D-III"
    },
    "55073": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "hayes",
      "division": "D-III"
    },
    "55076": {
      "school_short": "Wisconsin-Stout",
      "world": "hayes",
      "division": "D-III"
    },
    "54594": {
      "school_short": "Winona State",
      "world": "hayes",
      "division": "D-II"
    },
    "54539": {
      "school_short": "Dayton",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54754": {
      "school_short": "Stony Brook",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54806": {
      "school_short": "West Alabama",
      "world": "hayes",
      "division": "D-II"
    },
    "54693": {
      "school_short": "Delaware",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54511": {
      "school_short": "California",
      "world": "hayes",
      "division": "D-IA"
    },
    "54471": {
      "school_short": "Illinois",
      "world": "hayes",
      "division": "D-IA"
    },
    "54514": {
      "school_short": "Arizona",
      "world": "hayes",
      "division": "D-IA"
    },
    "54520": {
      "school_short": "Tennessee",
      "world": "hayes",
      "division": "D-IA"
    },
    "54669": {
      "school_short": "Louisville",
      "world": "hayes",
      "division": "D-IA"
    },
    "54493": {
      "school_short": "Houston",
      "world": "hayes",
      "division": "D-IA"
    },
    "54540": {
      "school_short": "San Diego",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54655": {
      "school_short": "Colorado",
      "world": "hayes",
      "division": "D-IA"
    },
    "54494": {
      "school_short": "Southern Mississippi",
      "world": "hayes",
      "division": "D-IA"
    },
    "54665": {
      "school_short": "Temple",
      "world": "hayes",
      "division": "D-IA"
    },
    "54519": {
      "school_short": "Georgia",
      "world": "hayes",
      "division": "D-IA"
    },
    "54516": {
      "school_short": "UCLA",
      "world": "hayes",
      "division": "D-IA"
    },
    "54794": {
      "school_short": "Indianapolis",
      "world": "hayes",
      "division": "D-II"
    },
    "54689": {
      "school_short": "Hawaii",
      "world": "hayes",
      "division": "D-IA"
    },
    "54695": {
      "school_short": "Rhode Island",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55074": {
      "school_short": "Wisconsin-Whitewater",
      "world": "hayes",
      "division": "D-III"
    },
    "54676": {
      "school_short": "Utah State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54888": {
      "school_short": "Utica",
      "world": "hayes",
      "division": "D-III"
    },
    "54812": {
      "school_short": "Valdosta State",
      "world": "hayes",
      "division": "D-II"
    },
    "54522": {
      "school_short": "Vanderbilt",
      "world": "hayes",
      "division": "D-IA"
    },
    "54780": {
      "school_short": "Virginia State",
      "world": "hayes",
      "division": "D-II"
    },
    "54756": {
      "school_short": "Wagner",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54482": {
      "school_short": "Notre Dame",
      "world": "hayes",
      "division": "D-IA"
    },
    "54508": {
      "school_short": "Oregon",
      "world": "hayes",
      "division": "D-IA"
    },
    "55012": {
      "school_short": "Puget Sound",
      "world": "hayes",
      "division": "D-III"
    },
    "54658": {
      "school_short": "Texas",
      "world": "hayes",
      "division": "D-IA"
    },
    "55075": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "hayes",
      "division": "D-III"
    },
    "54811": {
      "school_short": "North Alabama",
      "world": "hayes",
      "division": "D-II"
    },
    "54572": {
      "school_short": "North Dakota",
      "world": "hayes",
      "division": "D-II"
    },
    "54675": {
      "school_short": "North Texas",
      "world": "hayes",
      "division": "D-IA"
    },
    "54649": {
      "school_short": "Virginia Tech",
      "world": "hayes",
      "division": "D-IA"
    },
    "54912": {
      "school_short": "Waynesburg",
      "world": "hayes",
      "division": "D-III"
    },
    "54824": {
      "school_short": "West Texas A&M",
      "world": "hayes",
      "division": "D-II"
    },
    "54601": {
      "school_short": "West Virginia State",
      "world": "hayes",
      "division": "D-II"
    },
    "54668": {
      "school_short": "West Virginia",
      "world": "hayes",
      "division": "D-IA"
    },
    "54718": {
      "school_short": "Western Illinois",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54719": {
      "school_short": "Western Kentucky",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54504": {
      "school_short": "Western Michigan",
      "world": "hayes",
      "division": "D-IA"
    },
    "54966": {
      "school_short": "Western New England",
      "world": "hayes",
      "division": "D-III"
    },
    "54862": {
      "school_short": "Western State (CO)",
      "world": "hayes",
      "division": "D-II"
    },
    "54577": {
      "school_short": "Western Washington",
      "world": "hayes",
      "division": "D-II"
    },
    "54971": {
      "school_short": "Westfield State",
      "world": "hayes",
      "division": "D-III"
    },
    "54731": {
      "school_short": "Pennsylvania",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54542": {
      "school_short": "VMI",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54900": {
      "school_short": "Wheaton",
      "world": "hayes",
      "division": "D-III"
    },
    "55055": {
      "school_short": "Redlands",
      "world": "hayes",
      "division": "D-III"
    },
    "54874": {
      "school_short": "West Virginia Wesleyan",
      "world": "hayes",
      "division": "D-II"
    },
    "54954": {
      "school_short": "St. Thomas",
      "world": "hayes",
      "division": "D-III"
    },
    "54667": {
      "school_short": "Pittsburgh",
      "world": "hayes",
      "division": "D-IA"
    },
    "54681": {
      "school_short": "UTEP",
      "world": "hayes",
      "division": "D-IA"
    },
    "54657": {
      "school_short": "Oklahoma",
      "world": "hayes",
      "division": "D-IA"
    },
    "55056": {
      "school_short": "Whittier",
      "world": "hayes",
      "division": "D-III"
    },
    "55013": {
      "school_short": "Whitworth",
      "world": "hayes",
      "division": "D-III"
    },
    "54935": {
      "school_short": "Widener",
      "world": "hayes",
      "division": "D-III"
    },
    "54930": {
      "school_short": "Wilkes",
      "world": "hayes",
      "division": "D-III"
    },
    "55014": {
      "school_short": "Willamette",
      "world": "hayes",
      "division": "D-III"
    },
    "54990": {
      "school_short": "William Paterson",
      "world": "hayes",
      "division": "D-III"
    },
    "54868": {
      "school_short": "Wingate",
      "world": "hayes",
      "division": "D-II"
    },
    "54918": {
      "school_short": "Wisconsin Lutheran",
      "world": "hayes",
      "division": "D-III"
    },
    "55002": {
      "school_short": "Wittenberg",
      "world": "hayes",
      "division": "D-III"
    },
    "54554": {
      "school_short": "Wofford",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54882": {
      "school_short": "Worcester Tech",
      "world": "hayes",
      "division": "D-III"
    },
    "54800": {
      "school_short": "Wayne State",
      "world": "hayes",
      "division": "D-II"
    },
    "54982": {
      "school_short": "Wesleyan",
      "world": "hayes",
      "division": "D-III"
    },
    "54600": {
      "school_short": "West Liberty State",
      "world": "hayes",
      "division": "D-II"
    },
    "54873": {
      "school_short": "West Virginia Tech",
      "world": "hayes",
      "division": "D-II"
    },
    "54732": {
      "school_short": "Yale",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54834": {
      "school_short": "Washburn-Topeka",
      "world": "hayes",
      "division": "D-II"
    },
    "54911": {
      "school_short": "Washington and Jefferson",
      "world": "hayes",
      "division": "D-III"
    },
    "54996": {
      "school_short": "Wesley",
      "world": "hayes",
      "division": "D-III"
    },
    "54844": {
      "school_short": "West Chester",
      "world": "hayes",
      "division": "D-II"
    },
    "54881": {
      "school_short": "Western Connecticut State",
      "world": "hayes",
      "division": "D-III"
    },
    "55051": {
      "school_short": "South-Sewanee",
      "world": "hayes",
      "division": "D-III"
    },
    "54509": {
      "school_short": "Washington",
      "world": "hayes",
      "division": "D-IA"
    },
    "54701": {
      "school_short": "Richmond",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54856": {
      "school_short": "Western New Mexico",
      "world": "hayes",
      "division": "D-II"
    },
    "54518": {
      "school_short": "Air Force",
      "world": "hayes",
      "division": "D-IA"
    },
    "54644": {
      "school_short": "Wake Forest",
      "world": "hayes",
      "division": "D-IA"
    },
    "54541": {
      "school_short": "Valparaiso",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54576": {
      "school_short": "Western Oregon",
      "world": "hayes",
      "division": "D-II"
    },
    "54553": {
      "school_short": "Western Carolina",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54804": {
      "school_short": "West Georgia",
      "world": "hayes",
      "division": "D-II"
    },
    "54960": {
      "school_short": "Westminster (PA)",
      "world": "hayes",
      "division": "D-III"
    },
    "54536": {
      "school_short": "Army",
      "world": "hayes",
      "division": "D-IA"
    },
    "54720": {
      "school_short": "Youngstown State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54634": {
      "school_short": "Ursinus",
      "world": "hayes",
      "division": "D-III"
    },
    "55039": {
      "school_short": "Washington and Lee",
      "world": "hayes",
      "division": "D-III"
    },
    "54684": {
      "school_short": "Wyoming",
      "world": "hayes",
      "division": "D-IA"
    },
    "50790": {
      "school_short": "St. Olaf",
      "world": "bryant",
      "division": "D-III"
    },
    "50234": {
      "school_short": "Texas State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50194": {
      "school_short": "Southern California",
      "world": "bryant",
      "division": "D-IA"
    },
    "49704": {
      "school_short": "Southwest Baptist",
      "world": "camp",
      "division": "D-II"
    },
    "49521": {
      "school_short": "Northern Michigan",
      "world": "rockne",
      "division": "D-II"
    },
    "51143": {
      "school_short": "Austin",
      "world": "wilkinson",
      "division": "D-III"
    },
    "49139": {
      "school_short": "Western Connecticut State",
      "world": "rockne",
      "division": "D-III"
    },
    "54948": {
      "school_short": "Washington (MO)",
      "world": "hayes",
      "division": "D-III"
    },
    "49734": {
      "school_short": "Chadron State",
      "world": "camp",
      "division": "D-II"
    },
    "49578": {
      "school_short": "California",
      "world": "camp",
      "division": "D-IA"
    },
    "49936": {
      "school_short": "Albright",
      "world": "camp",
      "division": "D-III"
    },
    "49417": {
      "school_short": "Siena",
      "world": "rockne",
      "division": "D-IAA"
    },
    "54510": {
      "school_short": "Washington State",
      "world": "hayes",
      "division": "D-IA"
    },
    "50682": {
      "school_short": "Western New Mexico",
      "world": "bryant",
      "division": "D-II"
    },
    "49080": {
      "school_short": "Angelo State",
      "world": "rockne",
      "division": "D-II"
    },
    "49116": {
      "school_short": "California (PA)",
      "world": "rockne",
      "division": "D-II"
    },
    "49522": {
      "school_short": "Saginaw Valley State",
      "world": "rockne",
      "division": "D-II"
    },
    "49582": {
      "school_short": "Southern California",
      "world": "camp",
      "division": "D-IA"
    },
    "49512": {
      "school_short": "Fayetteville State",
      "world": "rockne",
      "division": "D-II"
    },
    "48974": {
      "school_short": "Georgia",
      "world": "rockne",
      "division": "D-IA"
    },
    "54978": {
      "school_short": "Williams",
      "world": "hayes",
      "division": "D-III"
    },
    "49399": {
      "school_short": "Southeast Missouri State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49778": {
      "school_short": "Iowa State",
      "world": "camp",
      "division": "D-IA"
    },
    "49239": {
      "school_short": "Hiram",
      "world": "rockne",
      "division": "D-III"
    },
    "51012": {
      "school_short": "MacMurray",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50493": {
      "school_short": "Ferrum",
      "world": "bryant",
      "division": "D-III"
    },
    "52043": {
      "school_short": "Alabama",
      "world": "stagg",
      "division": "D-IA"
    },
    "52887": {
      "school_short": "Georgia",
      "world": "warner",
      "division": "D-IA"
    },
    "51121": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "wilkinson",
      "division": "D-III"
    },
    "50951": {
      "school_short": "West Chester",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51574": {
      "school_short": "Johns Hopkins",
      "world": "leahy",
      "division": "D-III"
    },
    "52434": {
      "school_short": "Jacksonville State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52329": {
      "school_short": "Fort Valley State",
      "world": "stagg",
      "division": "D-II"
    },
    "52346": {
      "school_short": "Mississippi",
      "world": "stagg",
      "division": "D-III"
    },
    "50328": {
      "school_short": "Concordia",
      "world": "bryant",
      "division": "D-II"
    },
    "52922": {
      "school_short": "Cornell",
      "world": "warner",
      "division": "D-IAA"
    },
    "51259": {
      "school_short": "SC State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50508": {
      "school_short": "Wisconsin-Whitewater",
      "world": "bryant",
      "division": "D-III"
    },
    "52561": {
      "school_short": "Indianapolis",
      "world": "stagg",
      "division": "D-II"
    },
    "53122": {
      "school_short": "Bethany",
      "world": "warner",
      "division": "D-III"
    },
    "54972": {
      "school_short": "Worcester State",
      "world": "hayes",
      "division": "D-III"
    },
    "49042": {
      "school_short": "East Tennessee State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "49294": {
      "school_short": "Tuskegee",
      "world": "rockne",
      "division": "D-II"
    },
    "50016": {
      "school_short": "San Diego",
      "world": "camp",
      "division": "D-IAA"
    },
    "50798": {
      "school_short": "Oregon State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51613": {
      "school_short": "Colorado",
      "world": "leahy",
      "division": "D-IA"
    },
    "50819": {
      "school_short": "Alabama",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "54707": {
      "school_short": "Weber State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54788": {
      "school_short": "Winston-Salem State",
      "world": "hayes",
      "division": "D-II"
    },
    "50872": {
      "school_short": "Appalachian State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50681": {
      "school_short": "Oklahoma Panhandle",
      "world": "bryant",
      "division": "D-II"
    },
    "50373": {
      "school_short": "Clemson",
      "world": "bryant",
      "division": "D-IA"
    },
    "49098": {
      "school_short": "Minnesota State-Mankato",
      "world": "rockne",
      "division": "D-II"
    },
    "50787": {
      "school_short": "St. Thomas",
      "world": "bryant",
      "division": "D-III"
    },
    "51282": {
      "school_short": "California State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "53096": {
      "school_short": "Juniata",
      "world": "warner",
      "division": "D-III"
    },
    "54598": {
      "school_short": "Wayne State",
      "world": "hayes",
      "division": "D-II"
    },
    "49085": {
      "school_short": "Central Missouri State",
      "world": "rockne",
      "division": "D-II"
    },
    "49965": {
      "school_short": "Northwestern",
      "world": "camp",
      "division": "D-IA"
    },
    "49188": {
      "school_short": "Wartburg",
      "world": "rockne",
      "division": "D-III"
    },
    "49586": {
      "school_short": "Georgia",
      "world": "camp",
      "division": "D-IA"
    },
    "52888": {
      "school_short": "Tennessee",
      "world": "warner",
      "division": "D-IA"
    },
    "49518": {
      "school_short": "Ashland",
      "world": "rockne",
      "division": "D-II"
    },
    "49071": {
      "school_short": "North Alabama",
      "world": "rockne",
      "division": "D-II"
    },
    "49404": {
      "school_short": "San Diego",
      "world": "rockne",
      "division": "D-IAA"
    },
    "52090": {
      "school_short": "Princeton",
      "world": "stagg",
      "division": "D-IAA"
    },
    "50944": {
      "school_short": "West Liberty State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "49529": {
      "school_short": "Menlo",
      "world": "rockne",
      "division": "D-III"
    },
    "50389": {
      "school_short": "Colorado",
      "world": "bryant",
      "division": "D-IA"
    },
    "52330": {
      "school_short": "Kentucky State",
      "world": "stagg",
      "division": "D-II"
    },
    "50350": {
      "school_short": "Johns Hopkins",
      "world": "bryant",
      "division": "D-III"
    },
    "49740": {
      "school_short": "Muhlenberg",
      "world": "camp",
      "division": "D-III"
    },
    "52722": {
      "school_short": "South Dakota State",
      "world": "warner",
      "division": "D-II"
    },
    "51279": {
      "school_short": "New Hampshire",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50855": {
      "school_short": "Florida International",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "52799": {
      "school_short": "Morehouse",
      "world": "warner",
      "division": "D-II"
    },
    "53236": {
      "school_short": "Wisconsin-River Falls",
      "world": "warner",
      "division": "D-III"
    },
    "52938": {
      "school_short": "NC A&T",
      "world": "warner",
      "division": "D-IAA"
    },
    "53125": {
      "school_short": "Curry",
      "world": "warner",
      "division": "D-III"
    },
    "52448": {
      "school_short": "Holy Cross",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52963": {
      "school_short": "Tennessee State",
      "world": "warner",
      "division": "D-IAA"
    },
    "51402": {
      "school_short": "St. Olaf",
      "world": "wilkinson",
      "division": "D-III"
    },
    "52136": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "stagg",
      "division": "D-II"
    },
    "52242": {
      "school_short": "Wheaton",
      "world": "stagg",
      "division": "D-III"
    },
    "51204": {
      "school_short": "Central Florida",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50582": {
      "school_short": "Penn State",
      "world": "bryant",
      "division": "D-IA"
    },
    "51423": {
      "school_short": "Tennessee",
      "world": "leahy",
      "division": "D-IA"
    },
    "53492": {
      "school_short": "BYU",
      "world": "heisman",
      "division": "D-IA"
    },
    "53255": {
      "school_short": "Middle Tennessee State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53424": {
      "school_short": "Miami (FL)",
      "world": "heisman",
      "division": "D-IA"
    },
    "55174": {
      "school_short": "Alabama State",
      "world": "yost",
      "division": "D-IAA"
    },
    "54324": {
      "school_short": "Salisbury",
      "world": "dobie",
      "division": "D-III"
    },
    "54014": {
      "school_short": "California Lutheran",
      "world": "dobie",
      "division": "D-III"
    },
    "55537": {
      "school_short": "Albright",
      "world": "yost",
      "division": "D-III"
    },
    "55175": {
      "school_short": "Alcorn State",
      "world": "yost",
      "division": "D-IAA"
    },
    "54635": {
      "school_short": "Hobart",
      "world": "hayes",
      "division": "D-III"
    },
    "54496": {
      "school_short": "Akron",
      "world": "hayes",
      "division": "D-IA"
    },
    "55645": {
      "school_short": "Bridgewater",
      "world": "yost",
      "division": "D-III"
    },
    "54603": {
      "school_short": "East Stroudsburg",
      "world": "hayes",
      "division": "D-II"
    },
    "53943": {
      "school_short": "East Tennessee State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54023": {
      "school_short": "Hobart",
      "world": "dobie",
      "division": "D-III"
    },
    "53726": {
      "school_short": "Bethel",
      "world": "heisman",
      "division": "D-III"
    },
    "52273": {
      "school_short": "Bates",
      "world": "stagg",
      "division": "D-III"
    },
    "55192": {
      "school_short": "Bryant",
      "world": "yost",
      "division": "D-II"
    },
    "54034": {
      "school_short": "North Carolina State",
      "world": "dobie",
      "division": "D-IA"
    },
    "53592": {
      "school_short": "Findlay",
      "world": "heisman",
      "division": "D-II"
    },
    "53448": {
      "school_short": "DePaul",
      "world": "heisman",
      "division": "D-IA"
    },
    "52035": {
      "school_short": "Tennessee",
      "world": "stagg",
      "division": "D-IA"
    },
    "50428": {
      "school_short": "Massachusetts Maritime",
      "world": "bryant",
      "division": "D-III"
    },
    "53550": {
      "school_short": "NC A&T",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54906": {
      "school_short": "Wartburg",
      "world": "hayes",
      "division": "D-III"
    },
    "51128": {
      "school_short": "Kentucky State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "54360": {
      "school_short": "Worcester State",
      "world": "dobie",
      "division": "D-III"
    },
    "51319": {
      "school_short": "Humboldt State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "54200": {
      "school_short": "Valdosta State",
      "world": "dobie",
      "division": "D-II"
    },
    "51488": {
      "school_short": "Western Carolina",
      "world": "leahy",
      "division": "D-IAA"
    },
    "54575": {
      "school_short": "Humboldt State",
      "world": "hayes",
      "division": "D-II"
    },
    "50262": {
      "school_short": "Georgia Southern",
      "world": "bryant",
      "division": "D-IAA"
    },
    "53259": {
      "school_short": "Army",
      "world": "heisman",
      "division": "D-IA"
    },
    "54267": {
      "school_short": "Coast Guard",
      "world": "dobie",
      "division": "D-III"
    },
    "53229": {
      "school_short": "Maryville",
      "world": "warner",
      "division": "D-III"
    },
    "51860": {
      "school_short": "Florida A&M",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52553": {
      "school_short": "North Carolina Central",
      "world": "stagg",
      "division": "D-II"
    },
    "51431": {
      "school_short": "Alabama",
      "world": "leahy",
      "division": "D-IA"
    },
    "53056": {
      "school_short": "Greenville",
      "world": "warner",
      "division": "D-III"
    },
    "53800": {
      "school_short": "Mount Union",
      "world": "heisman",
      "division": "D-III"
    },
    "51941": {
      "school_short": "Pace",
      "world": "leahy",
      "division": "D-II"
    },
    "50481": {
      "school_short": "Millsaps",
      "world": "bryant",
      "division": "D-III"
    },
    "52533": {
      "school_short": "Stonehill",
      "world": "stagg",
      "division": "D-II"
    },
    "50563": {
      "school_short": "Rutgers",
      "world": "bryant",
      "division": "D-IA"
    },
    "54626": {
      "school_short": "California Lutheran",
      "world": "hayes",
      "division": "D-III"
    },
    "51240": {
      "school_short": "San Diego",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51961": {
      "school_short": "Johnson C. Smith",
      "world": "leahy",
      "division": "D-II"
    },
    "54838": {
      "school_short": "Minnesota State-Mankato",
      "world": "hayes",
      "division": "D-II"
    },
    "50818": {
      "school_short": "Mississippi State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "49871": {
      "school_short": "Rose-Hulman",
      "world": "camp",
      "division": "D-III"
    },
    "52024": {
      "school_short": "Washington",
      "world": "stagg",
      "division": "D-IA"
    },
    "54850": {
      "school_short": "Slippery Rock",
      "world": "hayes",
      "division": "D-II"
    },
    "49890": {
      "school_short": "Westminster (MO)",
      "world": "camp",
      "division": "D-III"
    },
    "50959": {
      "school_short": "Colorado School of Mines",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51360": {
      "school_short": "Ferris State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "52674": {
      "school_short": "Maine",
      "world": "warner",
      "division": "D-IAA"
    },
    "51899": {
      "school_short": "St. Mary`s",
      "world": "leahy",
      "division": "D-IAA"
    },
    "53368": {
      "school_short": "East Stroudsburg",
      "world": "heisman",
      "division": "D-II"
    },
    "54767": {
      "school_short": "Marist",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55432": {
      "school_short": "Angelo State",
      "world": "yost",
      "division": "D-II"
    },
    "54109": {
      "school_short": "Missouri State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51537": {
      "school_short": "Pittsburg State",
      "world": "leahy",
      "division": "D-II"
    },
    "52784": {
      "school_short": "Wingate",
      "world": "warner",
      "division": "D-II"
    },
    "53589": {
      "school_short": "Hillsdale",
      "world": "heisman",
      "division": "D-II"
    },
    "55173": {
      "school_short": "Alabama A&M",
      "world": "yost",
      "division": "D-IAA"
    },
    "54551": {
      "school_short": "Georgia Southern",
      "world": "hayes",
      "division": "D-IAA"
    },
    "53357": {
      "school_short": "Southwest Minnesota State",
      "world": "heisman",
      "division": "D-II"
    },
    "53914": {
      "school_short": "LSU",
      "world": "dobie",
      "division": "D-IA"
    },
    "51605": {
      "school_short": "Maryland",
      "world": "leahy",
      "division": "D-IA"
    },
    "55634": {
      "school_short": "Capital",
      "world": "yost",
      "division": "D-III"
    },
    "55196": {
      "school_short": "Assumption",
      "world": "yost",
      "division": "D-II"
    },
    "55561": {
      "school_short": "Augsburg",
      "world": "yost",
      "division": "D-III"
    },
    "55449": {
      "school_short": "Augustana",
      "world": "yost",
      "division": "D-II"
    },
    "55511": {
      "school_short": "Augustana (IL)",
      "world": "yost",
      "division": "D-III"
    },
    "55669": {
      "school_short": "Averett",
      "world": "yost",
      "division": "D-III"
    },
    "55117": {
      "school_short": "Ball State",
      "world": "yost",
      "division": "D-IA"
    },
    "55274": {
      "school_short": "Baylor",
      "world": "yost",
      "division": "D-IA"
    },
    "55202": {
      "school_short": "Bemidji State",
      "world": "yost",
      "division": "D-II"
    },
    "55217": {
      "school_short": "Benedict",
      "world": "yost",
      "division": "D-II"
    },
    "55191": {
      "school_short": "Bentley",
      "world": "yost",
      "division": "D-II"
    },
    "55570": {
      "school_short": "Bethany",
      "world": "yost",
      "division": "D-III"
    },
    "55562": {
      "school_short": "Bethel",
      "world": "yost",
      "division": "D-III"
    },
    "55214": {
      "school_short": "Bloomsburg",
      "world": "yost",
      "division": "D-II"
    },
    "55292": {
      "school_short": "Boise State",
      "world": "yost",
      "division": "D-IA"
    },
    "55339": {
      "school_short": "Brown",
      "world": "yost",
      "division": "D-IAA"
    },
    "55347": {
      "school_short": "Bucknell",
      "world": "yost",
      "division": "D-IAA"
    },
    "55513": {
      "school_short": "Buena Vista",
      "world": "yost",
      "division": "D-III"
    },
    "55149": {
      "school_short": "Butler",
      "world": "yost",
      "division": "D-IAA"
    },
    "55297": {
      "school_short": "Fresno State",
      "world": "yost",
      "division": "D-IA"
    },
    "55619": {
      "school_short": "Carnegie Mellon",
      "world": "yost",
      "division": "D-III"
    },
    "55555": {
      "school_short": "Carroll",
      "world": "yost",
      "division": "D-III"
    },
    "55143": {
      "school_short": "Arkansas State",
      "world": "yost",
      "division": "D-IA"
    },
    "55155": {
      "school_short": "Austin Peay",
      "world": "yost",
      "division": "D-IAA"
    },
    "55653": {
      "school_short": "Bluffton",
      "world": "yost",
      "division": "D-III"
    },
    "55592": {
      "school_short": "Bowdoin",
      "world": "yost",
      "division": "D-III"
    },
    "55567": {
      "school_short": "Carleton",
      "world": "yost",
      "division": "D-III"
    },
    "55137": {
      "school_short": "Auburn",
      "world": "yost",
      "division": "D-IA"
    },
    "55591": {
      "school_short": "Bates",
      "world": "yost",
      "division": "D-III"
    },
    "55476": {
      "school_short": "Catawba",
      "world": "yost",
      "division": "D-II"
    },
    "55159": {
      "school_short": "Charleston Southern",
      "world": "yost",
      "division": "D-IAA"
    },
    "55458": {
      "school_short": "Clarion",
      "world": "yost",
      "division": "D-II"
    },
    "55586": {
      "school_short": "Colby",
      "world": "yost",
      "division": "D-III"
    },
    "55671": {
      "school_short": "Ferrum",
      "world": "yost",
      "division": "D-III"
    },
    "55670": {
      "school_short": "Christopher Newport",
      "world": "yost",
      "division": "D-III"
    },
    "55507": {
      "school_short": "Benedictine",
      "world": "yost",
      "division": "D-III"
    },
    "54224": {
      "school_short": "Cheyney",
      "world": "dobie",
      "division": "D-II"
    },
    "55234": {
      "school_short": "Austin",
      "world": "yost",
      "division": "D-III"
    },
    "54459": {
      "school_short": "Wisconsin-Platteville",
      "world": "dobie",
      "division": "D-III"
    },
    "55525": {
      "school_short": "Adrian",
      "world": "yost",
      "division": "D-III"
    },
    "53245": {
      "school_short": "Vanderbilt",
      "world": "heisman",
      "division": "D-IA"
    },
    "55082": {
      "school_short": "Colorado State",
      "world": "yost",
      "division": "D-IA"
    },
    "55527": {
      "school_short": "Alma",
      "world": "yost",
      "division": "D-III"
    },
    "53097": {
      "school_short": "Lebanon Valley",
      "world": "warner",
      "division": "D-III"
    },
    "55652": {
      "school_short": "Anderson",
      "world": "yost",
      "division": "D-III"
    },
    "55604": {
      "school_short": "Chapman",
      "world": "yost",
      "division": "D-III"
    },
    "55125": {
      "school_short": "Arizona State",
      "world": "yost",
      "division": "D-IA"
    },
    "55413": {
      "school_short": "Arkansas Tech",
      "world": "yost",
      "division": "D-II"
    },
    "53803": {
      "school_short": "Heidelberg",
      "world": "heisman",
      "division": "D-III"
    },
    "54642": {
      "school_short": "North Carolina",
      "world": "hayes",
      "division": "D-IA"
    },
    "55469": {
      "school_short": "Adams State",
      "world": "yost",
      "division": "D-II"
    },
    "55585": {
      "school_short": "Amherst",
      "world": "yost",
      "division": "D-III"
    },
    "53359": {
      "school_short": "Winona State",
      "world": "heisman",
      "division": "D-II"
    },
    "53439": {
      "school_short": "Rutgers",
      "world": "heisman",
      "division": "D-IA"
    },
    "53753": {
      "school_short": "Tufts",
      "world": "heisman",
      "division": "D-III"
    },
    "55609": {
      "school_short": "Allegheny",
      "world": "yost",
      "division": "D-III"
    },
    "55262": {
      "school_short": "Boston",
      "world": "yost",
      "division": "D-IA"
    },
    "54060": {
      "school_short": "DePaul",
      "world": "dobie",
      "division": "D-IA"
    },
    "55080": {
      "school_short": "Carthage",
      "world": "hayes",
      "division": "D-III"
    },
    "54040": {
      "school_short": "Nebraska",
      "world": "dobie",
      "division": "D-IA"
    },
    "53963": {
      "school_short": "Humboldt State",
      "world": "dobie",
      "division": "D-II"
    },
    "54054": {
      "school_short": "Connecticut",
      "world": "dobie",
      "division": "D-IA"
    },
    "55643": {
      "school_short": "Mount St. Joseph",
      "world": "yost",
      "division": "D-III"
    },
    "55563": {
      "school_short": "Concordia",
      "world": "yost",
      "division": "D-III"
    },
    "55633": {
      "school_short": "Baldwin-Wallace",
      "world": "yost",
      "division": "D-III"
    },
    "55603": {
      "school_short": "Buffalo",
      "world": "yost",
      "division": "D-III"
    },
    "55610": {
      "school_short": "Wooster",
      "world": "yost",
      "division": "D-III"
    },
    "55124": {
      "school_short": "BYU",
      "world": "yost",
      "division": "D-IA"
    },
    "55190": {
      "school_short": "American International",
      "world": "yost",
      "division": "D-II"
    },
    "55340": {
      "school_short": "Columbia",
      "world": "yost",
      "division": "D-IAA"
    },
    "55357": {
      "school_short": "Bethune-Cookman",
      "world": "yost",
      "division": "D-IAA"
    },
    "55646": {
      "school_short": "Catholic",
      "world": "yost",
      "division": "D-III"
    },
    "55113": {
      "school_short": "Bowling Green",
      "world": "yost",
      "division": "D-IA"
    },
    "55208": {
      "school_short": "Concordia",
      "world": "yost",
      "division": "D-II"
    },
    "55345": {
      "school_short": "Cornell",
      "world": "yost",
      "division": "D-IAA"
    },
    "55341": {
      "school_short": "Dartmouth",
      "world": "yost",
      "division": "D-IAA"
    },
    "55156": {
      "school_short": "Davidson",
      "world": "yost",
      "division": "D-IAA"
    },
    "55615": {
      "school_short": "Denison",
      "world": "yost",
      "division": "D-III"
    },
    "55284": {
      "school_short": "DePaul",
      "world": "yost",
      "division": "D-IA"
    },
    "55658": {
      "school_short": "DePauw",
      "world": "yost",
      "division": "D-III"
    },
    "55150": {
      "school_short": "Drake",
      "world": "yost",
      "division": "D-IAA"
    },
    "55354": {
      "school_short": "Duquesne",
      "world": "yost",
      "division": "D-IAA"
    },
    "55616": {
      "school_short": "Earlham",
      "world": "yost",
      "division": "D-III"
    },
    "55167": {
      "school_short": "East Tennessee State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55375": {
      "school_short": "Eastern Illinois",
      "world": "yost",
      "division": "D-IAA"
    },
    "55433": {
      "school_short": "Eastern New Mexico",
      "world": "yost",
      "division": "D-II"
    },
    "55419": {
      "school_short": "Delta State",
      "world": "yost",
      "division": "D-II"
    },
    "55692": {
      "school_short": "Carthage",
      "world": "yost",
      "division": "D-III"
    },
    "55514": {
      "school_short": "Central",
      "world": "yost",
      "division": "D-III"
    },
    "55369": {
      "school_short": "Central Connecticut",
      "world": "yost",
      "division": "D-IAA"
    },
    "55459": {
      "school_short": "Edinboro",
      "world": "yost",
      "division": "D-II"
    },
    "55390": {
      "school_short": "Elizabeth City",
      "world": "yost",
      "division": "D-II"
    },
    "55509": {
      "school_short": "Elmhurst",
      "world": "yost",
      "division": "D-III"
    },
    "55543": {
      "school_short": "Fairleigh Dickinson",
      "world": "yost",
      "division": "D-III"
    },
    "55580": {
      "school_short": "Fitchburg State",
      "world": "yost",
      "division": "D-III"
    },
    "55595": {
      "school_short": "Framingham State",
      "world": "yost",
      "division": "D-III"
    },
    "55654": {
      "school_short": "Franklin",
      "world": "yost",
      "division": "D-III"
    },
    "55162": {
      "school_short": "Furman",
      "world": "yost",
      "division": "D-IAA"
    },
    "55394": {
      "school_short": "Gannon",
      "world": "yost",
      "division": "D-II"
    },
    "55672": {
      "school_short": "Greensboro",
      "world": "yost",
      "division": "D-III"
    },
    "55504": {
      "school_short": "Greenville",
      "world": "yost",
      "division": "D-III"
    },
    "55556": {
      "school_short": "Grinnell",
      "world": "yost",
      "division": "D-III"
    },
    "55571": {
      "school_short": "Grove City",
      "world": "yost",
      "division": "D-III"
    },
    "55648": {
      "school_short": "Guilford",
      "world": "yost",
      "division": "D-III"
    },
    "55568": {
      "school_short": "Hamline",
      "world": "yost",
      "division": "D-III"
    },
    "55414": {
      "school_short": "Harding",
      "world": "yost",
      "division": "D-II"
    },
    "55497": {
      "school_short": "Hartwick",
      "world": "yost",
      "division": "D-III"
    },
    "55420": {
      "school_short": "Henderson State",
      "world": "yost",
      "division": "D-II"
    },
    "55617": {
      "school_short": "Hiram",
      "world": "yost",
      "division": "D-III"
    },
    "55309": {
      "school_short": "Hofstra",
      "world": "yost",
      "division": "D-IAA"
    },
    "55359": {
      "school_short": "Howard",
      "world": "yost",
      "division": "D-IAA"
    },
    "55457": {
      "school_short": "California (PA)",
      "world": "yost",
      "division": "D-II"
    },
    "55200": {
      "school_short": "Concord",
      "world": "yost",
      "division": "D-II"
    },
    "55487": {
      "school_short": "Albany State",
      "world": "yost",
      "division": "D-II"
    },
    "55655": {
      "school_short": "Hanover",
      "world": "yost",
      "division": "D-III"
    },
    "55657": {
      "school_short": "Centre",
      "world": "yost",
      "division": "D-III"
    },
    "55186": {
      "school_short": "Central Washington",
      "world": "yost",
      "division": "D-II"
    },
    "55351": {
      "school_short": "Florida A&M",
      "world": "yost",
      "division": "D-IAA"
    },
    "55620": {
      "school_short": "Case Western",
      "world": "yost",
      "division": "D-III"
    },
    "55528": {
      "school_short": "Hope",
      "world": "yost",
      "division": "D-III"
    },
    "55644": {
      "school_short": "Defiance",
      "world": "yost",
      "division": "D-III"
    },
    "55425": {
      "school_short": "East Central",
      "world": "yost",
      "division": "D-II"
    },
    "55315": {
      "school_short": "California State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55526": {
      "school_short": "Albion",
      "world": "yost",
      "division": "D-III"
    },
    "55564": {
      "school_short": "Gustavus Adolphus",
      "world": "yost",
      "division": "D-III"
    },
    "55389": {
      "school_short": "Bowie State",
      "world": "yost",
      "division": "D-II"
    },
    "55238": {
      "school_short": "California Lutheran",
      "world": "yost",
      "division": "D-III"
    },
    "55502": {
      "school_short": "Concordia (WI)",
      "world": "yost",
      "division": "D-III"
    },
    "55161": {
      "school_short": "Appalachian State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55228": {
      "school_short": "East Texas Baptist",
      "world": "yost",
      "division": "D-III"
    },
    "55675": {
      "school_short": "Chowan",
      "world": "yost",
      "division": "D-III"
    },
    "55252": {
      "school_short": "Duke",
      "world": "yost",
      "division": "D-IA"
    },
    "55549": {
      "school_short": "Beloit",
      "world": "yost",
      "division": "D-III"
    },
    "55316": {
      "school_short": "Eastern Washington",
      "world": "yost",
      "division": "D-IAA"
    },
    "55579": {
      "school_short": "Bridgewater State",
      "world": "yost",
      "division": "D-III"
    },
    "55463": {
      "school_short": "Chadron State",
      "world": "yost",
      "division": "D-II"
    },
    "55401": {
      "school_short": "Ashland",
      "world": "yost",
      "division": "D-II"
    },
    "55508": {
      "school_short": "Concordia (IL)",
      "world": "yost",
      "division": "D-III"
    },
    "55519": {
      "school_short": "Coe",
      "world": "yost",
      "division": "D-III"
    },
    "55573": {
      "school_short": "Curry",
      "world": "yost",
      "division": "D-III"
    },
    "55342": {
      "school_short": "Harvard",
      "world": "yost",
      "division": "D-IAA"
    },
    "55118": {
      "school_short": "Central Michigan",
      "world": "yost",
      "division": "D-IA"
    },
    "55179": {
      "school_short": "Grambling State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55240": {
      "school_short": "Dickinson",
      "world": "yost",
      "division": "D-III"
    },
    "55303": {
      "school_short": "William & Mary",
      "world": "yost",
      "division": "D-IAA"
    },
    "55628": {
      "school_short": "Frostburg State",
      "world": "yost",
      "division": "D-III"
    },
    "55371": {
      "school_short": "Georgetown",
      "world": "yost",
      "division": "D-IAA"
    },
    "55095": {
      "school_short": "East Carolina",
      "world": "yost",
      "division": "D-IA"
    },
    "55639": {
      "school_short": "Heidelberg",
      "world": "yost",
      "division": "D-III"
    },
    "55538": {
      "school_short": "Delaware Valley",
      "world": "yost",
      "division": "D-III"
    },
    "55395": {
      "school_short": "Fayetteville State",
      "world": "yost",
      "division": "D-II"
    },
    "55335": {
      "school_short": "Florida International",
      "world": "yost",
      "division": "D-IAA"
    },
    "55483": {
      "school_short": "Glenville",
      "world": "yost",
      "division": "D-II"
    },
    "55168": {
      "school_short": "Elon",
      "world": "yost",
      "division": "D-IAA"
    },
    "55574": {
      "school_short": "Endicott",
      "world": "yost",
      "division": "D-III"
    },
    "55503": {
      "school_short": "Eureka",
      "world": "yost",
      "division": "D-III"
    },
    "55465": {
      "school_short": "Fort Hays State",
      "world": "yost",
      "division": "D-II"
    },
    "55092": {
      "school_short": "Indiana",
      "world": "yost",
      "division": "D-IA"
    },
    "55268": {
      "school_short": "Iowa State",
      "world": "yost",
      "division": "D-IA"
    },
    "55243": {
      "school_short": "Johns Hopkins",
      "world": "yost",
      "division": "D-III"
    },
    "55544": {
      "school_short": "Juniata",
      "world": "yost",
      "division": "D-III"
    },
    "55109": {
      "school_short": "Kent State",
      "world": "yost",
      "division": "D-IA"
    },
    "55611": {
      "school_short": "Kenyon",
      "world": "yost",
      "division": "D-III"
    },
    "55539": {
      "school_short": "King`s",
      "world": "yost",
      "division": "D-III"
    },
    "55505": {
      "school_short": "Lakeland",
      "world": "yost",
      "division": "D-III"
    },
    "55223": {
      "school_short": "Lane",
      "world": "yost",
      "division": "D-II"
    },
    "55558": {
      "school_short": "Lawrence",
      "world": "yost",
      "division": "D-III"
    },
    "55373": {
      "school_short": "Lehigh",
      "world": "yost",
      "division": "D-IAA"
    },
    "55481": {
      "school_short": "Lenoir-Rhyne",
      "world": "yost",
      "division": "D-II"
    },
    "55515": {
      "school_short": "Loras",
      "world": "yost",
      "division": "D-III"
    },
    "55291": {
      "school_short": "Louisiana Tech",
      "world": "yost",
      "division": "D-IA"
    },
    "55540": {
      "school_short": "Lycoming",
      "world": "yost",
      "division": "D-III"
    },
    "55676": {
      "school_short": "Maranatha Baptist",
      "world": "yost",
      "division": "D-III"
    },
    "55379": {
      "school_short": "Marist",
      "world": "yost",
      "division": "D-IAA"
    },
    "55534": {
      "school_short": "Martin Luther",
      "world": "yost",
      "division": "D-III"
    },
    "55581": {
      "school_short": "Maine Maritime",
      "world": "yost",
      "division": "D-III"
    },
    "55304": {
      "school_short": "James Madison",
      "world": "yost",
      "division": "D-IAA"
    },
    "55355": {
      "school_short": "La Salle",
      "world": "yost",
      "division": "D-IAA"
    },
    "55532": {
      "school_short": "Macalester",
      "world": "yost",
      "division": "D-III"
    },
    "55506": {
      "school_short": "MacMurray",
      "world": "yost",
      "division": "D-III"
    },
    "55535": {
      "school_short": "Husson",
      "world": "yost",
      "division": "D-III"
    },
    "55498": {
      "school_short": "Ithaca",
      "world": "yost",
      "division": "D-III"
    },
    "55176": {
      "school_short": "Jackson State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55382": {
      "school_short": "Jacksonville State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55230": {
      "school_short": "Howard Payne",
      "world": "yost",
      "division": "D-III"
    },
    "55353": {
      "school_short": "Delaware State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55378": {
      "school_short": "Iona",
      "world": "yost",
      "division": "D-IAA"
    },
    "55251": {
      "school_short": "Clemson",
      "world": "yost",
      "division": "D-IA"
    },
    "55350": {
      "school_short": "Fordham",
      "world": "yost",
      "division": "D-IAA"
    },
    "55112": {
      "school_short": "Eastern Michigan",
      "world": "yost",
      "division": "D-IA"
    },
    "55219": {
      "school_short": "Kentucky State",
      "world": "yost",
      "division": "D-II"
    },
    "55520": {
      "school_short": "Cornell",
      "world": "yost",
      "division": "D-III"
    },
    "55460": {
      "school_short": "Indiana (PA)",
      "world": "yost",
      "division": "D-II"
    },
    "55635": {
      "school_short": "John Carroll",
      "world": "yost",
      "division": "D-III"
    },
    "55229": {
      "school_short": "Hardin-Simmons",
      "world": "yost",
      "division": "D-III"
    },
    "55647": {
      "school_short": "Emory and Henry",
      "world": "yost",
      "division": "D-III"
    },
    "55593": {
      "school_short": "Hamilton",
      "world": "yost",
      "division": "D-III"
    },
    "55454": {
      "school_short": "Mansfield",
      "world": "yost",
      "division": "D-II"
    },
    "55550": {
      "school_short": "Illinois",
      "world": "yost",
      "division": "D-III"
    },
    "55545": {
      "school_short": "Lebanon Valley",
      "world": "yost",
      "division": "D-III"
    },
    "55396": {
      "school_short": "Johnson C. Smith",
      "world": "yost",
      "division": "D-II"
    },
    "55533": {
      "school_short": "Colorado",
      "world": "yost",
      "division": "D-III"
    },
    "55163": {
      "school_short": "Georgia Southern",
      "world": "yost",
      "division": "D-IAA"
    },
    "55477": {
      "school_short": "Mars Hill",
      "world": "yost",
      "division": "D-II"
    },
    "55225": {
      "school_short": "Kentucky Wesleyan",
      "world": "yost",
      "division": "D-II"
    },
    "55263": {
      "school_short": "Kansas State",
      "world": "yost",
      "division": "D-IA"
    },
    "55247": {
      "school_short": "Hobart",
      "world": "yost",
      "division": "D-III"
    },
    "55402": {
      "school_short": "Grand Valley State",
      "world": "yost",
      "division": "D-II"
    },
    "55081": {
      "school_short": "Marquette",
      "world": "yost",
      "division": "D-IA"
    },
    "55407": {
      "school_short": "Ferris State",
      "world": "yost",
      "division": "D-II"
    },
    "55597": {
      "school_short": "Kean",
      "world": "yost",
      "division": "D-III"
    },
    "55242": {
      "school_short": "Gettysburg",
      "world": "yost",
      "division": "D-III"
    },
    "55349": {
      "school_short": "Holy Cross",
      "world": "yost",
      "division": "D-IAA"
    },
    "55529": {
      "school_short": "Kalamazoo",
      "world": "yost",
      "division": "D-III"
    },
    "55218": {
      "school_short": "Fort Valley State",
      "world": "yost",
      "division": "D-II"
    },
    "55138": {
      "school_short": "LSU",
      "world": "yost",
      "division": "D-IA"
    },
    "55358": {
      "school_short": "Hampton",
      "world": "yost",
      "division": "D-IAA"
    },
    "55231": {
      "school_short": "Louisiana",
      "world": "yost",
      "division": "D-III"
    },
    "55328": {
      "school_short": "Indiana State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55622": {
      "school_short": "Linfield",
      "world": "yost",
      "division": "D-III"
    },
    "55551": {
      "school_short": "Lake Forest",
      "world": "yost",
      "division": "D-III"
    },
    "55397": {
      "school_short": "Livingstone",
      "world": "yost",
      "division": "D-II"
    },
    "55321": {
      "school_short": "Idaho State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55157": {
      "school_short": "Jacksonville",
      "world": "yost",
      "division": "D-IAA"
    },
    "55510": {
      "school_short": "Illinois Wesleyan",
      "world": "yost",
      "division": "D-III"
    },
    "55438": {
      "school_short": "Emporia State",
      "world": "yost",
      "division": "D-II"
    },
    "55327": {
      "school_short": "Illinois State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55455": {
      "school_short": "Millersville",
      "world": "yost",
      "division": "D-II"
    },
    "55203": {
      "school_short": "Minnesota State-Moorhead",
      "world": "yost",
      "division": "D-II"
    },
    "55177": {
      "school_short": "Mississippi Valley State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55443": {
      "school_short": "Missouri Southern State",
      "world": "yost",
      "division": "D-II"
    },
    "55333": {
      "school_short": "Missouri State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55552": {
      "school_short": "Monmouth (IL)",
      "world": "yost",
      "division": "D-III"
    },
    "55363": {
      "school_short": "Monmouth",
      "world": "yost",
      "division": "D-IAA"
    },
    "55323": {
      "school_short": "Montana State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55546": {
      "school_short": "Moravian",
      "world": "yost",
      "division": "D-III"
    },
    "55224": {
      "school_short": "Morehouse",
      "world": "yost",
      "division": "D-II"
    },
    "55360": {
      "school_short": "Morgan State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55472": {
      "school_short": "New Mexico Highlands",
      "world": "yost",
      "division": "D-II"
    },
    "55285": {
      "school_short": "New Mexico State",
      "world": "yost",
      "division": "D-IA"
    },
    "55575": {
      "school_short": "Nichols",
      "world": "yost",
      "division": "D-III"
    },
    "55352": {
      "school_short": "Norfolk State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55361": {
      "school_short": "NC A&T",
      "world": "yost",
      "division": "D-IAA"
    },
    "55690": {
      "school_short": "North Central",
      "world": "yost",
      "division": "D-III"
    },
    "55426": {
      "school_short": "Northeastern State",
      "world": "yost",
      "division": "D-II"
    },
    "55310": {
      "school_short": "Northeastern",
      "world": "yost",
      "division": "D-IAA"
    },
    "55427": {
      "school_short": "SE Oklahoma-Durant",
      "world": "yost",
      "division": "D-II"
    },
    "55403": {
      "school_short": "Mercyhurst",
      "world": "yost",
      "division": "D-II"
    },
    "55637": {
      "school_short": "Muskingum",
      "world": "yost",
      "division": "D-III"
    },
    "55115": {
      "school_short": "Northern Illinois",
      "world": "yost",
      "division": "D-IA"
    },
    "55596": {
      "school_short": "MIT",
      "world": "yost",
      "division": "D-III"
    },
    "55244": {
      "school_short": "McDaniel",
      "world": "yost",
      "division": "D-III"
    },
    "55482": {
      "school_short": "Newberry",
      "world": "yost",
      "division": "D-II"
    },
    "55170": {
      "school_short": "McNeese State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55194": {
      "school_short": "Merrimack",
      "world": "yost",
      "division": "D-II"
    },
    "55107": {
      "school_short": "Miami (OH)",
      "world": "yost",
      "division": "D-IA"
    },
    "55084": {
      "school_short": "Michigan State",
      "world": "yost",
      "division": "D-IA"
    },
    "55356": {
      "school_short": "Siena",
      "world": "yost",
      "division": "D-IAA"
    },
    "55440": {
      "school_short": "Northwest Missouri State",
      "world": "yost",
      "division": "D-II"
    },
    "55489": {
      "school_short": "Norwich",
      "world": "yost",
      "division": "D-III"
    },
    "55638": {
      "school_short": "Ohio Northern",
      "world": "yost",
      "division": "D-III"
    },
    "55110": {
      "school_short": "Ohio",
      "world": "yost",
      "division": "D-IA"
    },
    "55415": {
      "school_short": "Ouachita Baptist",
      "world": "yost",
      "division": "D-II"
    },
    "55478": {
      "school_short": "Presbyterian",
      "world": "yost",
      "division": "D-II"
    },
    "55227": {
      "school_short": "Quincy",
      "world": "yost",
      "division": "D-II"
    },
    "55598": {
      "school_short": "Montclair State",
      "world": "yost",
      "division": "D-III"
    },
    "55197": {
      "school_short": "Pace",
      "world": "yost",
      "division": "D-II"
    },
    "55673": {
      "school_short": "Methodist",
      "world": "yost",
      "division": "D-III"
    },
    "55139": {
      "school_short": "Mississippi State",
      "world": "yost",
      "division": "D-IA"
    },
    "55490": {
      "school_short": "Plymouth State",
      "world": "yost",
      "division": "D-III"
    },
    "55557": {
      "school_short": "Knox",
      "world": "yost",
      "division": "D-III"
    },
    "55660": {
      "school_short": "Rhodes",
      "world": "yost",
      "division": "D-III"
    },
    "55649": {
      "school_short": "Hampden-Sydney",
      "world": "yost",
      "division": "D-III"
    },
    "55606": {
      "school_short": "Mount Ida",
      "world": "yost",
      "division": "D-III"
    },
    "55346": {
      "school_short": "Princeton",
      "world": "yost",
      "division": "D-IAA"
    },
    "55691": {
      "school_short": "North Park",
      "world": "yost",
      "division": "D-III"
    },
    "55232": {
      "school_short": "McMurry",
      "world": "yost",
      "division": "D-III"
    },
    "55257": {
      "school_short": "Florida State",
      "world": "yost",
      "division": "D-IA"
    },
    "55677": {
      "school_short": "Maryville",
      "world": "yost",
      "division": "D-III"
    },
    "55408": {
      "school_short": "Hillsdale",
      "world": "yost",
      "division": "D-II"
    },
    "55665": {
      "school_short": "Pomona-Pitzers",
      "world": "yost",
      "division": "D-III"
    },
    "55404": {
      "school_short": "Northern Michigan",
      "world": "yost",
      "division": "D-II"
    },
    "55220": {
      "school_short": "Miles",
      "world": "yost",
      "division": "D-II"
    },
    "55398": {
      "school_short": "North Carolina Central",
      "world": "yost",
      "division": "D-II"
    },
    "55099": {
      "school_short": "Marshall",
      "world": "yost",
      "division": "D-IA"
    },
    "55450": {
      "school_short": "Minnesota State-Mankato",
      "world": "yost",
      "division": "D-II"
    },
    "55193": {
      "school_short": "Long Island",
      "world": "yost",
      "division": "D-II"
    },
    "55516": {
      "school_short": "Luther",
      "world": "yost",
      "division": "D-III"
    },
    "55372": {
      "school_short": "Lafayette",
      "world": "yost",
      "division": "D-IAA"
    },
    "55678": {
      "school_short": "Nebraska Wesleyan",
      "world": "yost",
      "division": "D-III"
    },
    "55158": {
      "school_short": "Morehead State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55258": {
      "school_short": "North Carolina State",
      "world": "yost",
      "division": "D-IA"
    },
    "55630": {
      "school_short": "Principia",
      "world": "yost",
      "division": "D-III"
    },
    "55689": {
      "school_short": "Millikin",
      "world": "yost",
      "division": "D-III"
    },
    "55656": {
      "school_short": "Manchester",
      "world": "yost",
      "division": "D-III"
    },
    "55209": {
      "school_short": "Northern State",
      "world": "yost",
      "division": "D-II"
    },
    "55471": {
      "school_short": "Mesa State",
      "world": "yost",
      "division": "D-II"
    },
    "55641": {
      "school_short": "Otterbein",
      "world": "yost",
      "division": "D-III"
    },
    "55659": {
      "school_short": "Millsaps",
      "world": "yost",
      "division": "D-III"
    },
    "55337": {
      "school_short": "Southeastern Louisiana",
      "world": "yost",
      "division": "D-IAA"
    },
    "55248": {
      "school_short": "Rensselaer Tech",
      "world": "yost",
      "division": "D-III"
    },
    "55553": {
      "school_short": "Ripon",
      "world": "yost",
      "division": "D-III"
    },
    "55364": {
      "school_short": "Robert Morris",
      "world": "yost",
      "division": "D-IAA"
    },
    "55365": {
      "school_short": "Sacred Heart",
      "world": "yost",
      "division": "D-IAA"
    },
    "55548": {
      "school_short": "Salisbury",
      "world": "yost",
      "division": "D-III"
    },
    "55576": {
      "school_short": "Salve Regina",
      "world": "yost",
      "division": "D-III"
    },
    "55384": {
      "school_short": "Samford",
      "world": "yost",
      "division": "D-IAA"
    },
    "55298": {
      "school_short": "San Diego State",
      "world": "yost",
      "division": "D-IA"
    },
    "55391": {
      "school_short": "Shaw",
      "world": "yost",
      "division": "D-II"
    },
    "55461": {
      "school_short": "Shippensburg",
      "world": "yost",
      "division": "D-II"
    },
    "55517": {
      "school_short": "Simpson",
      "world": "yost",
      "division": "D-III"
    },
    "55362": {
      "school_short": "SC State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55467": {
      "school_short": "Oklahoma Panhandle",
      "world": "yost",
      "division": "D-II"
    },
    "55661": {
      "school_short": "Rose-Hulman",
      "world": "yost",
      "division": "D-III"
    },
    "55090": {
      "school_short": "Penn State",
      "world": "yost",
      "division": "D-IA"
    },
    "55441": {
      "school_short": "Pittsburg State",
      "world": "yost",
      "division": "D-II"
    },
    "55180": {
      "school_short": "Prairie View",
      "world": "yost",
      "division": "D-IAA"
    },
    "55172": {
      "school_short": "Northwestern State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55085": {
      "school_short": "Northwestern",
      "world": "yost",
      "division": "D-IA"
    },
    "55271": {
      "school_short": "Oklahoma State",
      "world": "yost",
      "division": "D-IA"
    },
    "55119": {
      "school_short": "Oregon State",
      "world": "yost",
      "division": "D-IA"
    },
    "55104": {
      "school_short": "Southern Methodist",
      "world": "yost",
      "division": "D-IA"
    },
    "55338": {
      "school_short": "Southern Utah",
      "world": "yost",
      "division": "D-IAA"
    },
    "55444": {
      "school_short": "Southwest Baptist",
      "world": "yost",
      "division": "D-II"
    },
    "55204": {
      "school_short": "Southwest Minnesota State",
      "world": "yost",
      "division": "D-II"
    },
    "55495": {
      "school_short": "Springfield",
      "world": "yost",
      "division": "D-III"
    },
    "55399": {
      "school_short": "St. Augustine`s",
      "world": "yost",
      "division": "D-II"
    },
    "55453": {
      "school_short": "St. Cloud State",
      "world": "yost",
      "division": "D-II"
    },
    "55320": {
      "school_short": "St. Mary`s",
      "world": "yost",
      "division": "D-IAA"
    },
    "55366": {
      "school_short": "Stony Brook",
      "world": "yost",
      "division": "D-IAA"
    },
    "55236": {
      "school_short": "Sul Ross State",
      "world": "yost",
      "division": "D-III"
    },
    "55277": {
      "school_short": "Temple",
      "world": "yost",
      "division": "D-IA"
    },
    "55164": {
      "school_short": "Citadel",
      "world": "yost",
      "division": "D-IAA"
    },
    "55679": {
      "school_short": "Thomas More",
      "world": "yost",
      "division": "D-III"
    },
    "55275": {
      "school_short": "Rutgers",
      "world": "yost",
      "division": "D-IA"
    },
    "55221": {
      "school_short": "Tuskegee",
      "world": "yost",
      "division": "D-II"
    },
    "55599": {
      "school_short": "Rowan",
      "world": "yost",
      "division": "D-III"
    },
    "55385": {
      "school_short": "Southeast Missouri State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55631": {
      "school_short": "Stillman",
      "world": "yost",
      "division": "D-III"
    },
    "55096": {
      "school_short": "Rice",
      "world": "yost",
      "division": "D-IA"
    },
    "55452": {
      "school_short": "South Dakota State",
      "world": "yost",
      "division": "D-II"
    },
    "55181": {
      "school_short": "Southern-Baton Rouge",
      "world": "yost",
      "division": "D-IAA"
    },
    "55370": {
      "school_short": "Saint Francis",
      "world": "yost",
      "division": "D-IAA"
    },
    "55386": {
      "school_short": "Tennessee State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55601": {
      "school_short": "New Jersey",
      "world": "yost",
      "division": "D-III"
    },
    "55554": {
      "school_short": "St. Norbert",
      "world": "yost",
      "division": "D-III"
    },
    "55629": {
      "school_short": "Menlo",
      "world": "yost",
      "division": "D-III"
    },
    "55484": {
      "school_short": "Shepherd",
      "world": "yost",
      "division": "D-II"
    },
    "55664": {
      "school_short": "Occidental",
      "world": "yost",
      "division": "D-III"
    },
    "55522": {
      "school_short": "Thiel",
      "world": "yost",
      "division": "D-III"
    },
    "55588": {
      "school_short": "Trinity",
      "world": "yost",
      "division": "D-III"
    },
    "55565": {
      "school_short": "St. John`s",
      "world": "yost",
      "division": "D-III"
    },
    "55237": {
      "school_short": "Texas Lutheran",
      "world": "yost",
      "division": "D-III"
    },
    "55245": {
      "school_short": "Muhlenberg",
      "world": "yost",
      "division": "D-III"
    },
    "55607": {
      "school_short": "Rockford",
      "world": "yost",
      "division": "D-III"
    },
    "55491": {
      "school_short": "Coast Guard",
      "world": "yost",
      "division": "D-III"
    },
    "55499": {
      "school_short": "St. John Fisher",
      "world": "yost",
      "division": "D-III"
    },
    "55429": {
      "school_short": "Tarleton State",
      "world": "yost",
      "division": "D-II"
    },
    "55129": {
      "school_short": "Stanford",
      "world": "yost",
      "division": "D-IA"
    },
    "55380": {
      "school_short": "St. Peter`s",
      "world": "yost",
      "division": "D-IAA"
    },
    "55636": {
      "school_short": "Mount Union",
      "world": "yost",
      "division": "D-III"
    },
    "55325": {
      "school_short": "Stephen F. Austin",
      "world": "yost",
      "division": "D-IAA"
    },
    "55435": {
      "school_short": "Texas A&M-Kingsville",
      "world": "yost",
      "division": "D-II"
    },
    "55299": {
      "school_short": "San Jose State",
      "world": "yost",
      "division": "D-IA"
    },
    "55531": {
      "school_short": "Olivet",
      "world": "yost",
      "division": "D-III"
    },
    "53206": {
      "school_short": "Franklin",
      "world": "warner",
      "division": "D-III"
    },
    "55101": {
      "school_short": "Texas Christian",
      "world": "yost",
      "division": "D-IA"
    },
    "55198": {
      "school_short": "Saint Anselm",
      "world": "yost",
      "division": "D-II"
    },
    "55421": {
      "school_short": "Southern Arkansas",
      "world": "yost",
      "division": "D-II"
    },
    "55249": {
      "school_short": "St. Lawrence",
      "world": "yost",
      "division": "D-III"
    },
    "55442": {
      "school_short": "Truman State",
      "world": "yost",
      "division": "D-II"
    },
    "55479": {
      "school_short": "Tusculum",
      "world": "yost",
      "division": "D-II"
    },
    "55250": {
      "school_short": "Union (NY)",
      "world": "yost",
      "division": "D-III"
    },
    "55600": {
      "school_short": "Cortland",
      "world": "yost",
      "division": "D-III"
    },
    "55111": {
      "school_short": "Buffalo",
      "world": "yost",
      "division": "D-IA"
    },
    "55195": {
      "school_short": "Southern Connecticut",
      "world": "yost",
      "division": "D-II"
    },
    "55329": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "yost",
      "division": "D-IAA"
    },
    "55376": {
      "school_short": "Tennessee Tech",
      "world": "yost",
      "division": "D-IAA"
    },
    "55301": {
      "school_short": "Hawaii",
      "world": "yost",
      "division": "D-IA"
    },
    "55287": {
      "school_short": "North Texas",
      "world": "yost",
      "division": "D-IA"
    },
    "55305": {
      "school_short": "Delaware",
      "world": "yost",
      "division": "D-IAA"
    },
    "55521": {
      "school_short": "Dubuque",
      "world": "yost",
      "division": "D-III"
    },
    "55133": {
      "school_short": "Florida",
      "world": "yost",
      "division": "D-IA"
    },
    "55286": {
      "school_short": "Idaho",
      "world": "yost",
      "division": "D-IA"
    },
    "55145": {
      "school_short": "Louisiana Lafayette",
      "world": "yost",
      "division": "D-IA"
    },
    "55146": {
      "school_short": "Louisiana Monroe",
      "world": "yost",
      "division": "D-IA"
    },
    "55311": {
      "school_short": "Maine",
      "world": "yost",
      "division": "D-IAA"
    },
    "55260": {
      "school_short": "Miami (FL)",
      "world": "yost",
      "division": "D-IA"
    },
    "55205": {
      "school_short": "Minnesota-Crookston",
      "world": "yost",
      "division": "D-II"
    },
    "55302": {
      "school_short": "Nevada",
      "world": "yost",
      "division": "D-IA"
    },
    "55300": {
      "school_short": "UNLV",
      "world": "yost",
      "division": "D-IA"
    },
    "55294": {
      "school_short": "New Mexico",
      "world": "yost",
      "division": "D-IA"
    },
    "55083": {
      "school_short": "Illinois",
      "world": "yost",
      "division": "D-IA"
    },
    "55102": {
      "school_short": "Tulane",
      "world": "yost",
      "division": "D-IA"
    },
    "55100": {
      "school_short": "Central Florida",
      "world": "yost",
      "division": "D-IA"
    },
    "55290": {
      "school_short": "Troy State",
      "world": "yost",
      "division": "D-IA"
    },
    "55428": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "yost",
      "division": "D-II"
    },
    "55182": {
      "school_short": "Texas Southern",
      "world": "yost",
      "division": "D-IAA"
    },
    "55430": {
      "school_short": "Central Oklahoma",
      "world": "yost",
      "division": "D-II"
    },
    "55269": {
      "school_short": "Oklahoma",
      "world": "yost",
      "division": "D-IA"
    },
    "55184": {
      "school_short": "North Dakota",
      "world": "yost",
      "division": "D-II"
    },
    "55492": {
      "school_short": "Merchant Marine",
      "world": "yost",
      "division": "D-III"
    },
    "55577": {
      "school_short": "UMass-Dartmouth",
      "world": "yost",
      "division": "D-III"
    },
    "55098": {
      "school_short": "Memphis",
      "world": "yost",
      "division": "D-IA"
    },
    "55183": {
      "school_short": "Nebraska-Omaha",
      "world": "yost",
      "division": "D-II"
    },
    "55094": {
      "school_short": "Notre Dame",
      "world": "yost",
      "division": "D-IA"
    },
    "55536": {
      "school_short": "Brockport",
      "world": "yost",
      "division": "D-III"
    },
    "55136": {
      "school_short": "Kentucky",
      "world": "yost",
      "division": "D-IA"
    },
    "55624": {
      "school_short": "Puget Sound",
      "world": "yost",
      "division": "D-III"
    },
    "55266": {
      "school_short": "Kansas",
      "world": "yost",
      "division": "D-IA"
    },
    "55207": {
      "school_short": "Minnesota-Duluth",
      "world": "yost",
      "division": "D-II"
    },
    "55334": {
      "school_short": "Northern Iowa",
      "world": "yost",
      "division": "D-IAA"
    },
    "55086": {
      "school_short": "Michigan",
      "world": "yost",
      "division": "D-IA"
    },
    "55211": {
      "school_short": "Charleston",
      "world": "yost",
      "division": "D-II"
    },
    "55473": {
      "school_short": "Nebraska-Kearney",
      "world": "yost",
      "division": "D-II"
    },
    "55666": {
      "school_short": "La Verne",
      "world": "yost",
      "division": "D-III"
    },
    "55289": {
      "school_short": "Montana",
      "world": "yost",
      "division": "D-IA"
    },
    "55123": {
      "school_short": "California",
      "world": "yost",
      "division": "D-IA"
    },
    "55259": {
      "school_short": "Maryland",
      "world": "yost",
      "division": "D-IA"
    },
    "55272": {
      "school_short": "Texas Tech",
      "world": "yost",
      "division": "D-IA"
    },
    "55126": {
      "school_short": "Arizona",
      "world": "yost",
      "division": "D-IA"
    },
    "55093": {
      "school_short": "Iowa",
      "world": "yost",
      "division": "D-IA"
    },
    "55105": {
      "school_short": "Houston",
      "world": "yost",
      "division": "D-IA"
    },
    "55140": {
      "school_short": "Alabama",
      "world": "yost",
      "division": "D-IA"
    },
    "55306": {
      "school_short": "Massachusetts",
      "world": "yost",
      "division": "D-IAA"
    },
    "55406": {
      "school_short": "Indianapolis",
      "world": "yost",
      "division": "D-II"
    },
    "55264": {
      "school_short": "Nebraska",
      "world": "yost",
      "division": "D-IA"
    },
    "55199": {
      "school_short": "Stonehill",
      "world": "yost",
      "division": "D-II"
    },
    "55559": {
      "school_short": "Chicago",
      "world": "yost",
      "division": "D-III"
    },
    "55267": {
      "school_short": "Colorado",
      "world": "yost",
      "division": "D-IA"
    },
    "55282": {
      "school_short": "Cincinnati",
      "world": "yost",
      "division": "D-IA"
    },
    "55120": {
      "school_short": "Oregon",
      "world": "yost",
      "division": "D-IA"
    },
    "55141": {
      "school_short": "Arkansas",
      "world": "yost",
      "division": "D-IA"
    },
    "55128": {
      "school_short": "UCLA",
      "world": "yost",
      "division": "D-IA"
    },
    "55091": {
      "school_short": "Purdue",
      "world": "yost",
      "division": "D-IA"
    },
    "55279": {
      "school_short": "Pittsburgh",
      "world": "yost",
      "division": "D-IA"
    },
    "55103": {
      "school_short": "Alabama Birmingham",
      "world": "yost",
      "division": "D-IA"
    },
    "55367": {
      "school_short": "Albany",
      "world": "yost",
      "division": "D-IAA"
    },
    "55142": {
      "school_short": "Ole Miss",
      "world": "yost",
      "division": "D-IA"
    },
    "55108": {
      "school_short": "Akron",
      "world": "yost",
      "division": "D-IA"
    },
    "55324": {
      "school_short": "Sam Houston State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55281": {
      "school_short": "Louisville",
      "world": "yost",
      "division": "D-IA"
    },
    "55312": {
      "school_short": "New Hampshire",
      "world": "yost",
      "division": "D-IAA"
    },
    "55127": {
      "school_short": "Southern California",
      "world": "yost",
      "division": "D-IA"
    },
    "55169": {
      "school_short": "Tennessee-Chattanooga",
      "world": "yost",
      "division": "D-IAA"
    },
    "55097": {
      "school_short": "Tulsa",
      "world": "yost",
      "division": "D-IA"
    },
    "55255": {
      "school_short": "Virginia",
      "world": "yost",
      "division": "D-IA"
    },
    "55684": {
      "school_short": "Wisconsin-River Falls",
      "world": "yost",
      "division": "D-III"
    },
    "55685": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "yost",
      "division": "D-III"
    },
    "55688": {
      "school_short": "Wisconsin-Stout",
      "world": "yost",
      "division": "D-III"
    },
    "55246": {
      "school_short": "Ursinus",
      "world": "yost",
      "division": "D-III"
    },
    "55288": {
      "school_short": "Utah State",
      "world": "yost",
      "division": "D-IA"
    },
    "55134": {
      "school_short": "Vanderbilt",
      "world": "yost",
      "division": "D-IA"
    },
    "55256": {
      "school_short": "Wake Forest",
      "world": "yost",
      "division": "D-IA"
    },
    "55523": {
      "school_short": "Washington and Jefferson",
      "world": "yost",
      "division": "D-III"
    },
    "55524": {
      "school_short": "Waynesburg",
      "world": "yost",
      "division": "D-III"
    },
    "55560": {
      "school_short": "Washington (MO)",
      "world": "yost",
      "division": "D-III"
    },
    "55106": {
      "school_short": "Southern Mississippi",
      "world": "yost",
      "division": "D-IA"
    },
    "55293": {
      "school_short": "UTEP",
      "world": "yost",
      "division": "D-IA"
    },
    "55687": {
      "school_short": "Wisconsin-Oshkosh",
      "world": "yost",
      "division": "D-III"
    },
    "55154": {
      "school_short": "VMI",
      "world": "yost",
      "division": "D-IAA"
    },
    "55122": {
      "school_short": "Washington State",
      "world": "yost",
      "division": "D-IA"
    },
    "55307": {
      "school_short": "Rhode Island",
      "world": "yost",
      "division": "D-IAA"
    },
    "55152": {
      "school_short": "San Diego",
      "world": "yost",
      "division": "D-IAA"
    },
    "55680": {
      "school_short": "Westminster (MO)",
      "world": "yost",
      "division": "D-III"
    },
    "55569": {
      "school_short": "St. Olaf",
      "world": "yost",
      "division": "D-III"
    },
    "55377": {
      "school_short": "Tennessee-Martin",
      "world": "yost",
      "division": "D-IAA"
    },
    "55387": {
      "school_short": "Arkansas-Pine Bluff",
      "world": "yost",
      "division": "D-IAA"
    },
    "55418": {
      "school_short": "West Alabama",
      "world": "yost",
      "division": "D-II"
    },
    "55682": {
      "school_short": "Wisconsin-La Crosse",
      "world": "yost",
      "division": "D-III"
    },
    "55667": {
      "school_short": "Redlands",
      "world": "yost",
      "division": "D-III"
    },
    "55131": {
      "school_short": "Georgia",
      "world": "yost",
      "division": "D-IA"
    },
    "55295": {
      "school_short": "Utah",
      "world": "yost",
      "division": "D-IA"
    },
    "55417": {
      "school_short": "Central Arkansas",
      "world": "yost",
      "division": "D-II"
    },
    "55187": {
      "school_short": "Humboldt State",
      "world": "yost",
      "division": "D-II"
    },
    "55424": {
      "school_short": "Valdosta State",
      "world": "yost",
      "division": "D-II"
    },
    "55261": {
      "school_short": "Virginia Tech",
      "world": "yost",
      "division": "D-IA"
    },
    "55393": {
      "school_short": "Virginia Union",
      "world": "yost",
      "division": "D-II"
    },
    "55488": {
      "school_short": "Rochester",
      "world": "yost",
      "division": "D-III"
    },
    "55608": {
      "school_short": "Wesley",
      "world": "yost",
      "division": "D-III"
    },
    "55572": {
      "school_short": "Westminster (PA)",
      "world": "yost",
      "division": "D-III"
    },
    "55456": {
      "school_short": "West Chester",
      "world": "yost",
      "division": "D-II"
    },
    "55512": {
      "school_short": "Wheaton",
      "world": "yost",
      "division": "D-III"
    },
    "55213": {
      "school_short": "West Virginia State",
      "world": "yost",
      "division": "D-II"
    },
    "55642": {
      "school_short": "Wilmington (OH)",
      "world": "yost",
      "division": "D-III"
    },
    "55278": {
      "school_short": "Connecticut",
      "world": "yost",
      "division": "D-IA"
    },
    "55627": {
      "school_short": "Eastern Oregon",
      "world": "yost",
      "division": "D-III"
    },
    "55135": {
      "school_short": "South Carolina",
      "world": "yost",
      "division": "D-IA"
    },
    "55130": {
      "school_short": "Air Force",
      "world": "yost",
      "division": "D-IA"
    },
    "55185": {
      "school_short": "South Dakota",
      "world": "yost",
      "division": "D-II"
    },
    "55151": {
      "school_short": "Dayton",
      "world": "yost",
      "division": "D-IAA"
    },
    "55308": {
      "school_short": "Villanova",
      "world": "yost",
      "division": "D-IAA"
    },
    "55605": {
      "school_short": "Huntingdon",
      "world": "yost",
      "division": "D-III"
    },
    "55148": {
      "school_short": "Army",
      "world": "yost",
      "division": "D-IA"
    },
    "55683": {
      "school_short": "Wisconsin-Platteville",
      "world": "yost",
      "division": "D-III"
    },
    "55518": {
      "school_short": "Wartburg",
      "world": "yost",
      "division": "D-III"
    },
    "55663": {
      "school_short": "South-Sewanee",
      "world": "yost",
      "division": "D-III"
    },
    "55434": {
      "school_short": "Texas A&M-Commerce",
      "world": "yost",
      "division": "D-II"
    },
    "55566": {
      "school_short": "St. Thomas",
      "world": "yost",
      "division": "D-III"
    },
    "55147": {
      "school_short": "Navy",
      "world": "yost",
      "division": "D-IA"
    },
    "55319": {
      "school_short": "Weber State",
      "world": "yost",
      "division": "D-IAA"
    },
    "55412": {
      "school_short": "Wayne State",
      "world": "yost",
      "division": "D-II"
    },
    "55270": {
      "school_short": "Texas",
      "world": "yost",
      "division": "D-IA"
    },
    "55651": {
      "school_short": "Washington and Lee",
      "world": "yost",
      "division": "D-III"
    },
    "55446": {
      "school_short": "Washburn-Topeka",
      "world": "yost",
      "division": "D-II"
    },
    "55283": {
      "school_short": "South Florida",
      "world": "yost",
      "division": "D-IA"
    },
    "55210": {
      "school_short": "Wayne State",
      "world": "yost",
      "division": "D-II"
    },
    "55681": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "yost",
      "division": "D-III"
    },
    "55121": {
      "school_short": "Washington",
      "world": "yost",
      "division": "D-IA"
    },
    "55296": {
      "school_short": "Wyoming",
      "world": "yost",
      "division": "D-IA"
    },
    "55132": {
      "school_short": "Tennessee",
      "world": "yost",
      "division": "D-IA"
    },
    "55613": {
      "school_short": "Wabash",
      "world": "yost",
      "division": "D-III"
    },
    "55500": {
      "school_short": "Utica",
      "world": "yost",
      "division": "D-III"
    },
    "55416": {
      "school_short": "West Georgia",
      "world": "yost",
      "division": "D-II"
    },
    "55486": {
      "school_short": "West Virginia Wesleyan",
      "world": "yost",
      "division": "D-II"
    },
    "55165": {
      "school_short": "Western Carolina",
      "world": "yost",
      "division": "D-IAA"
    },
    "55330": {
      "school_short": "Western Illinois",
      "world": "yost",
      "division": "D-IAA"
    },
    "55331": {
      "school_short": "Western Kentucky",
      "world": "yost",
      "division": "D-IAA"
    },
    "55468": {
      "school_short": "Western New Mexico",
      "world": "yost",
      "division": "D-II"
    },
    "55188": {
      "school_short": "Western Oregon",
      "world": "yost",
      "division": "D-II"
    },
    "55668": {
      "school_short": "Whittier",
      "world": "yost",
      "division": "D-III"
    },
    "55602": {
      "school_short": "William Paterson",
      "world": "yost",
      "division": "D-III"
    },
    "55480": {
      "school_short": "Wingate",
      "world": "yost",
      "division": "D-II"
    },
    "55530": {
      "school_short": "Wisconsin Lutheran",
      "world": "yost",
      "division": "D-III"
    },
    "55614": {
      "school_short": "Wittenberg",
      "world": "yost",
      "division": "D-III"
    },
    "55594": {
      "school_short": "Wesleyan",
      "world": "yost",
      "division": "D-III"
    },
    "55212": {
      "school_short": "West Liberty State",
      "world": "yost",
      "division": "D-II"
    },
    "55485": {
      "school_short": "West Virginia Tech",
      "world": "yost",
      "division": "D-II"
    },
    "55494": {
      "school_short": "Worcester Tech",
      "world": "yost",
      "division": "D-III"
    },
    "55584": {
      "school_short": "Worcester State",
      "world": "yost",
      "division": "D-III"
    },
    "55239": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "yost",
      "division": "D-III"
    },
    "55144": {
      "school_short": "Middle Tennessee State",
      "world": "yost",
      "division": "D-IA"
    },
    "55587": {
      "school_short": "Middlebury",
      "world": "yost",
      "division": "D-III"
    },
    "49688": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "camp",
      "division": "D-II"
    },
    "53947": {
      "school_short": "Nicholls State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "49302": {
      "school_short": "Hardin-Simmons",
      "world": "rockne",
      "division": "D-III"
    },
    "49374": {
      "school_short": "Southern Mississippi",
      "world": "rockne",
      "division": "D-IA"
    },
    "49410": {
      "school_short": "Holy Cross",
      "world": "rockne",
      "division": "D-IAA"
    },
    "48990": {
      "school_short": "Navy",
      "world": "rockne",
      "division": "D-IA"
    },
    "55332": {
      "school_short": "Youngstown State",
      "world": "yost",
      "division": "D-IAA"
    },
    "51509": {
      "school_short": "Arkansas Tech",
      "world": "leahy",
      "division": "D-II"
    },
    "49046": {
      "school_short": "Nicholls State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "55590": {
      "school_short": "Williams",
      "world": "yost",
      "division": "D-III"
    },
    "55582": {
      "school_short": "Massachusetts Maritime",
      "world": "yost",
      "division": "D-III"
    },
    "55462": {
      "school_short": "Slippery Rock",
      "world": "yost",
      "division": "D-II"
    },
    "55578": {
      "school_short": "Western New England",
      "world": "yost",
      "division": "D-III"
    },
    "55431": {
      "school_short": "Abilene Christian",
      "world": "yost",
      "division": "D-II"
    },
    "55189": {
      "school_short": "Western Washington",
      "world": "yost",
      "division": "D-II"
    },
    "55166": {
      "school_short": "Wofford",
      "world": "yost",
      "division": "D-IAA"
    },
    "55436": {
      "school_short": "West Texas A&M",
      "world": "yost",
      "division": "D-II"
    },
    "53516": {
      "school_short": "Illinois State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "49510": {
      "school_short": "Virginia Union",
      "world": "rockne",
      "division": "D-II"
    },
    "53640": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "heisman",
      "division": "D-III"
    },
    "49759": {
      "school_short": "Aurora",
      "world": "camp",
      "division": "D-III"
    },
    "49748": {
      "school_short": "Plymouth State",
      "world": "camp",
      "division": "D-III"
    },
    "50150": {
      "school_short": "Ohio Northern",
      "world": "camp",
      "division": "D-III"
    },
    "55031": {
      "school_short": "Mount St. Joseph",
      "world": "hayes",
      "division": "D-III"
    },
    "50672": {
      "school_short": "Cal Poly",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50584": {
      "school_short": "Indiana",
      "world": "bryant",
      "division": "D-IA"
    },
    "50141": {
      "school_short": "Menlo",
      "world": "camp",
      "division": "D-III"
    },
    "55178": {
      "school_short": "Gardner-Webb",
      "world": "yost",
      "division": "D-IAA"
    },
    "52830": {
      "school_short": "Connecticut",
      "world": "warner",
      "division": "D-IA"
    },
    "55474": {
      "school_short": "Western State (CO)",
      "world": "yost",
      "division": "D-II"
    },
    "49297": {
      "school_short": "Morehouse",
      "world": "rockne",
      "division": "D-II"
    },
    "49114": {
      "school_short": "Millersville",
      "world": "rockne",
      "division": "D-II"
    },
    "49082": {
      "school_short": "Texas A&M-Commerce",
      "world": "rockne",
      "division": "D-II"
    },
    "49538": {
      "school_short": "Ohio Northern",
      "world": "rockne",
      "division": "D-III"
    },
    "55493": {
      "school_short": "Western Connecticut State",
      "world": "yost",
      "division": "D-III"
    },
    "55280": {
      "school_short": "West Virginia",
      "world": "yost",
      "division": "D-IA"
    },
    "49079": {
      "school_short": "Abilene Christian",
      "world": "rockne",
      "division": "D-II"
    },
    "55344": {
      "school_short": "Yale",
      "world": "yost",
      "division": "D-IAA"
    },
    "55542": {
      "school_short": "Wilkes",
      "world": "yost",
      "division": "D-III"
    },
    "51192": {
      "school_short": "Wisconsin",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "55583": {
      "school_short": "Westfield State",
      "world": "yost",
      "division": "D-III"
    },
    "49100": {
      "school_short": "South Dakota State",
      "world": "rockne",
      "division": "D-II"
    },
    "54258": {
      "school_short": "Newberry",
      "world": "dobie",
      "division": "D-II"
    },
    "49537": {
      "school_short": "Muskingum",
      "world": "rockne",
      "division": "D-III"
    },
    "55626": {
      "school_short": "Willamette",
      "world": "yost",
      "division": "D-III"
    },
    "55254": {
      "school_short": "North Carolina",
      "world": "yost",
      "division": "D-IA"
    },
    "55501": {
      "school_short": "Aurora",
      "world": "yost",
      "division": "D-III"
    },
    "49595": {
      "school_short": "Alabama",
      "world": "camp",
      "division": "D-IA"
    },
    "55547": {
      "school_short": "Widener",
      "world": "yost",
      "division": "D-III"
    },
    "50730": {
      "school_short": "Bowie State",
      "world": "bryant",
      "division": "D-II"
    },
    "55116": {
      "school_short": "Western Michigan",
      "world": "yost",
      "division": "D-IA"
    },
    "55171": {
      "school_short": "Nicholls State",
      "world": "yost",
      "division": "D-IAA"
    },
    "50748": {
      "school_short": "Ferris State",
      "world": "bryant",
      "division": "D-II"
    },
    "55381": {
      "school_short": "Eastern Kentucky",
      "world": "yost",
      "division": "D-IAA"
    },
    "50685": {
      "school_short": "Mesa State",
      "world": "bryant",
      "division": "D-II"
    },
    "50269": {
      "school_short": "McNeese State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50647": {
      "school_short": "SC State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "53081": {
      "school_short": "Kalamazoo",
      "world": "warner",
      "division": "D-III"
    },
    "48982": {
      "school_short": "Mississippi State",
      "world": "rockne",
      "division": "D-IA"
    },
    "52954": {
      "school_short": "Tennessee-Martin",
      "world": "warner",
      "division": "D-IAA"
    },
    "54674": {
      "school_short": "Idaho",
      "world": "hayes",
      "division": "D-IA"
    },
    "53238": {
      "school_short": "Wisconsin-Whitewater",
      "world": "warner",
      "division": "D-III"
    },
    "54686": {
      "school_short": "San Diego State",
      "world": "hayes",
      "division": "D-IA"
    },
    "53574": {
      "school_short": "Southeast Missouri State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53778": {
      "school_short": "Wittenberg",
      "world": "heisman",
      "division": "D-III"
    },
    "53389": {
      "school_short": "Nebraska-Kearney",
      "world": "heisman",
      "division": "D-II"
    },
    "53018": {
      "school_short": "Hardin-Simmons",
      "world": "warner",
      "division": "D-III"
    },
    "54651": {
      "school_short": "Kansas State",
      "world": "hayes",
      "division": "D-IA"
    },
    "50263": {
      "school_short": "Citadel",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50622": {
      "school_short": "Samford",
      "world": "bryant",
      "division": "D-IAA"
    },
    "49938": {
      "school_short": "King`s",
      "world": "camp",
      "division": "D-III"
    },
    "49868": {
      "school_short": "DePauw",
      "world": "camp",
      "division": "D-III"
    },
    "53511": {
      "school_short": "Northern Arizona",
      "world": "heisman",
      "division": "D-IAA"
    },
    "55464": {
      "school_short": "Colorado School of Mines",
      "world": "yost",
      "division": "D-II"
    },
    "50645": {
      "school_short": "Morgan State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "55336": {
      "school_short": "Savannah State",
      "world": "yost",
      "division": "D-IAA"
    },
    "52547": {
      "school_short": "Virginia State",
      "world": "stagg",
      "division": "D-II"
    },
    "52077": {
      "school_short": "Missouri State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52750": {
      "school_short": "Northern State",
      "world": "warner",
      "division": "D-II"
    },
    "51736": {
      "school_short": "North Central",
      "world": "leahy",
      "division": "D-III"
    },
    "51548": {
      "school_short": "South Dakota State",
      "world": "leahy",
      "division": "D-II"
    },
    "52190": {
      "school_short": "Hobart",
      "world": "stagg",
      "division": "D-III"
    },
    "52387": {
      "school_short": "Marquette",
      "world": "stagg",
      "division": "D-IA"
    },
    "52361": {
      "school_short": "Brockport",
      "world": "stagg",
      "division": "D-III"
    },
    "52099": {
      "school_short": "Citadel",
      "world": "stagg",
      "division": "D-IAA"
    },
    "55640": {
      "school_short": "Marietta",
      "world": "yost",
      "division": "D-III"
    },
    "50380": {
      "school_short": "North Carolina State",
      "world": "bryant",
      "division": "D-IA"
    },
    "53988": {
      "school_short": "West Liberty State",
      "world": "dobie",
      "division": "D-II"
    },
    "55437": {
      "school_short": "Central Missouri State",
      "world": "yost",
      "division": "D-II"
    },
    "50741": {
      "school_short": "Winston-Salem State",
      "world": "bryant",
      "division": "D-II"
    },
    "53864": {
      "school_short": "Wisconsin",
      "world": "dobie",
      "division": "D-IA"
    },
    "49954": {
      "school_short": "Connecticut",
      "world": "camp",
      "division": "D-IA"
    },
    "53212": {
      "school_short": "Rhodes",
      "world": "warner",
      "division": "D-III"
    },
    "50462": {
      "school_short": "Earlham",
      "world": "bryant",
      "division": "D-III"
    },
    "55383": {
      "school_short": "Murray State",
      "world": "yost",
      "division": "D-IAA"
    },
    "50489": {
      "school_short": "Redlands",
      "world": "bryant",
      "division": "D-III"
    },
    "51716": {
      "school_short": "Christopher Newport",
      "world": "leahy",
      "division": "D-III"
    },
    "51804": {
      "school_short": "Wisconsin",
      "world": "leahy",
      "division": "D-IA"
    },
    "52768": {
      "school_short": "Colorado School of Mines",
      "world": "warner",
      "division": "D-II"
    },
    "50722": {
      "school_short": "Bemidji State",
      "world": "bryant",
      "division": "D-II"
    },
    "51821": {
      "school_short": "Houston",
      "world": "leahy",
      "division": "D-IA"
    },
    "51370": {
      "school_short": "Capital",
      "world": "wilkinson",
      "division": "D-III"
    },
    "52263": {
      "school_short": "Maine Maritime",
      "world": "stagg",
      "division": "D-III"
    },
    "53369": {
      "school_short": "Kutztown",
      "world": "heisman",
      "division": "D-II"
    },
    "50283": {
      "school_short": "Findlay",
      "world": "bryant",
      "division": "D-II"
    },
    "49794": {
      "school_short": "Wheaton",
      "world": "camp",
      "division": "D-III"
    },
    "50768": {
      "school_short": "Defiance",
      "world": "bryant",
      "division": "D-III"
    },
    "51586": {
      "school_short": "Merchant Marine",
      "world": "leahy",
      "division": "D-III"
    },
    "55618": {
      "school_short": "Ohio Wesleyan",
      "world": "yost",
      "division": "D-III"
    },
    "53268": {
      "school_short": "UTEP",
      "world": "heisman",
      "division": "D-IA"
    },
    "55088": {
      "school_short": "Wisconsin",
      "world": "yost",
      "division": "D-IA"
    },
    "54783": {
      "school_short": "Fayetteville State",
      "world": "hayes",
      "division": "D-II"
    },
    "55470": {
      "school_short": "Fort Lewis",
      "world": "yost",
      "division": "D-II"
    },
    "52775": {
      "school_short": "Mesa State",
      "world": "warner",
      "division": "D-II"
    },
    "53247": {
      "school_short": "Kentucky",
      "world": "heisman",
      "division": "D-IA"
    },
    "55253": {
      "school_short": "Georgia Tech",
      "world": "yost",
      "division": "D-IA"
    },
    "54476": {
      "school_short": "Wisconsin",
      "world": "hayes",
      "division": "D-IA"
    },
    "53618": {
      "school_short": "Central Missouri State",
      "world": "heisman",
      "division": "D-II"
    },
    "50607": {
      "school_short": "Northern Illinois",
      "world": "bryant",
      "division": "D-IA"
    },
    "54897": {
      "school_short": "Elmhurst",
      "world": "hayes",
      "division": "D-III"
    },
    "50580": {
      "school_short": "Wisconsin",
      "world": "bryant",
      "division": "D-IA"
    },
    "55589": {
      "school_short": "Tufts",
      "world": "yost",
      "division": "D-III"
    },
    "50760": {
      "school_short": "Mount Union",
      "world": "bryant",
      "division": "D-III"
    },
    "51929": {
      "school_short": "South Dakota",
      "world": "leahy",
      "division": "D-II"
    },
    "53172": {
      "school_short": "Case Western",
      "world": "warner",
      "division": "D-III"
    },
    "54140": {
      "school_short": "Robert Morris",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51966": {
      "school_short": "Ashland",
      "world": "leahy",
      "division": "D-II"
    },
    "52660": {
      "school_short": "Fresno State",
      "world": "warner",
      "division": "D-IA"
    },
    "52756": {
      "school_short": "East Stroudsburg",
      "world": "warner",
      "division": "D-II"
    },
    "50435": {
      "school_short": "Tufts",
      "world": "bryant",
      "division": "D-III"
    },
    "50300": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "bryant",
      "division": "D-II"
    },
    "55447": {
      "school_short": "Lock Haven",
      "world": "yost",
      "division": "D-II"
    },
    "55313": {
      "school_short": "Richmond",
      "world": "yost",
      "division": "D-IAA"
    },
    "54219": {
      "school_short": "Missouri Southern State",
      "world": "dobie",
      "division": "D-II"
    },
    "55348": {
      "school_short": "Colgate",
      "world": "yost",
      "division": "D-IAA"
    },
    "51851": {
      "school_short": "Dayton",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50612": {
      "school_short": "Towson",
      "world": "bryant",
      "division": "D-IAA"
    },
    "54147": {
      "school_short": "Georgetown",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53958": {
      "school_short": "Texas Southern",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54130": {
      "school_short": "Duquesne",
      "world": "dobie",
      "division": "D-IAA"
    },
    "52484": {
      "school_short": "California State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "54846": {
      "school_short": "Clarion",
      "world": "hayes",
      "division": "D-II"
    },
    "54547": {
      "school_short": "Charleston Southern",
      "world": "hayes",
      "division": "D-IAA"
    },
    "54784": {
      "school_short": "Johnson C. Smith",
      "world": "hayes",
      "division": "D-II"
    },
    "54607": {
      "school_short": "Kentucky State",
      "world": "hayes",
      "division": "D-II"
    },
    "54797": {
      "school_short": "Michigan Tech",
      "world": "hayes",
      "division": "D-II"
    },
    "55273": {
      "school_short": "Texas A&M",
      "world": "yost",
      "division": "D-IA"
    },
    "54687": {
      "school_short": "San Jose State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54713": {
      "school_short": "Stephen F. Austin",
      "world": "hayes",
      "division": "D-IAA"
    },
    "50126": {
      "school_short": "Livingstone",
      "world": "camp",
      "division": "D-II"
    },
    "54774": {
      "school_short": "Tennessee State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "49992": {
      "school_short": "Eastern Michigan",
      "world": "camp",
      "division": "D-IA"
    },
    "55241": {
      "school_short": "Franklin & Marshall",
      "world": "yost",
      "division": "D-III"
    },
    "55114": {
      "school_short": "Toledo",
      "world": "yost",
      "division": "D-IA"
    },
    "55422": {
      "school_short": "Arkansas-Monticello",
      "world": "yost",
      "division": "D-II"
    },
    "50590": {
      "school_short": "Memphis",
      "world": "bryant",
      "division": "D-IA"
    },
    "55160": {
      "school_short": "Coastal Carolina",
      "world": "yost",
      "division": "D-IAA"
    },
    "55623": {
      "school_short": "Pacific Lutheran",
      "world": "yost",
      "division": "D-III"
    },
    "55674": {
      "school_short": "Shenandoah",
      "world": "yost",
      "division": "D-III"
    },
    "49501": {
      "school_short": "Minnesota-Crookston",
      "world": "rockne",
      "division": "D-II"
    },
    "49602": {
      "school_short": "Navy",
      "world": "camp",
      "division": "D-IA"
    },
    "55071": {
      "school_short": "Wisconsin-Platteville",
      "world": "hayes",
      "division": "D-III"
    },
    "49567": {
      "school_short": "Bethany",
      "world": "rockne",
      "division": "D-III"
    },
    "49619": {
      "school_short": "UNLV",
      "world": "camp",
      "division": "D-IA"
    },
    "54282": {
      "school_short": "MacMurray",
      "world": "dobie",
      "division": "D-III"
    },
    "51137": {
      "school_short": "East Texas Baptist",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51819": {
      "school_short": "Alabama Birmingham",
      "world": "leahy",
      "division": "D-IA"
    },
    "51735": {
      "school_short": "Millikin",
      "world": "leahy",
      "division": "D-III"
    },
    "51877": {
      "school_short": "Wagner",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51289": {
      "school_short": "Northern Arizona",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "54666": {
      "school_short": "Connecticut",
      "world": "hayes",
      "division": "D-IA"
    },
    "53381": {
      "school_short": "Fort Hays State",
      "world": "heisman",
      "division": "D-II"
    },
    "51414": {
      "school_short": "California",
      "world": "leahy",
      "division": "D-IA"
    },
    "54659": {
      "school_short": "Oklahoma State",
      "world": "hayes",
      "division": "D-IA"
    },
    "55326": {
      "school_short": "Texas State",
      "world": "yost",
      "division": "D-IAA"
    },
    "53043": {
      "school_short": "Coast Guard",
      "world": "warner",
      "division": "D-III"
    },
    "50807": {
      "school_short": "UCLA",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "55621": {
      "school_short": "Lewis and Clark",
      "world": "yost",
      "division": "D-III"
    },
    "52574": {
      "school_short": "Mount Union",
      "world": "stagg",
      "division": "D-III"
    },
    "51365": {
      "school_short": "Menlo",
      "world": "wilkinson",
      "division": "D-III"
    },
    "53378": {
      "school_short": "Slippery Rock",
      "world": "heisman",
      "division": "D-II"
    },
    "51252": {
      "school_short": "La Salle",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51675": {
      "school_short": "Huntingdon",
      "world": "leahy",
      "division": "D-III"
    },
    "52709": {
      "school_short": "North Carolina Central",
      "world": "warner",
      "division": "D-II"
    },
    "54652": {
      "school_short": "Nebraska",
      "world": "hayes",
      "division": "D-IA"
    },
    "50195": {
      "school_short": "UCLA",
      "world": "bryant",
      "division": "D-IA"
    },
    "53296": {
      "school_short": "Tennessee-Chattanooga",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53425": {
      "school_short": "Virginia Tech",
      "world": "heisman",
      "division": "D-IA"
    },
    "51902": {
      "school_short": "Montana State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "53580": {
      "school_short": "Valparaiso",
      "world": "heisman",
      "division": "D-IAA"
    },
    "53655": {
      "school_short": "Coast Guard",
      "world": "heisman",
      "division": "D-III"
    },
    "51525": {
      "school_short": "Tarleton State",
      "world": "leahy",
      "division": "D-II"
    },
    "55541": {
      "school_short": "Susquehanna",
      "world": "yost",
      "division": "D-III"
    },
    "52139": {
      "school_short": "Abilene Christian",
      "world": "stagg",
      "division": "D-II"
    },
    "52467": {
      "school_short": "Wagner",
      "world": "stagg",
      "division": "D-IAA"
    },
    "54755": {
      "school_short": "Albany",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55222": {
      "school_short": "Clark Atlanta",
      "world": "yost",
      "division": "D-II"
    },
    "55374": {
      "school_short": "Towson",
      "world": "yost",
      "division": "D-IAA"
    },
    "55388": {
      "school_short": "Liberty",
      "world": "yost",
      "division": "D-IAA"
    },
    "53664": {
      "school_short": "Utica",
      "world": "heisman",
      "division": "D-III"
    },
    "55322": {
      "school_short": "Northern Arizona",
      "world": "yost",
      "division": "D-IAA"
    },
    "55410": {
      "school_short": "Northwood",
      "world": "yost",
      "division": "D-II"
    },
    "55496": {
      "school_short": "Alfred",
      "world": "yost",
      "division": "D-III"
    },
    "50143": {
      "school_short": "Stillman",
      "world": "camp",
      "division": "D-III"
    },
    "54472": {
      "school_short": "Michigan State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54725": {
      "school_short": "Southeastern Louisiana",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55226": {
      "school_short": "Saint Joseph`s",
      "world": "yost",
      "division": "D-II"
    },
    "55368": {
      "school_short": "Wagner",
      "world": "yost",
      "division": "D-IAA"
    },
    "55612": {
      "school_short": "Oberlin",
      "world": "yost",
      "division": "D-III"
    },
    "51295": {
      "school_short": "Adams State",
      "world": "wilkinson",
      "division": "D-II"
    },
    "50848": {
      "school_short": "Indiana State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51384": {
      "school_short": "Guilford",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51034": {
      "school_short": "Salve Regina",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51000": {
      "school_short": "Kansas",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "53931": {
      "school_short": "Austin Peay",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54079": {
      "school_short": "William & Mary",
      "world": "dobie",
      "division": "D-IAA"
    },
    "53879": {
      "school_short": "Alabama Birmingham",
      "world": "dobie",
      "division": "D-IA"
    },
    "50895": {
      "school_short": "Findlay",
      "world": "wilkinson",
      "division": "D-II"
    },
    "53910": {
      "school_short": "Vanderbilt",
      "world": "dobie",
      "division": "D-IA"
    },
    "54173": {
      "school_short": "Livingstone",
      "world": "dobie",
      "division": "D-II"
    },
    "54210": {
      "school_short": "Texas A&M-Commerce",
      "world": "dobie",
      "division": "D-II"
    },
    "52343": {
      "school_short": "McMurry",
      "world": "stagg",
      "division": "D-III"
    },
    "52145": {
      "school_short": "Central Missouri State",
      "world": "stagg",
      "division": "D-II"
    },
    "52744": {
      "school_short": "Minnesota State-Moorhead",
      "world": "warner",
      "division": "D-II"
    },
    "53654": {
      "school_short": "Plymouth State",
      "world": "heisman",
      "division": "D-III"
    },
    "55466": {
      "school_short": "Midwestern State",
      "world": "yost",
      "division": "D-II"
    },
    "54583": {
      "school_short": "Southern Connecticut",
      "world": "hayes",
      "division": "D-II"
    },
    "50274": {
      "school_short": "Alcorn State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "55392": {
      "school_short": "Virginia State",
      "world": "yost",
      "division": "D-II"
    },
    "54105": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "dobie",
      "division": "D-IAA"
    },
    "52338": {
      "school_short": "Quincy",
      "world": "stagg",
      "division": "D-II"
    },
    "55448": {
      "school_short": "Cheyney",
      "world": "yost",
      "division": "D-II"
    },
    "50564": {
      "school_short": "Syracuse",
      "world": "bryant",
      "division": "D-IA"
    },
    "49380": {
      "school_short": "Eastern Michigan",
      "world": "rockne",
      "division": "D-IA"
    },
    "55405": {
      "school_short": "Saginaw Valley State",
      "world": "yost",
      "division": "D-II"
    },
    "52824": {
      "school_short": "Texas Tech",
      "world": "warner",
      "division": "D-IA"
    },
    "53288": {
      "school_short": "Appalachian State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54151": {
      "school_short": "Eastern Illinois",
      "world": "dobie",
      "division": "D-IAA"
    },
    "55276": {
      "school_short": "Syracuse",
      "world": "yost",
      "division": "D-IA"
    },
    "50615": {
      "school_short": "Tennessee-Martin",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50592": {
      "school_short": "Central Florida",
      "world": "bryant",
      "division": "D-IA"
    },
    "53473": {
      "school_short": "Houston",
      "world": "heisman",
      "division": "D-IA"
    },
    "52379": {
      "school_short": "Temple",
      "world": "stagg",
      "division": "D-IA"
    },
    "50332": {
      "school_short": "West Liberty State",
      "world": "bryant",
      "division": "D-II"
    },
    "55451": {
      "school_short": "North Dakota State",
      "world": "yost",
      "division": "D-II"
    },
    "53356": {
      "school_short": "Minnesota State-Moorhead",
      "world": "heisman",
      "division": "D-II"
    },
    "49072": {
      "school_short": "Valdosta State",
      "world": "rockne",
      "division": "D-II"
    },
    "55662": {
      "school_short": "Trinity (TX)",
      "world": "yost",
      "division": "D-III"
    },
    "50058": {
      "school_short": "California State",
      "world": "camp",
      "division": "D-IAA"
    },
    "55087": {
      "school_short": "Minnesota",
      "world": "yost",
      "division": "D-IA"
    },
    "51298": {
      "school_short": "New Mexico Highlands",
      "world": "wilkinson",
      "division": "D-II"
    },
    "53906": {
      "school_short": "Air Force",
      "world": "dobie",
      "division": "D-IA"
    },
    "51389": {
      "school_short": "Grinnell",
      "world": "wilkinson",
      "division": "D-III"
    },
    "53262": {
      "school_short": "North Texas",
      "world": "heisman",
      "division": "D-IA"
    },
    "55411": {
      "school_short": "Findlay",
      "world": "yost",
      "division": "D-II"
    },
    "50296": {
      "school_short": "Valdosta State",
      "world": "bryant",
      "division": "D-II"
    },
    "50920": {
      "school_short": "West Texas A&M",
      "world": "wilkinson",
      "division": "D-II"
    },
    "51564": {
      "school_short": "California (PA)",
      "world": "leahy",
      "division": "D-II"
    },
    "54436": {
      "school_short": "Rhodes",
      "world": "dobie",
      "division": "D-III"
    },
    "54031": {
      "school_short": "Virginia",
      "world": "dobie",
      "division": "D-IA"
    },
    "53896": {
      "school_short": "Oregon",
      "world": "dobie",
      "division": "D-IA"
    },
    "53495": {
      "school_short": "Southern California",
      "world": "heisman",
      "division": "D-IA"
    },
    "55475": {
      "school_short": "Carson-Newman",
      "world": "yost",
      "division": "D-II"
    },
    "51274": {
      "school_short": "Rhode Island",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "55318": {
      "school_short": "Portland State",
      "world": "yost",
      "division": "D-IAA"
    },
    "54121": {
      "school_short": "Cornell",
      "world": "dobie",
      "division": "D-IAA"
    },
    "55445": {
      "school_short": "Missouri-Rolla",
      "world": "yost",
      "division": "D-II"
    },
    "51280": {
      "school_short": "Richmond",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51662": {
      "school_short": "Bowdoin",
      "world": "leahy",
      "division": "D-III"
    },
    "55625": {
      "school_short": "Whitworth",
      "world": "yost",
      "division": "D-III"
    },
    "51500": {
      "school_short": "Mississippi Valley State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50406": {
      "school_short": "Wheaton",
      "world": "bryant",
      "division": "D-III"
    },
    "51271": {
      "school_short": "James Madison",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "52076": {
      "school_short": "Youngstown State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "51233": {
      "school_short": "Murray State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51235": {
      "school_short": "Southeast Missouri State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51413": {
      "school_short": "Washington State",
      "world": "leahy",
      "division": "D-IA"
    },
    "53204": {
      "school_short": "Anderson",
      "world": "warner",
      "division": "D-III"
    },
    "53579": {
      "school_short": "San Diego",
      "world": "heisman",
      "division": "D-IAA"
    },
    "52914": {
      "school_short": "Southeastern Louisiana",
      "world": "warner",
      "division": "D-IAA"
    },
    "52491": {
      "school_short": "Northern Arizona",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52283": {
      "school_short": "New Jersey",
      "world": "stagg",
      "division": "D-III"
    },
    "49040": {
      "school_short": "Western Carolina",
      "world": "rockne",
      "division": "D-IAA"
    },
    "51550": {
      "school_short": "Winona State",
      "world": "leahy",
      "division": "D-II"
    },
    "52227": {
      "school_short": "Oklahoma",
      "world": "stagg",
      "division": "D-IA"
    },
    "51745": {
      "school_short": "Morehouse",
      "world": "leahy",
      "division": "D-II"
    },
    "50024": {
      "school_short": "Florida A&M",
      "world": "camp",
      "division": "D-IAA"
    },
    "49355": {
      "school_short": "Minnesota",
      "world": "rockne",
      "division": "D-IA"
    },
    "50866": {
      "school_short": "Princeton",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "51086": {
      "school_short": "Anderson",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51467": {
      "school_short": "Florida International",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51967": {
      "school_short": "Grand Valley State",
      "world": "leahy",
      "division": "D-II"
    },
    "51507": {
      "school_short": "Findlay",
      "world": "leahy",
      "division": "D-II"
    },
    "52078": {
      "school_short": "Northern Iowa",
      "world": "stagg",
      "division": "D-IAA"
    },
    "52372": {
      "school_short": "Widener",
      "world": "stagg",
      "division": "D-III"
    },
    "52532": {
      "school_short": "Saint Anselm",
      "world": "stagg",
      "division": "D-II"
    },
    "52225": {
      "school_short": "Colorado",
      "world": "stagg",
      "division": "D-IA"
    },
    "51825": {
      "school_short": "Kent State",
      "world": "leahy",
      "division": "D-IA"
    },
    "51472": {
      "school_short": "Columbia",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51948": {
      "school_short": "Southwest Minnesota State",
      "world": "leahy",
      "division": "D-II"
    },
    "51988": {
      "school_short": "Marietta",
      "world": "leahy",
      "division": "D-III"
    },
    "50932": {
      "school_short": "Cheyney",
      "world": "wilkinson",
      "division": "D-II"
    },
    "55409": {
      "school_short": "Michigan Tech",
      "world": "yost",
      "division": "D-II"
    },
    "51267": {
      "school_short": "Saint Francis",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "52544": {
      "school_short": "Bowie State",
      "world": "stagg",
      "division": "D-II"
    },
    "53380": {
      "school_short": "Colorado School of Mines",
      "world": "heisman",
      "division": "D-II"
    },
    "52212": {
      "school_short": "North Carolina",
      "world": "stagg",
      "division": "D-IA"
    },
    "52287": {
      "school_short": "Huntingdon",
      "world": "stagg",
      "division": "D-III"
    },
    "52294": {
      "school_short": "Oberlin",
      "world": "stagg",
      "division": "D-III"
    },
    "51913": {
      "school_short": "Carson-Newman",
      "world": "leahy",
      "division": "D-II"
    },
    "52059": {
      "school_short": "Boise State",
      "world": "stagg",
      "division": "D-IA"
    },
    "53215": {
      "school_short": "South-Sewanee",
      "world": "warner",
      "division": "D-III"
    },
    "50117": {
      "school_short": "Liberty",
      "world": "camp",
      "division": "D-IAA"
    },
    "51006": {
      "school_short": "Texas Tech",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51903": {
      "school_short": "Sam Houston State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "51756": {
      "school_short": "Mississippi",
      "world": "leahy",
      "division": "D-III"
    },
    "50642": {
      "school_short": "Bethune-Cookman",
      "world": "bryant",
      "division": "D-IAA"
    },
    "51140": {
      "school_short": "Louisiana",
      "world": "wilkinson",
      "division": "D-III"
    },
    "49951": {
      "school_short": "Rutgers",
      "world": "camp",
      "division": "D-IA"
    },
    "54253": {
      "school_short": "Mars Hill",
      "world": "dobie",
      "division": "D-II"
    },
    "53689": {
      "school_short": "Adrian",
      "world": "heisman",
      "division": "D-III"
    },
    "54299": {
      "school_short": "Washington and Jefferson",
      "world": "dobie",
      "division": "D-III"
    },
    "49301": {
      "school_short": "East Texas Baptist",
      "world": "rockne",
      "division": "D-III"
    },
    "53845": {
      "school_short": "Wisconsin-Eau Claire",
      "world": "heisman",
      "division": "D-III"
    },
    "50810": {
      "school_short": "Georgia",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "49735": {
      "school_short": "Colorado School of Mines",
      "world": "camp",
      "division": "D-II"
    },
    "52487": {
      "school_short": "Portland State",
      "world": "stagg",
      "division": "D-IAA"
    },
    "55265": {
      "school_short": "Missouri",
      "world": "yost",
      "division": "D-IA"
    },
    "50808": {
      "school_short": "Stanford",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51466": {
      "school_short": "Northern Iowa",
      "world": "leahy",
      "division": "D-IAA"
    },
    "49159": {
      "school_short": "Virginia Tech",
      "world": "rockne",
      "division": "D-IA"
    },
    "54009": {
      "school_short": "Mary Hardin-Baylor",
      "world": "dobie",
      "division": "D-III"
    },
    "52728": {
      "school_short": "Humboldt State",
      "world": "warner",
      "division": "D-II"
    },
    "50820": {
      "school_short": "Arkansas",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "55206": {
      "school_short": "Winona State",
      "world": "yost",
      "division": "D-II"
    },
    "51901": {
      "school_short": "Northern Arizona",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52559": {
      "school_short": "Northern Michigan",
      "world": "stagg",
      "division": "D-II"
    },
    "52624": {
      "school_short": "Trinity (TX)",
      "world": "stagg",
      "division": "D-III"
    },
    "52156": {
      "school_short": "Cheyney",
      "world": "stagg",
      "division": "D-II"
    },
    "52952": {
      "school_short": "Eastern Illinois",
      "world": "warner",
      "division": "D-IAA"
    },
    "53200": {
      "school_short": "Guilford",
      "world": "warner",
      "division": "D-III"
    },
    "52875": {
      "school_short": "Oregon State",
      "world": "warner",
      "division": "D-IA"
    },
    "53237": {
      "school_short": "Wisconsin-Stevens Point",
      "world": "warner",
      "division": "D-III"
    },
    "53148": {
      "school_short": "MIT",
      "world": "warner",
      "division": "D-III"
    },
    "51606": {
      "school_short": "Miami (FL)",
      "world": "leahy",
      "division": "D-IA"
    },
    "54521": {
      "school_short": "Florida",
      "world": "hayes",
      "division": "D-IA"
    },
    "53629": {
      "school_short": "East Texas Baptist",
      "world": "heisman",
      "division": "D-III"
    },
    "53693": {
      "school_short": "Kalamazoo",
      "world": "heisman",
      "division": "D-III"
    },
    "53246": {
      "school_short": "South Carolina",
      "world": "heisman",
      "division": "D-IA"
    },
    "52215": {
      "school_short": "Florida State",
      "world": "stagg",
      "division": "D-IA"
    },
    "51768": {
      "school_short": "Colorado",
      "world": "leahy",
      "division": "D-III"
    },
    "53622": {
      "school_short": "Pittsburg State",
      "world": "heisman",
      "division": "D-II"
    },
    "55030": {
      "school_short": "Wilmington (OH)",
      "world": "hayes",
      "division": "D-III"
    },
    "53749": {
      "school_short": "Amherst",
      "world": "heisman",
      "division": "D-III"
    },
    "49533": {
      "school_short": "Baldwin-Wallace",
      "world": "rockne",
      "division": "D-III"
    },
    "49012": {
      "school_short": "Indiana State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "52221": {
      "school_short": "Kansas State",
      "world": "stagg",
      "division": "D-IA"
    },
    "49108": {
      "school_short": "West Liberty State",
      "world": "rockne",
      "division": "D-II"
    },
    "49367": {
      "school_short": "Marshall",
      "world": "rockne",
      "division": "D-IA"
    },
    "54743": {
      "school_short": "La Salle",
      "world": "hayes",
      "division": "D-IAA"
    },
    "50002": {
      "school_short": "Tennessee Tech",
      "world": "camp",
      "division": "D-IAA"
    },
    "50374": {
      "school_short": "Duke",
      "world": "bryant",
      "division": "D-IA"
    },
    "49786": {
      "school_short": "Greenville",
      "world": "camp",
      "division": "D-III"
    },
    "54535": {
      "school_short": "Navy",
      "world": "hayes",
      "division": "D-IA"
    },
    "49928": {
      "school_short": "Kalamazoo",
      "world": "camp",
      "division": "D-III"
    },
    "54513": {
      "school_short": "Arizona State",
      "world": "hayes",
      "division": "D-IA"
    },
    "54790": {
      "school_short": "Grand Valley State",
      "world": "hayes",
      "division": "D-II"
    },
    "50669": {
      "school_short": "Florida Atlantic",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50007": {
      "school_short": "Eastern Kentucky",
      "world": "camp",
      "division": "D-IAA"
    },
    "50275": {
      "school_short": "Jackson State",
      "world": "bryant",
      "division": "D-IAA"
    },
    "50358": {
      "school_short": "Rochester",
      "world": "bryant",
      "division": "D-III"
    },
    "52536": {
      "school_short": "Bemidji State",
      "world": "stagg",
      "division": "D-II"
    },
    "52676": {
      "school_short": "Appalachian State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52863": {
      "school_short": "Miami (OH)",
      "world": "warner",
      "division": "D-IA"
    },
    "54532": {
      "school_short": "Middle Tennessee State",
      "world": "hayes",
      "division": "D-IA"
    },
    "49515": {
      "school_short": "North Carolina Central",
      "world": "rockne",
      "division": "D-II"
    },
    "53099": {
      "school_short": "Widener",
      "world": "warner",
      "division": "D-III"
    },
    "52981": {
      "school_short": "Wayne State",
      "world": "warner",
      "division": "D-II"
    },
    "49583": {
      "school_short": "UCLA",
      "world": "camp",
      "division": "D-IA"
    },
    "54859": {
      "school_short": "Mesa State",
      "world": "hayes",
      "division": "D-II"
    },
    "49603": {
      "school_short": "Army",
      "world": "camp",
      "division": "D-IA"
    },
    "51894": {
      "school_short": "California State",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50469": {
      "school_short": "Pacific Lutheran",
      "world": "bryant",
      "division": "D-III"
    },
    "50344": {
      "school_short": "Shippensburg",
      "world": "bryant",
      "division": "D-II"
    },
    "53540": {
      "school_short": "Florida A&M",
      "world": "heisman",
      "division": "D-IAA"
    },
    "52650": {
      "school_short": "North Texas",
      "world": "warner",
      "division": "D-IA"
    },
    "49341": {
      "school_short": "Temple",
      "world": "rockne",
      "division": "D-IA"
    },
    "49320": {
      "school_short": "Colorado",
      "world": "rockne",
      "division": "D-III"
    },
    "51853": {
      "school_short": "Valparaiso",
      "world": "leahy",
      "division": "D-IAA"
    },
    "52394": {
      "school_short": "Wisconsin",
      "world": "stagg",
      "division": "D-IA"
    },
    "53828": {
      "school_short": "Occidental",
      "world": "heisman",
      "division": "D-III"
    },
    "53521": {
      "school_short": "Youngstown State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54654": {
      "school_short": "Kansas",
      "world": "hayes",
      "division": "D-IA"
    },
    "49883": {
      "school_short": "Methodist",
      "world": "camp",
      "division": "D-III"
    },
    "49171": {
      "school_short": "Texas A&M",
      "world": "rockne",
      "division": "D-IA"
    },
    "54710": {
      "school_short": "Northern Arizona",
      "world": "hayes",
      "division": "D-IAA"
    },
    "53723": {
      "school_short": "Chicago",
      "world": "heisman",
      "division": "D-III"
    },
    "49972": {
      "school_short": "Indiana",
      "world": "camp",
      "division": "D-IA"
    },
    "49018": {
      "school_short": "Northern Iowa",
      "world": "rockne",
      "division": "D-IAA"
    },
    "54570": {
      "school_short": "Texas Southern",
      "world": "hayes",
      "division": "D-IAA"
    },
    "52700": {
      "school_short": "Bowie State",
      "world": "warner",
      "division": "D-II"
    },
    "49123": {
      "school_short": "Colorado School of Mines",
      "world": "rockne",
      "division": "D-II"
    },
    "50538": {
      "school_short": "Franklin & Marshall",
      "world": "bryant",
      "division": "D-III"
    },
    "51184": {
      "school_short": "DePaul",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50812": {
      "school_short": "Florida",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "49282": {
      "school_short": "Wisconsin-River Falls",
      "world": "rockne",
      "division": "D-III"
    },
    "51002": {
      "school_short": "Iowa State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "53992": {
      "school_short": "Kutztown",
      "world": "dobie",
      "division": "D-II"
    },
    "54157": {
      "school_short": "Eastern Kentucky",
      "world": "dobie",
      "division": "D-IAA"
    },
    "52999": {
      "school_short": "Central Oklahoma",
      "world": "warner",
      "division": "D-II"
    },
    "50415": {
      "school_short": "Dubuque",
      "world": "bryant",
      "division": "D-III"
    },
    "49506": {
      "school_short": "Bowie State",
      "world": "rockne",
      "division": "D-II"
    },
    "49010": {
      "school_short": "Texas State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "50087": {
      "school_short": "West Virginia Tech",
      "world": "camp",
      "division": "D-II"
    },
    "54475": {
      "school_short": "Minnesota",
      "world": "hayes",
      "division": "D-IA"
    },
    "50211": {
      "school_short": "Middle Tennessee State",
      "world": "bryant",
      "division": "D-IA"
    },
    "54816": {
      "school_short": "SW Oklahoma-Weatherford",
      "world": "hayes",
      "division": "D-II"
    },
    "55423": {
      "school_short": "North Alabama",
      "world": "yost",
      "division": "D-II"
    },
    "50223": {
      "school_short": "Boise State",
      "world": "bryant",
      "division": "D-IA"
    },
    "52891": {
      "school_short": "Florida Atlantic",
      "world": "warner",
      "division": "D-IAA"
    },
    "52985": {
      "school_short": "West Georgia",
      "world": "warner",
      "division": "D-II"
    },
    "53346": {
      "school_short": "Long Island",
      "world": "heisman",
      "division": "D-II"
    },
    "53258": {
      "school_short": "Navy",
      "world": "heisman",
      "division": "D-IA"
    },
    "53355": {
      "school_short": "Bemidji State",
      "world": "heisman",
      "division": "D-II"
    },
    "53340": {
      "school_short": "Humboldt State",
      "world": "heisman",
      "division": "D-II"
    },
    "50362": {
      "school_short": "Merchant Marine",
      "world": "bryant",
      "division": "D-III"
    },
    "54059": {
      "school_short": "South Florida",
      "world": "dobie",
      "division": "D-IA"
    },
    "52557": {
      "school_short": "Grand Valley State",
      "world": "stagg",
      "division": "D-II"
    },
    "55314": {
      "school_short": "Florida Atlantic",
      "world": "yost",
      "division": "D-IAA"
    },
    "55686": {
      "school_short": "Wisconsin-Whitewater",
      "world": "yost",
      "division": "D-III"
    },
    "50369": {
      "school_short": "St. John Fisher",
      "world": "bryant",
      "division": "D-III"
    },
    "50849": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50968": {
      "school_short": "St. Lawrence",
      "world": "wilkinson",
      "division": "D-III"
    },
    "55201": {
      "school_short": "Fairmont State",
      "world": "yost",
      "division": "D-II"
    },
    "55317": {
      "school_short": "Cal Poly",
      "world": "yost",
      "division": "D-IAA"
    },
    "50442": {
      "school_short": "MIT",
      "world": "bryant",
      "division": "D-III"
    },
    "53294": {
      "school_short": "East Tennessee State",
      "world": "heisman",
      "division": "D-IAA"
    },
    "54411": {
      "school_short": "John Carroll",
      "world": "dobie",
      "division": "D-III"
    },
    "53766": {
      "school_short": "William Paterson",
      "world": "heisman",
      "division": "D-III"
    },
    "49811": {
      "school_short": "UMass-Dartmouth",
      "world": "camp",
      "division": "D-III"
    },
    "54716": {
      "school_short": "Indiana State",
      "world": "hayes",
      "division": "D-IAA"
    },
    "55650": {
      "school_short": "Randolph-Macon",
      "world": "yost",
      "division": "D-III"
    },
    "50359": {
      "school_short": "Norwich",
      "world": "bryant",
      "division": "D-III"
    },
    "55216": {
      "school_short": "Kutztown",
      "world": "yost",
      "division": "D-II"
    },
    "50995": {
      "school_short": "Virginia Tech",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "52262": {
      "school_short": "Fitchburg State",
      "world": "stagg",
      "division": "D-III"
    },
    "55233": {
      "school_short": "Mary Hardin-Baylor",
      "world": "yost",
      "division": "D-III"
    },
    "51369": {
      "school_short": "Baldwin-Wallace",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51492": {
      "school_short": "Tennessee-Chattanooga",
      "world": "leahy",
      "division": "D-IAA"
    },
    "50976": {
      "school_short": "Worcester Tech",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51117": {
      "school_short": "Wisconsin-Platteville",
      "world": "wilkinson",
      "division": "D-III"
    },
    "53488": {
      "school_short": "Oregon",
      "world": "heisman",
      "division": "D-IA"
    },
    "49298": {
      "school_short": "Kentucky Wesleyan",
      "world": "rockne",
      "division": "D-II"
    },
    "49580": {
      "school_short": "Arizona State",
      "world": "camp",
      "division": "D-IA"
    },
    "50934": {
      "school_short": "Minnesota State-Mankato",
      "world": "wilkinson",
      "division": "D-II"
    },
    "49695": {
      "school_short": "Texas A&M-Kingsville",
      "world": "camp",
      "division": "D-II"
    },
    "55400": {
      "school_short": "Winston-Salem State",
      "world": "yost",
      "division": "D-II"
    },
    "55632": {
      "school_short": "Blackburn",
      "world": "yost",
      "division": "D-III"
    },
    "50189": {
      "school_short": "Washington State",
      "world": "bryant",
      "division": "D-IA"
    },
    "55153": {
      "school_short": "Valparaiso",
      "world": "yost",
      "division": "D-IAA"
    },
    "50860": {
      "school_short": "Columbia",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "53491": {
      "school_short": "California",
      "world": "heisman",
      "division": "D-IA"
    },
    "52352": {
      "school_short": "Franklin & Marshall",
      "world": "stagg",
      "division": "D-III"
    },
    "51803": {
      "school_short": "Minnesota",
      "world": "leahy",
      "division": "D-IA"
    },
    "52191": {
      "school_short": "Rensselaer Tech",
      "world": "stagg",
      "division": "D-III"
    },
    "53923": {
      "school_short": "Navy",
      "world": "dobie",
      "division": "D-IA"
    },
    "50991": {
      "school_short": "Florida State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "51600": {
      "school_short": "North Carolina",
      "world": "leahy",
      "division": "D-IA"
    },
    "50535": {
      "school_short": "California Lutheran",
      "world": "bryant",
      "division": "D-III"
    },
    "50703": {
      "school_short": "Nebraska-Omaha",
      "world": "bryant",
      "division": "D-II"
    },
    "55235": {
      "school_short": "Mississippi",
      "world": "yost",
      "division": "D-III"
    },
    "51180": {
      "school_short": "West Virginia",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "53939": {
      "school_short": "Georgia Southern",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51798": {
      "school_short": "Colorado State",
      "world": "leahy",
      "division": "D-IA"
    },
    "52500": {
      "school_short": "New Mexico Highlands",
      "world": "stagg",
      "division": "D-II"
    },
    "52182": {
      "school_short": "Chadron State",
      "world": "stagg",
      "division": "D-II"
    },
    "49995": {
      "school_short": "Northern Illinois",
      "world": "camp",
      "division": "D-IA"
    },
    "52899": {
      "school_short": "Northern Arizona",
      "world": "warner",
      "division": "D-IAA"
    },
    "50063": {
      "school_short": "St. Mary`s",
      "world": "camp",
      "division": "D-IAA"
    },
    "50578": {
      "school_short": "Michigan",
      "world": "bryant",
      "division": "D-IA"
    },
    "51805": {
      "school_short": "Ohio State",
      "world": "leahy",
      "division": "D-IA"
    },
    "53957": {
      "school_short": "Southern-Baton Rouge",
      "world": "dobie",
      "division": "D-IAA"
    },
    "54232": {
      "school_short": "West Chester",
      "world": "dobie",
      "division": "D-II"
    },
    "52143": {
      "school_short": "Texas A&M-Kingsville",
      "world": "stagg",
      "division": "D-II"
    },
    "49980": {
      "school_short": "Central Florida",
      "world": "camp",
      "division": "D-IA"
    },
    "49094": {
      "school_short": "Washburn-Topeka",
      "world": "rockne",
      "division": "D-II"
    },
    "50199": {
      "school_short": "Tennessee",
      "world": "bryant",
      "division": "D-IA"
    },
    "54413": {
      "school_short": "Muskingum",
      "world": "dobie",
      "division": "D-III"
    },
    "53924": {
      "school_short": "Army",
      "world": "dobie",
      "division": "D-IA"
    },
    "54108": {
      "school_short": "Youngstown State",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51296": {
      "school_short": "Fort Lewis",
      "world": "wilkinson",
      "division": "D-II"
    },
    "54419": {
      "school_short": "Mount St. Joseph",
      "world": "dobie",
      "division": "D-III"
    },
    "54090": {
      "school_short": "Florida Atlantic",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51632": {
      "school_short": "Central",
      "world": "leahy",
      "division": "D-III"
    },
    "53437": {
      "school_short": "Texas A&M",
      "world": "heisman",
      "division": "D-IA"
    },
    "54193": {
      "school_short": "Central Arkansas",
      "world": "dobie",
      "division": "D-II"
    },
    "54053": {
      "school_short": "Temple",
      "world": "dobie",
      "division": "D-IA"
    },
    "53899": {
      "school_short": "California",
      "world": "dobie",
      "division": "D-IA"
    },
    "53929": {
      "school_short": "Valparaiso",
      "world": "dobie",
      "division": "D-IAA"
    },
    "51275": {
      "school_short": "Villanova",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "50536": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "bryant",
      "division": "D-III"
    },
    "51750": {
      "school_short": "Hardin-Simmons",
      "world": "leahy",
      "division": "D-III"
    },
    "51579": {
      "school_short": "Rensselaer Tech",
      "world": "leahy",
      "division": "D-III"
    },
    "52406": {
      "school_short": "Central Florida",
      "world": "stagg",
      "division": "D-IA"
    },
    "52539": {
      "school_short": "Minnesota-Crookston",
      "world": "stagg",
      "division": "D-II"
    },
    "52502": {
      "school_short": "Western State (CO)",
      "world": "stagg",
      "division": "D-II"
    },
    "52322": {
      "school_short": "Wisconsin-Whitewater",
      "world": "stagg",
      "division": "D-III"
    },
    "52254": {
      "school_short": "Waynesburg",
      "world": "stagg",
      "division": "D-III"
    },
    "54670": {
      "school_short": "Cincinnati",
      "world": "hayes",
      "division": "D-IA"
    },
    "49590": {
      "school_short": "South Carolina",
      "world": "camp",
      "division": "D-IA"
    },
    "54717": {
      "school_short": "Southern Illinois-Carbondale",
      "world": "hayes",
      "division": "D-IAA"
    },
    "50852": {
      "school_short": "Youngstown State",
      "world": "wilkinson",
      "division": "D-IAA"
    },
    "49958": {
      "school_short": "Cincinnati",
      "world": "camp",
      "division": "D-IA"
    },
    "55343": {
      "school_short": "Pennsylvania",
      "world": "yost",
      "division": "D-IAA"
    },
    "54927": {
      "school_short": "King`s",
      "world": "hayes",
      "division": "D-III"
    },
    "51432": {
      "school_short": "Arkansas",
      "world": "leahy",
      "division": "D-IA"
    },
    "51147": {
      "school_short": "California Lutheran",
      "world": "wilkinson",
      "division": "D-III"
    },
    "51760": {
      "school_short": "Claremont McKenna-Harvey",
      "world": "leahy",
      "division": "D-III"
    },
    "53316": {
      "school_short": "Virginia Union",
      "world": "heisman",
      "division": "D-II"
    },
    "49631": {
      "school_short": "Florida International",
      "world": "camp",
      "division": "D-IAA"
    },
    "54758": {
      "school_short": "Saint Francis",
      "world": "hayes",
      "division": "D-IAA"
    },
    "50724": {
      "school_short": "Southwest Minnesota State",
      "world": "bryant",
      "division": "D-II"
    },
    "54233": {
      "school_short": "California (PA)",
      "world": "dobie",
      "division": "D-II"
    },
    "51724": {
      "school_short": "Nebraska Wesleyan",
      "world": "leahy",
      "division": "D-III"
    },
    "53232": {
      "school_short": "Westminster (MO)",
      "world": "warner",
      "division": "D-III"
    },
    "55215": {
      "school_short": "East Stroudsburg",
      "world": "yost",
      "division": "D-II"
    },
    "55439": {
      "school_short": "Missouri Western State",
      "world": "yost",
      "division": "D-II"
    },
    "50840": {
      "school_short": "Fresno State",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "49448": {
      "school_short": "Cal Poly",
      "world": "rockne",
      "division": "D-IAA"
    },
    "55068": {
      "school_short": "Westminster (MO)",
      "world": "hayes",
      "division": "D-III"
    },
    "49984": {
      "school_short": "Southern Methodist",
      "world": "camp",
      "division": "D-IA"
    },
    "50988": {
      "school_short": "North Carolina",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "50901": {
      "school_short": "Central Arkansas",
      "world": "wilkinson",
      "division": "D-II"
    },
    "55089": {
      "school_short": "Ohio State",
      "world": "yost",
      "division": "D-IA"
    },
    "49446": {
      "school_short": "California State",
      "world": "rockne",
      "division": "D-IAA"
    },
    "52496": {
      "school_short": "Western New Mexico",
      "world": "stagg",
      "division": "D-II"
    },
    "52747": {
      "school_short": "Winona State",
      "world": "warner",
      "division": "D-II"
    },
    "50989": {
      "school_short": "Virginia",
      "world": "wilkinson",
      "division": "D-IA"
    },
    "49339": {
      "school_short": "Rutgers",
      "world": "rockne",
      "division": "D-IA"
    },
    "51455": {
      "school_short": "UNLV",
      "world": "leahy",
      "division": "D-IA"
    },
    "52946": {
      "school_short": "Central Connecticut",
      "world": "warner",
      "division": "D-IAA"
    },
    "53358": {
      "school_short": "Minnesota-Crookston",
      "world": "heisman",
      "division": "D-II"
    },
    "53332": {
      "school_short": "Minnesota State-Mankato",
      "world": "heisman",
      "division": "D-II"
    },
    "49157": {
      "school_short": "Maryland",
      "world": "rockne",
      "division": "D-IA"
    },
    "49652": {
      "school_short": "Western Carolina",
      "world": "camp",
      "division": "D-IAA"
    },
    "52164": {
      "school_short": "Concordia",
      "world": "stagg",
      "division": "D-II"
    },
    "53318": {
      "school_short": "Fayetteville State",
      "world": "heisman",
      "division": "D-II"
    },
    "49268": {
      "school_short": "Christopher Newport",
      "world": "rockne",
      "division": "D-III"
    },
    "49220": {
      "school_short": "Montclair State",
      "world": "rockne",
      "division": "D-III"
    },
    "51931": {
      "school_short": "Humboldt State",
      "world": "leahy",
      "division": "D-II"
    },
    "52278": {
      "school_short": "MIT",
      "world": "stagg",
      "division": "D-III"
    },
    "52567": {
      "school_short": "Menlo",
      "world": "stagg",
      "division": "D-III"
    },
    "52977": {
      "school_short": "Hillsdale",
      "world": "warner",
      "division": "D-II"
    },
    "52794": {
      "school_short": "Kentucky State",
      "world": "warner",
      "division": "D-II"
    },
    "53218": {
      "school_short": "La Verne",
      "world": "warner",
      "division": "D-III"
    },
    "52717": {
      "school_short": "Indianapolis",
      "world": "warner",
      "division": "D-II"
    },
    "53211": {
      "school_short": "Millsaps",
      "world": "warner",
      "division": "D-III"
    },
    "51618": {
      "school_short": "Texas Tech",
      "world": "leahy",
      "division": "D-IA"
    },
    "52834": {
      "school_short": "Cincinnati",
      "world": "warner",
      "division": "D-IA"
    },
    "52790": {
      "school_short": "West Virginia Wesleyan",
      "world": "warner",
      "division": "D-II"
    },
    "52829": {
      "school_short": "Temple",
      "world": "warner",
      "division": "D-IA"
    },
    "52838": {
      "school_short": "Colorado State",
      "world": "warner",
      "division": "D-IA"
    },
    "52892": {
      "school_short": "California State",
      "world": "warner",
      "division": "D-IAA"
    },
    "52831": {
      "school_short": "Pittsburgh",
      "world": "warner",
      "division": "D-IA"
    },
    "51592": {
      "school_short": "Ithaca",
      "world": "leahy",
      "division": "D-III"
    },
    "52757": {
      "school_short": "Kutztown",
      "world": "warner",
      "division": "D-II"
    },
    "51749": {
      "school_short": "East Texas Baptist",
      "world": "leahy",
      "division": "D-III"
    },
    "53011": {
      "school_short": "Truman State",
      "world": "warner",
      "division": "D-II"
    },
    "52718": {
      "school_short": "Cheyney",
      "world": "warner",
      "division": "D-II"
    },
    "52696": {
      "school_short": "Southern-Baton Rouge",
      "world": "warner",
      "division": "D-IAA"
    },
    "52827": {
      "school_short": "Rutgers",
      "world": "warner",
      "division": "D-IA"
    },
    "51644": {
      "school_short": "Albion",
      "world": "leahy",
      "division": "D-III"
    },
    "52602": {
      "school_short": "Carleton",
      "world": "stagg",
      "division": "D-III"
    },
    "52663": {
      "school_short": "UNLV",
      "world": "warner",
      "division": "D-IA"
    },
    "53415": {
      "school_short": "Clemson",
      "world": "heisman",
      "division": "D-IA"
    },
    "53673": {
      "school_short": "Elmhurst",
      "world": "heisman",
      "division": "D-III"
    },
    "53443": {
      "school_short": "Pittsburgh",
      "world": "heisman",
      "division": "D-IA"
    },
    "53657": {
      "school_short": "Western Connecticut State",
      "world": "heisman",
      "division": "D-III"
    },
    "53478": {
      "school_short": "Ohio",
      "world": "heisman",
      "division": "D-IA"
    },
    "53397": {
      "school_short": "Lenoir-Rhyne",
      "world": "heisman",
      "division": "D-II"
    },
    "53494": {
      "school_short": "Arizona",
      "world": "heisman",
      "division": "D-IA"
    },
    "53797": {
      "school_short": "Baldwin-Wallace",
      "world": "heisman",
      "division": "D-III"
    },
    "53493": {
      "school_short": "Arizona State",
      "world": "heisman",
      "division": "D-IA"
    },
    "53496": {
      "school_short": "UCLA",
      "world": "heisman",
      "division": "D-IA"
    }
  };
  return a;
}