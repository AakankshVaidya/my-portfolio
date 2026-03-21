/* ==============================================================
   main.js — NBA Pair Impact Score Visualization
   ==============================================================
   TABLE OF CONTENTS:
   0. NBA TEAM COLORS
   1. GLOBAL STATE & CONSTANTS
   2. DATA LOADING & PARSING
   3. TEAM SELECTOR (arrows, dropdown)
   4. INFO PANEL (default PIS description + edge detail)
   5. NETWORK GRAPH (force-directed, nodes, edges)
   6. BAR CHART (PLUS_MINUS vertical bars)
   7. TEAM SWITCHING (transitions & animations)
   8. INITIALIZATION
   ============================================================== */


/* ==============================================================
   0. NBA TEAM COLORS
   Primary and secondary colors for all 30 NBA teams.
   ============================================================== */
const TEAM_COLORS = {
  ATL: { primary: '#c8102e', secondary: '#fdb927' },
  BKN: { primary: '#000000', secondary: '#ffffff' },
  BOS: { primary: '#007a33', secondary: '#ba9653' },
  CHA: { primary: '#1d1160', secondary: '#00788c' },
  CHI: { primary: '#ce1141', secondary: '#000000' },
  CLE: { primary: '#860038', secondary: '#fdbb30' },
  DAL: { primary: '#00538c', secondary: '#002b5e' },
  DEN: { primary: '#0e2240', secondary: '#fec524' },
  DET: { primary: '#c8102e', secondary: '#1d42ba' },
  GSW: { primary: '#1d428a', secondary: '#ffc72c' },
  HOU: { primary: '#ce1141', secondary: '#000000' },
  IND: { primary: '#002d62', secondary: '#fdbb30' },
  LAC: { primary: '#c8102e', secondary: '#1d428a' },
  LAL: { primary: '#552583', secondary: '#fdb927' },
  MEM: { primary: '#5d76a9', secondary: '#12173f' },
  MIA: { primary: '#98002e', secondary: '#f9a01b' },
  MIL: { primary: '#00471b', secondary: '#eee1c6' },
  MIN: { primary: '#0c2340', secondary: '#236192' },
  NOP: { primary: '#0c2340', secondary: '#c8102e' },
  NYK: { primary: '#006bb6', secondary: '#f58426' },
  OKC: { primary: '#007ac1', secondary: '#ef6136' },
  ORL: { primary: '#0077c0', secondary: '#000000' },
  PHI: { primary: '#006bb6', secondary: '#ed174c' },
  PHX: { primary: '#1d1160', secondary: '#e56020' },
  POR: { primary: '#e03a3e', secondary: '#000000' },
  SAC: { primary: '#5a2d81', secondary: '#63727a' },
  SAS: { primary: '#c4ced4', secondary: '#000000' },
  TOR: { primary: '#ce1141', secondary: '#000000' },
  UTA: { primary: '#002b5c', secondary: '#f9a01b' },
  WAS: { primary: '#002b5c', secondary: '#e31837' }
};


/* ==============================================================
   1. GLOBAL STATE & CONSTANTS
   ============================================================== */
const STATE = {
  currentTeamIndex: 0,
  teams: [],           // sorted list of team abbreviations
  edgesData: [],       // all backbone edges (parsed)
  nodesData: [],       // all backbone nodes (parsed)
  selectedEdge: null,  // currently clicked edge
  selectedNode: null   // currently clicked node
};

/* Force simulation reference (so we can stop it on team switch) */
let simulation = null;


/* ==============================================================
   2. DATA LOADING & PARSING
   ============================================================== */

/**
 * Load both CSV files and parse them.
 * Returns a Promise that resolves with { edges, nodes }.
 */
