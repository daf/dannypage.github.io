var results, winsChart, goalsADataPoints, goalsBDataPoints, diffDataPoints, n, goalBars;
var red = "#d7191c"
var blue = "#2c7bb6"
var draw = "#cfcf6f"
var seededChance;

var encode, compressed, decompressed, variables;

defaults = {
  'teamAShots': "0.05,0.05,0.05,0.05,0.20,0.20,0.2,0.2,0.2",
  'teamBShots': "0.4,0.4,0.4",
  'name': "John Smith FC",
  'chances': "0.05,0.05,0.05,0.05,0.20,0.20,0.2,0.2,0.2",
  'goals': "2"
}

var share = getQueryVariable('share');
if (share.length > 0) {
  decompressed = LZString.decompressFromEncodedURIComponent(share);
  variables = decompressed.split(/\|/);
  if (page_type == "season" && variables.length == 3) {
    document.getElementById('name').value = variables[0];
    document.getElementById('chances').value = variables[1];
    document.getElementById('goals').value = variables[2];
  } else if (page_type == "match" && variables.length == 2) {
    document.getElementById('teamAShots').value = variables[0];
    document.getElementById('teamBShots').value = variables[1];
  } else {
    console.log("Share link failed.")
    for (value in defaults) { getURLValue(value, defaults[value]) }
  }
} else {
  for (value in defaults) { getURLValue(value, defaults[value]) }
}


function getURLValue(elementID, defaultValue) {
  if ( !!(document.getElementById(elementID)) ) {
    var urlValue = getQueryVariable(elementID);
    if (urlValue.length > 0 ) {
      document.getElementById(elementID).value = urlValue;
    } else {
      document.getElementById(elementID).value = defaultValue;
    }
  }
}

function simulateExpectedGoals() {
  seededChance = new Chance(12345);
  var teamAShots = document.getElementById('teamAShots');
  var teamBShots = document.getElementById('teamBShots');
  var teamAArray = stringToArray(teamAShots.value);
  var teamBArray = stringToArray(teamBShots.value);
  var sims = 10000;

  results = simulateGames(sims, teamAArray, teamBArray)

  teamASD = standardDeviation(results.AScores);
  document.getElementById('teamASD').innerHTML = Math.round(teamASD * 100) / 100
  teamBSD = standardDeviation(results.BScores);
  document.getElementById('teamBSD').innerHTML = Math.round(teamBSD * 100) / 100
  teamAAVG = average(results.AScores);
  document.getElementById('teamAAVG').innerHTML = Math.round(teamAAVG * 100) / 100
  teamBAVG = average(results.BScores);
  document.getElementById('teamBAVG').innerHTML = Math.round(teamBAVG * 100) / 100
  teamAPPG = Math.round(100*(results.A*3+results.T)/sims)/100
  teamBPPG = Math.round(100*(results.B*3+results.T)/sims)/100
  teamAWin = Math.round(100*(results.A/sims))
  document.getElementById('teamAWin').innerHTML = teamAWin;
  teamBWin = Math.round(100*(results.B/sims))
  document.getElementById('teamBWin').innerHTML = teamBWin;
  document.getElementById('teamBAVG').innerHTML = Math.round(teamBAVG * 100) / 100
  document.getElementById('teamAShotCount').innerHTML = teamAArray.length
  document.getElementById('teamBShotCount').innerHTML = teamBArray.length


  var ppgChart = new CanvasJS.Chart("ppgChart", {
		title:{
			text: "Points Per Game"
		},
    animationEnabled: true,
		data: [
		{
			type: "doughnut",
			startAngle: 90,
			toolTipContent: "{legendText}: <strong>{y}</strong>",
			showInLegend: false,
			dataPoints: [
				{y: teamAPPG, indexLabel: "{y} ppg", legendText: "Team A", color: red },
				{y: teamBPPG, indexLabel: "{y} ppg", legendText: "Team B", color: blue }
      ]
		}
		]
	});
	ppgChart.render();
  winsChart = new CanvasJS.Chart("winsChart",{
    title:{
      text: "Results (10000 Sims)"
    },
    animationEnabled: true,
    data: [
      {
        type: "column",
        toolTipContent: "{label}: <strong>{y}</strong>",
  			showInLegend: false,
        dataPoints: [
          {y: results.A, label: "Team A Wins", color: red},
          {y: results.T, label: "Draws", color: draw},
          {y: results.B, label: "Team B Wins", color: blue}
        ]
      }
    ]
  });
  winsChart.render();

  goalsADataPoints = [];
  goalsBDataPoints = [];
  for (var i = 0; i < results.AGoals.length; i++){
    if (results.AGoals[i] > 0) {
      goalsADataPoints.push({y: results.AGoals[i], label: i });
    } else {
      goalsADataPoints.push({y: 0, label: i });
    }
  }
  for (var i = 0; i < results.BGoals.length; i++){
    if (results.BGoals[i] > 0) {
      goalsBDataPoints.push({y: results.BGoals[i], label: i });
    } else {
      goalsBDataPoints.push({y: 0, label: i });
    }
  }
  goalsChart = new CanvasJS.Chart("goalsChart",{
    title:{
      text: "Games With # of Goals"
    },
    toolTip: {
      shared: true
    },
    legend:{
      cursor:"pointer",
      itemclick: function(e){
        if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        	e.dataSeries.visible = false;
        }
        else {
          e.dataSeries.visible = true;
        }
      	goalsChart.render();
      }
    },
    animationEnabled: true,
    data: [
      {
        type: "column",
        name: "Team A",
        legendText: "Team A",
  			showInLegend: true,
        color: red,
        dataPoints: goalsADataPoints
      },
      {
        type: "column",
        name: "Team B",
        legendText: "Team B",
  			showInLegend: true,
        color: blue,
        dataPoints: goalsBDataPoints
      }
    ]
  });
  goalsChart.render();

  diffDataPoints = [];
  n = [];
  for (var i in results.diffGoals) { n.push(Number(i) ); }
  var diffMax = Math.max.apply(Math, n);
  var diffMin = Math.min.apply(Math, n);
  for (var key = diffMin; key <= diffMax; key++) {
    if (key == 0) {
      diffDataPoints.push({y: results.diffGoals[key], label: String(key), color: draw})
    } else if (key < 0) {
      diffDataPoints.push({y: results.diffGoals[key], label: String(key), color: red})
    } else if (key > 0) {
      diffDataPoints.push({y: results.diffGoals[key], label: String(key), color: blue})
    }
  }
  diffChart = new CanvasJS.Chart("diffChart",{
    title:{
      text: "Goal Difference"
    },
    animationEnabled: true,
    data: [
      {
        type: "column",
        toolTipContent: "{label}: <strong>{y}</strong>",
  			showInLegend: false,
        dataPoints: diffDataPoints
      }
    ]
  });
  diffChart.render();

  var shareURL = getShareURL();
  document.getElementById("shareURLlink").href = shareURL;
}