async function loadData() {
  const [edgesRaw, nodesRaw] = await Promise.all([
    d3.csv('nba_lineups_backbone.csv'),
    d3.csv('nba_lineups_backbone_nodes.csv')
  ]);

  /* Parse numeric fields on edges */
  const edges = edgesRaw.map(d => ({
    group_name: d.GROUP_NAME,
    player_1:   d.player_1,
    player_2:   d.player_2,
    team:       d.TEAM_ABBREVIATION,
    gp:   +d.GP,
    w:    +d.W,
    l:    +d.L,
    w_pct: +d.W_PCT,
    min:  +d.MIN,
    fgm:  +d.FGM,
    fga:  +d.FGA,
    fg_pct: +d.FG_PCT,
    fg3m: +d.FG3M,
    fg3a: +d.FG3A,
    fg3_pct: +d.FG3_PCT,
    ftm:  +d.FTM,
    fta:  +d.FTA,
    ft_pct: +d.FT_PCT,
    oreb: +d.OREB,
    dreb: +d.DREB,
    reb:  +d.REB,
    ast:  +d.AST,
    tov:  +d.TOV,
    stl:  +d.STL,
    blk:  +d.BLK,
    pf:   +d.PF,
    pts:  +d.PTS,
    plus_minus: +d.PLUS_MINUS,
    pis:  +d.PIS,
    edge_strength: +d.edge_strength
  }));

  /* Nodes are simple: team + player name */
  const nodes = nodesRaw.map(d => ({
    team:   d.TEAM_ABBREVIATION,
    player: d.player
  }));

  return { edges, nodes };
}

/**
 * Get edges for a specific team.
 */
function getTeamEdges(team) {
  return STATE.edgesData.filter(d => d.team === team);
}

/**
 * Get nodes for a specific team.
 */
function getTeamNodes(team) {
  return STATE.nodesData.filter(d => d.team === team);
}


/* ==============================================================
   3. TEAM SELECTOR (arrows, dropdown, cycling)
   ============================================================== */

/**
 * Build the dropdown list and wire up arrow buttons.
 */
function initTeamSelector() {
  const dropdown = d3.select('#team-dropdown');

  /* Populate dropdown items */
  STATE.teams.forEach((team, i) => {
    const colors = TEAM_COLORS[team] || { primary: '#333', secondary: '#999' };
    const item = dropdown.append('div')
      .attr('class', 'dropdown-item')
      .attr('data-team', team)
      .on('click', () => {
        STATE.currentTeamIndex = i;
        switchTeam();
        toggleDropdown(false);
      });

    item.append('span')
      .attr('class', 'dropdown-color-dot')
      .style('background', colors.primary);

    item.append('span').text(team);
  });

  /* Arrow buttons */
  d3.select('#team-prev').on('click', () => {
    STATE.currentTeamIndex =
      (STATE.currentTeamIndex - 1 + STATE.teams.length) % STATE.teams.length;
    switchTeam();
  });

  d3.select('#team-next').on('click', () => {
    STATE.currentTeamIndex =
      (STATE.currentTeamIndex + 1) % STATE.teams.length;
    switchTeam();
  });

  /* Toggle dropdown on abbreviation click */
  d3.select('#team-name-wrapper').on('click', (event) => {
    event.stopPropagation();
    const dd = document.getElementById('team-dropdown');
    toggleDropdown(dd.classList.contains('hidden'));
  });

  /* Close dropdown when clicking elsewhere */
  d3.select('body').on('click', () => toggleDropdown(false));
}

function toggleDropdown(show) {
  d3.select('#team-dropdown').classed('hidden', !show);
  d3.select('#team-name-wrapper').classed('open', show);
}

/**
 * Update the abbreviation display and dropdown active state.
 */
function updateTeamDisplay() {
  const team = STATE.teams[STATE.currentTeamIndex];
  const colors = TEAM_COLORS[team] || { primary: '#333', secondary: '#999' };

  /* Update CSS custom properties for the entire page */
  const root = document.documentElement;
  root.style.setProperty('--team-primary', colors.primary);
  root.style.setProperty('--team-secondary', colors.secondary);
  root.style.setProperty(
    '--team-bg-tint',
    hexToRgba(colors.primary, 0.07)
  );

  /* Update abbreviation text */
  d3.select('#team-abbr').text(team);

  /* Update dropdown active states */
  d3.selectAll('.dropdown-item')
    .classed('active', function() {
      return d3.select(this).attr('data-team') === team;
    });
}

/** Convert hex color to rgba string */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


/* ==============================================================
   4. INFO PANEL (default PIS description + edge detail)
   ============================================================== */

/**
 * Show the default PIS formula description.
 */
function showDefaultInfo() {
  STATE.selectedEdge = null;

  const html = `
    <div class="pis-description">
      <h2>Pair Impact Score</h2>
      <p>
        PIS is a custom per-minute metric that measures how effective
        a two-player lineup is when both players share the floor.
      </p>
      <div class="pis-formula">
        PIS = PLUS_MINUS/MIN<br>
        &nbsp;&nbsp;+ 0.50 × AST/MIN<br>
        &nbsp;&nbsp;+ 0.20 × REB/MIN<br>
        &nbsp;&nbsp;+ 0.20 × (STL+BLK)/MIN<br>
        &nbsp;&nbsp;− 0.35 × TOV/MIN<br>
        &nbsp;&nbsp;− 0.15 × PF/MIN
      </div>
      <p>
        Raw totals favor duos that simply play more minutes together.
        PIS normalizes per minute, then weights each stat so that:
      </p>
      <ul class="weight-list">
        <li><strong>±</strong> matters the most</li>
        <li><strong>AST</strong> rewards playmaking</li>
        <li><strong>REB, STL, BLK</strong> add credit for hustle</li>
        <li><strong>TOV, PF</strong> penalize costly mistakes</li>
      </ul>
      <p style="margin-top:14px;">
        <strong>Edge Strength</strong> balances quality with reliability:
      </p>
      <div class="pis-formula">
        edge_strength = PIS × log(MIN + 1)
      </div>
      <p>
        The log of shared minutes gently rewards duos with larger 
        sample sizes without letting high-minute pairs dominate. 
        Thicker, darker connections in the network indicate 
        stronger edges.
      </p>
      <p style="margin-top:12px; font-size:0.8rem; color:var(--text-muted);">
        Click any connection in the network to explore a duo's detailed stats.
      </p>
    </div>
  `;
  d3.select('#info-content').html(html);
}

/**
 * Show detailed stats for a clicked edge.
 */
function showEdgeDetail(edge) {
  STATE.selectedEdge = edge;

  const pm = edge.plus_minus;
  const pmClass = pm >= 0 ? 'positive' : 'negative';
  const pmSign  = pm >= 0 ? '+' : '';

  const html = `
    <div class="edge-detail">
      <h2>${edge.player_1} — ${edge.player_2}</h2>
      <div class="duo-subtitle">${edge.team} · ${edge.gp} games · ${edge.min.toFixed(0)} min together</div>

      <div class="stat-grid">
        <div class="stat-card full-width">
          <div class="stat-label">Pair Impact Score</div>
          <div class="stat-value">${edge.pis.toFixed(3)}</div>
        </div>

        <div class="stat-card full-width">
          <div class="stat-label">Plus / Minus</div>
          <div class="stat-value ${pmClass}">${pmSign}${pm}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">FGM</div>
          <div class="stat-value">${edge.fgm}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">FGA</div>
          <div class="stat-value">${edge.fga}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">FG%</div>
          <div class="stat-value">${(edge.fg_pct * 100).toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">MIN</div>
          <div class="stat-value">${edge.min.toFixed(0)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">PTS</div>
          <div class="stat-value">${edge.pts}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">AST</div>
          <div class="stat-value">${edge.ast}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">REB</div>
          <div class="stat-value">${edge.reb}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">TOV</div>
          <div class="stat-value">${edge.tov}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">STL</div>
          <div class="stat-value">${edge.stl}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">BLK</div>
          <div class="stat-value">${edge.blk}</div>
        </div>
      </div>
    </div>
  `;
  d3.select('#info-content').html(html);
}


/* ==============================================================
   5. NETWORK GRAPH (force-directed layout)
   ============================================================== */

/**
 * Draw (or re-draw) the force-directed network for the current team.
 * This is the largest section — it handles:
 *   - building the node/link data structures
 *   - creating a color scale for edge_strength
 *   - setting up the D3 force simulation
 *   - drawing SVG edges (lines) and nodes (circles + labels)
 *   - wiring up click interactions
 */