function simulateLongTermExpectedGoals(){
  seededChance = new Chance(12345);
  var entity = document.getElementById('name').value;
  var chances = document.getElementById('chances').value;
  var goals = document.getElementById('goals').value;
  var chancesArray = stringToArray(chances);
  var sims = 10000;

  results = simulateSeasons(sims, chancesArray, goals);
  document.getElementById('averageGoals').innerHTML = Math.round(results.average * 100) / 100;
  document.getElementById('stdDevGoals').innerHTML = Math.round(results.stdDev * 100) / 100;
  over = results.bin.over / sims;
  exact = results.bin.exact / sims;
  under = results.bin.under / sims;
  document.getElementById('under').innerHTML = Math.round(under*100);
  document.getElementById('exact').innerHTML = Math.round(exact*100);
  document.getElementById('over').innerHTML = Math.round(over*100);
  distance = Math.round(100*(goals - results.average)/results.stdDev)/100;
  var explanation = {
    'reality': entity + " scored " + goals + " goals. ",
    'expectation': "Simulations indicate that you would expect them to score around " + Math.round(results.average) + " goals, give or take " + Math.round(results.stdDev) + ". ",
    'bins': "<br>" + goals + " goals " + " is exactly correct in " + Math.round(exact*100) + "% of the simulations, while it's a sign of underperforming in " + Math.round(under*100) + "% of the sims and a sign of overperforming in " + Math.round(over*100) + "% of the sims.",
    'test': "<br>" + entity + " was " + distance + " standard deviations from the expected mean."
  };
  document.getElementById('explanation').innerHTML = explanation.reality + explanation.expectation + explanation.bins + explanation.test;

  goalBars = {
    x: [],
    y: [],
    text: [],
    colors: []
  }
  for (var i = 0; i < results.goals.length; i++){
    if(typeof results.goals[i] === 'undefined') {
      goalBars.y.push(0);
    } else {
      goalBars.y.push(results.goals[i]/100);
    }
    goalBars.x.push(i);
    goalBars.colors.push('rgb(158,202,240)');
    goalBars.text.push(Math.round(100*(i - results.average)/results.stdDev)/100 + ' SDs from Mean');
  }
  goalBars.colors[goals] = 'rgb(116,196,118)';
  var data = [
    {
      x: goalBars.x,
      y: goalBars.y,
      type: 'bar',
      text: goalBars.text,
      name: 'Percentage',
      marker: {
        color: goalBars.colors
      }
    }
  ];
  var layout = {
    title: 'Simulation Outcomes for ' + entity,
    margin: {
      l: 80,
      r: 80,
      t: 80,
      b: 80
    },
    font: {
        size: 16
    },
    yaxis: {
      ticksuffix:"%"
    },
    xaxis: {
      title: "Goals"
    }
  };
  Plotly.newPlot('goalsChart', data, layout);

  var shareURL = getLTShareURL();
  document.getElementById("shareURLlink").href = shareURL;
}