function drawNetwork() {
  const team  = STATE.teams[STATE.currentTeamIndex];
  const edges = getTeamEdges(team);
  const nodes = getTeamNodes(team);
  const svg   = d3.select('#network-svg');
  const colors = TEAM_COLORS[team] || { primary: '#333', secondary: '#999' };

  /* Clear previous contents */
  svg.selectAll('*').remove();

  /* Measure container (needed early for hint/legend) */
  const container = document.getElementById('network-panel');
  const width  = container.clientWidth;
  const height = container.clientHeight;

  /* --- Add interaction hint overlay (HTML, not SVG) --- */
  let hint = container.querySelector('.network-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'network-hint';
    hint.innerHTML = '<span>Click a connection or player to explore stats</span><button class="hint-dismiss" onclick="this.parentElement.remove()">✕</button>';
    container.appendChild(hint);
  }

  /* --- Add / update visual encodings legend (HTML overlay) --- */
  let legend = container.querySelector('.network-legend');
  if (!legend) {
    legend = document.createElement('div');
    legend.className = 'network-legend';
    legend.innerHTML = `
      <div class="legend-section">
        <div class="legend-title">Node Size</div>
        <div class="legend-node-row">
          <span class="legend-node-example" id="legend-node-sm"></span>
          <span class="legend-node-dash">—</span>
          <span class="legend-node-example" id="legend-node-lg"></span>
        </div>
        <div class="legend-sub">Fewer connections → More connections</div>
      </div>
      <div class="legend-section">
        <div class="legend-title">Edge Strength</div>
        <div class="legend-bar" id="legend-bar"></div>
        <div class="legend-labels">
          <span id="legend-min"></span>
          <span id="legend-max"></span>
        </div>
        <div class="legend-sub">Color intensity + thickness</div>
      </div>
    `;
    container.appendChild(legend);
  }
  /* Update legend colors for current team */
  const legendBar = legend.querySelector('#legend-bar');
  legendBar.style.background = `linear-gradient(to right, ${hexToRgba(colors.primary, 0.12)}, ${colors.primary})`;
  const esExtent = d3.extent(edges, d => d.edge_strength);
  legend.querySelector('#legend-min').textContent = esExtent[0].toFixed(1);
  legend.querySelector('#legend-max').textContent = esExtent[1].toFixed(1);
  const smNode = legend.querySelector('#legend-node-sm');
  const lgNode = legend.querySelector('#legend-node-lg');
  if (smNode) smNode.style.background = colors.primary;
  if (lgNode) lgNode.style.background = colors.primary;

  svg.attr('viewBox', `0 0 ${width} ${height}`);

  /* --- Build node map for force layout --- */
  const nodeMap = new Map();
  nodes.forEach(n => {
    nodeMap.set(n.player, { id: n.player, ...n });
  });

  const forceNodes = Array.from(nodeMap.values());

  /* --- Build link array referencing node objects --- */
  const forceLinks = edges.map(e => ({
    source: e.player_1,
    target: e.player_2,
    data: e
  }));

  /* --- Color scale for edge_strength (very light gray → full team color) --- */
  const strengthExtent = d3.extent(edges, d => d.edge_strength);
  const edgeColorScale = d3.scaleLinear()
    .domain(strengthExtent)
    .range([hexToRgba(colors.primary, 0.12), colors.primary]);

  /* --- Edge width scale (more noticeable variation) --- */
  const edgeWidthScale = d3.scaleLinear()
    .domain(strengthExtent)
    .range([1, 4.5]);

  /* --- Node degree for sizing --- */
  const degreeMap = new Map();
  forceNodes.forEach(n => degreeMap.set(n.id, 0));
  forceLinks.forEach(l => {
    degreeMap.set(l.source, (degreeMap.get(l.source) || 0) + 1);
    degreeMap.set(l.target, (degreeMap.get(l.target) || 0) + 1);
  });
  const maxDegree = d3.max(Array.from(degreeMap.values()));
  const nodeRadius = d3.scaleLinear()
    .domain([1, maxDegree])
    .range([8, 18]);

  /* --- Force Simulation --- */
  if (simulation) simulation.stop();

  simulation = d3.forceSimulation(forceNodes)
    .force('link', d3.forceLink(forceLinks).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => nodeRadius(degreeMap.get(d.id)) + 10))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05));

  /* --- Draw Edges --- */
  const edgeGroup = svg.append('g').attr('class', 'edges-group');

  const edgeElements = edgeGroup.selectAll('.edge-line')
    .data(forceLinks)
    .enter()
    .append('line')
    .attr('class', 'edge-line')
    .attr('stroke', d => edgeColorScale(d.data.edge_strength))
    .attr('stroke-width', d => edgeWidthScale(d.data.edge_strength))
    .attr('opacity', 0)
    .on('click', function(event, d) {
      event.stopPropagation();
      onEdgeClick(d, edgeElements, nodeCircles, nodeLabels);
    });

  /* Animate edges in */
  edgeElements.transition()
    .duration(600)
    .delay((d, i) => i * 40)
    .attr('opacity', 1);

  /* --- Draw Nodes --- */
  const nodeGroup = svg.append('g').attr('class', 'nodes-group');

  const nodeGroups = nodeGroup.selectAll('.node-g')
    .data(forceNodes)
    .enter()
    .append('g')
    .attr('class', 'node-g')
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
    );

  const nodeCircles = nodeGroups.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 0)
    .attr('fill', colors.primary)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('click', function(event, d) {
      event.stopPropagation();
      onNodeClick(d, edgeElements, nodeCircles, nodeLabels);
    });

  /* Animate nodes in */
  nodeCircles.transition()
    .duration(500)
    .delay((d, i) => 200 + i * 50)
    .attr('r', d => nodeRadius(degreeMap.get(d.id)));

  const nodeLabels = nodeGroups.append('text')
    .attr('class', 'node-label')
    .attr('dy', d => nodeRadius(degreeMap.get(d.id)) + 14)
    .text(d => d.id)
    .attr('opacity', 0);

  nodeLabels.transition()
    .duration(400)
    .delay((d, i) => 400 + i * 50)
    .attr('opacity', 1);

  /* --- Tick function: update positions each frame --- */
  simulation.on('tick', () => {
    /* Keep nodes within bounds */
    forceNodes.forEach(d => {
      const r = nodeRadius(degreeMap.get(d.id));
      d.x = Math.max(r + 5, Math.min(width - r - 5, d.x));
      d.y = Math.max(r + 5, Math.min(height - r - 5, d.y));
    });

    edgeElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  /* --- Click background to reset --- */
  svg.on('click', () => {
    clearHighlights(edgeElements, nodeCircles, nodeLabels);
    showDefaultInfo();
  });
}

/* --- Drag handlers for nodes --- */
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

/* --- Edge click: highlight edge, show detail --- */
function onEdgeClick(linkData, edgeElements, nodeCircles, nodeLabels) {
  /* Dim everything */
  edgeElements.classed('dimmed', true).classed('highlighted', false);
  nodeCircles.classed('dimmed', true);
  nodeLabels.classed('dimmed', true);

  /* Highlight clicked edge */
  edgeElements.filter(d => d === linkData)
    .classed('dimmed', false)
    .classed('highlighted', true);

  /* Highlight the two connected nodes */
  const connectedIds = new Set([
    linkData.source.id || linkData.source,
    linkData.target.id || linkData.target
  ]);

  nodeCircles.classed('dimmed', d => !connectedIds.has(d.id));
  nodeLabels.classed('dimmed', d => !connectedIds.has(d.id));

  /* Also highlight corresponding bar */
  highlightBar(linkData.data);

  /* Show detail in info panel */
  showEdgeDetail(linkData.data);
}

/* --- Node click: highlight all edges connected to this node --- */
function onNodeClick(nodeData, edgeElements, nodeCircles, nodeLabels) {
  STATE.selectedNode = nodeData;

  /* Find all edges connected to this node */
  const connectedNodes = new Set([nodeData.id]);
  edgeElements.each(function(d) {
    const srcId = d.source.id || d.source;
    const tgtId = d.target.id || d.target;
    if (srcId === nodeData.id) connectedNodes.add(tgtId);
    if (tgtId === nodeData.id) connectedNodes.add(srcId);
  });

  /* Dim everything, then un-dim connected */
  edgeElements
    .classed('dimmed', d => {
      const srcId = d.source.id || d.source;
      const tgtId = d.target.id || d.target;
      return srcId !== nodeData.id && tgtId !== nodeData.id;
    })
    .classed('highlighted', d => {
      const srcId = d.source.id || d.source;
      const tgtId = d.target.id || d.target;
      return srcId === nodeData.id || tgtId === nodeData.id;
    });

  nodeCircles.classed('dimmed', d => !connectedNodes.has(d.id));
  nodeLabels.classed('dimmed', d => !connectedNodes.has(d.id));

  /* Highlight bars for connected duos */
  highlightBarsForPlayer(nodeData.id);

  /* Show default info (or we could show a player summary) */
  showDefaultInfo();
}

/* --- Clear all highlights --- */
function clearHighlights(edgeElements, nodeCircles, nodeLabels) {
  edgeElements.classed('dimmed', false).classed('highlighted', false);
  nodeCircles.classed('dimmed', false);
  nodeLabels.classed('dimmed', false);
  clearBarHighlights();
  STATE.selectedNode = null;
}


/* ==============================================================
   6. BAR CHART (PLUS_MINUS, horizontal bars, left column)
   ============================================================== */

/**
 * Draw horizontal bar chart in the left panel.
 * Labels are stacked (player 1 bold, player 2 muted below).
 * More left padding for breathing room from screen edge.
 */
function drawBarChart() {
  const team  = STATE.teams[STATE.currentTeamIndex];
  const edges = getTeamEdges(team)
    .slice()
    .sort((a, b) => b.plus_minus - a.plus_minus);
  const colors = TEAM_COLORS[team] || { primary: '#333', secondary: '#999' };
  const svg   = d3.select('#bar-svg');

  /* Clear previous */
  svg.selectAll('*').remove();

  /* Measure container */
  const scrollArea = document.getElementById('bar-scroll-area');
  const totalW = scrollArea.clientWidth;

  /* More left margin = more breathing room from screen edge */
  const margin = { top: 24, right: 34, bottom: 12, left: 92 };
  const barRowHeight = 42;
  const totalH = margin.top + margin.bottom + edges.length * barRowHeight;
  const chartW = totalW - margin.left - margin.right;
  const chartH = totalH - margin.top - margin.bottom;

  svg.attr('width', totalW)
     .attr('height', totalH)
     .attr('viewBox', `0 0 ${totalW} ${totalH}`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  /* --- Scales --- */
  const pmExtent = d3.extent(edges, d => d.plus_minus);
  const xMin = Math.min(0, pmExtent[0]) - 10;
  const xMax = Math.max(0, pmExtent[1]) + 20;

  const xScale = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, chartW]);

  const yScale = d3.scaleBand()
    .domain(edges.map((d, i) => i))
    .range([0, chartH])
    .padding(0.22);

  /* --- Zero line --- */
  g.append('line')
    .attr('class', 'bar-zero-line')
    .attr('x1', xScale(0))
    .attr('x2', xScale(0))
    .attr('y1', 0)
    .attr('y2', chartH);

  /* --- X Axis (top) --- */
  g.append('g')
    .attr('class', 'bar-axis')
    .call(d3.axisTop(xScale).ticks(3).tickSize(-chartH).tickFormat(d => d > 0 ? `+${d}` : d))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke-dasharray', '2,3').attr('opacity', 0.15));

  /* --- Bars --- */
  const bars = g.selectAll('.bar-rect')
    .data(edges)
    .enter()
    .append('rect')
    .attr('class', 'bar-rect')
    .attr('data-duo', d => `${d.player_1}-${d.player_2}`)
    .attr('y', (d, i) => yScale(i))
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => d.plus_minus >= 0 ? colors.primary : hexToRgba(colors.primary, 0.35))
    .attr('x', xScale(0))
    .attr('width', 0)
    .on('click', function(event, d) {
      event.stopPropagation();
      onBarClick(d);
    });

  bars.transition()
    .duration(600)
    .delay((d, i) => i * 25)
    .attr('x', d => d.plus_minus >= 0 ? xScale(0) : xScale(d.plus_minus))
    .attr('width', d => Math.abs(xScale(d.plus_minus) - xScale(0)));

  /* --- Value labels --- */
  g.selectAll('.bar-value-label')
    .data(edges)
    .enter()
    .append('text')
    .attr('class', 'bar-value-label')
    .attr('y', (d, i) => yScale(i) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('x', d => d.plus_minus >= 0
      ? xScale(d.plus_minus) + 5
      : xScale(d.plus_minus) - 5)
    .attr('text-anchor', d => d.plus_minus >= 0 ? 'start' : 'end')
    .text(d => (d.plus_minus >= 0 ? '+' : '') + d.plus_minus)
    .attr('opacity', 0)
    .transition()
    .duration(400)
    .delay((d, i) => 200 + i * 25)
    .attr('opacity', 1);

  /* --- Stacked labels (player 1 bold on top, player 2 muted below) --- */
  edges.forEach((d, i) => {
    const yCenter = yScale(i) + yScale.bandwidth() / 2;

    g.append('text')
      .attr('class', 'bar-label-p1')
      .attr('text-anchor', 'end')
      .attr('x', -10)
      .attr('y', yCenter - 5)
      .text(d.player_1);

    g.append('text')
      .attr('class', 'bar-label-p2')
      .attr('text-anchor', 'end')
      .attr('x', -10)
      .attr('y', yCenter + 7)
      .text(d.player_2);
  });
}

/* --- Highlight a single bar (from edge click) --- */
function highlightBar(edgeData) {
  d3.selectAll('.bar-rect')
    .classed('dimmed', true);

  d3.selectAll('.bar-rect')
    .filter(d => d.player_1 === edgeData.player_1 && d.player_2 === edgeData.player_2)
    .classed('dimmed', false);
}

/* --- Highlight bars for all duos involving a player (from node click) --- */
function highlightBarsForPlayer(playerName) {
  d3.selectAll('.bar-rect')
    .classed('dimmed', d => d.player_1 !== playerName && d.player_2 !== playerName);
}

/* --- Clear bar highlights --- */
function clearBarHighlights() {
  d3.selectAll('.bar-rect').classed('dimmed', false);
}

/* --- Bar click: show edge detail for that duo --- */
function onBarClick(edgeData) {
  showEdgeDetail(edgeData);
  /* Also highlight corresponding edge in the network */
  d3.selectAll('.edge-line')
    .classed('dimmed', true)
    .classed('highlighted', false);

  d3.selectAll('.edge-line')
    .filter(d =>
      d.data.player_1 === edgeData.player_1 &&
      d.data.player_2 === edgeData.player_2
    )
    .classed('dimmed', false)
    .classed('highlighted', true);

  /* Dim nodes not in this duo */
  const connectedIds = new Set([edgeData.player_1, edgeData.player_2]);
  d3.selectAll('.node-circle').classed('dimmed', d => !connectedIds.has(d.id));
  d3.selectAll('.node-label').classed('dimmed', d => !connectedIds.has(d.id));

  /* Highlight bar */
  highlightBar(edgeData);
}


/* ==============================================================
   7. TEAM SWITCHING (transitions & animations)
   ============================================================== */

/**
 * Called whenever the team changes. Updates everything.
 */
function switchTeam() {
  /* Reset selection state */
  STATE.selectedEdge = null;
  STATE.selectedNode = null;

  /* Update header display + CSS variables */
  updateTeamDisplay();

  /* Re-render both visualizations */
  drawNetwork();
  drawBarChart();

  /* Reset info panel to default */
  showDefaultInfo();
}


/* ==============================================================
   8. INITIALIZATION
   ============================================================== */

(async function init() {
  /* Load data */
  const { edges, nodes } = await loadData();
  STATE.edgesData = edges;
  STATE.nodesData = nodes;

  /* Build sorted team list */
  STATE.teams = [...new Set(edges.map(d => d.team))].sort();
  STATE.currentTeamIndex = 0; // ATL first alphabetically

  /* Initialize UI components */
  initTeamSelector();
  updateTeamDisplay();
  showDefaultInfo();

  /* Draw initial visualizations */
  drawNetwork();
  drawBarChart();

  /* Re-draw on window resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawNetwork();
      drawBarChart();
    }, 250);
  });
})();