function simulateSeasons(sims, chancesArray, actualGoals) {
  var results = {
    "goals":[], "results":[], "stdDev": 0, "average": 0,
    "bin": {
      "under":0,
      "over":0,
      "exact":0
    }
  };

  for (var i = 0; i < sims; i++) {
    value = simulateShots(chancesArray);
    results.results.push(value);
    if(typeof results.goals[value] === 'undefined') {
      results.goals[value] = 1;
    } else {
      results.goals[value]++;
    }
    if (actualGoals < value) {
      results.bin.under++;
    } else if (actualGoals > value) {
      results.bin.over++;
    } else {
      results.bin.exact++;
    }

  }
  results.stdDev = standardDeviation(results.results);
  results.average = average(results.results);
  return results;
}

function simulateGames(sims, teamAArray, teamBArray) {
  var results = {
    "A":0, "T":0, "B":0,
    "AScores":[], "BScores":[],
    "AGoals":[], "BGoals":[],
    "diffGoals":{}, "scorelines":[]
  };
  var scoreA, scoreB;
  for (var i = 0; i < sims; i++) {
    scoreA = simulateShots(teamAArray);
    scoreB = simulateShots(teamBArray);
    results.AScores.push(scoreA);
    results.BScores.push(scoreB);
    if(typeof results.AGoals[scoreA] === 'undefined') {
      results.AGoals[scoreA] = 1;
    } else {
      results.AGoals[scoreA]++;
    }
    if(typeof results.BGoals[scoreB] === 'undefined') {
      results.BGoals[scoreB] = 1;
    } else {
      results.BGoals[scoreB]++;
    }
    scoreline = scoreA + "-" + scoreB;
    if(typeof results.scorelines[scoreline] === 'undefined') {
      results.scorelines[scoreline] = {"A": scoreA, "B": scoreB, "C": 1};
    } else {
      results.scorelines[scoreline].C++;
    }

    if (scoreA > scoreB) {
      results.A++;
    } else if (scoreB > scoreA) {
      results.B++;
    } else {
      results.T++;
    }

    var diff = scoreB - scoreA;
    if(typeof results.diffGoals[diff] === 'undefined') {
      results.diffGoals[diff] = 1;
    } else {
      results.diffGoals[diff]++;
    }

  }
  return results;
}

function stringToArray(string) {
  trimmed = string.replace(" ","");
  array = trimmed.split(/[ ,]+/).map(Number);
  return array;
}
function simulateShots(shotsArray) {
  var score = 0;
  for (var i = 0; i < shotsArray.length; i++) {
    if (seededChance.bool({likelihood: shotsArray[i]*100}) ) {
      score++;
    }
  }
  return score;
}
//http://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
function standardDeviation(values){
  var avg = average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

function average(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return '';
}

function getShareURL() {
  var origin = document.location['origin'];
  var pathname = document.location['pathname'];
  var teamAShots = document.getElementById('teamAShots').value;
  var teamBShots = document.getElementById('teamBShots').value;

  encode = teamAShots.replace(/\|/g,'') + '|' + teamBShots.replace(/ /g,'');
  compressed = LZString.compressToEncodedURIComponent(encode);

  var share = "?share=" + compressed;
  return origin + pathname + share;
}

function getLTShareURL() {
  var origin = document.location['origin'];
  var pathname = document.location['pathname'];
  var name = document.getElementById('name').value;
  var chances = document.getElementById('chances').value;
  var goals = document.getElementById('goals').value;

  encode = name.replace(/\|/g,'') + '|' + chances.replace(/ /g,'') + '|' + goals.replace(/ /g,'');
  compressed = LZString.compressToEncodedURIComponent(encode);

  var share = "?share=" + compressed;

  return origin + pathname + share;
}
