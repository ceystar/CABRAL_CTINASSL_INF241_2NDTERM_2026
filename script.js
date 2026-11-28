/* ---------- Configuration ---------- */
const API_URL = "http://localhost:5000/api/reports";

/* ---------- Authentication Check ---------- */
function load(k, fallback) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    toast("Storage is full.");
  }
}

let user = load("esumbong_user", null);

if (!user || !user.name) {
  window.location.href = "index.html";
}

const $ = s => document.querySelector(s);

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#39;"
}[c]));

/* ---------- Data ---------- */
const DISTRICTS = {
  "Tondo, Manila":[14.6179,120.9667],
  "Ermita, Manila":[14.5833,120.9833],
  "Intramuros, Manila":[14.5896,120.9747],
  "Sampaloc, Manila":[14.6130,120.9936],
  "Binondo, Manila":[14.6000,120.9740],
  "Malate, Manila":[14.5720,120.9930],
  "Paco, Manila":[14.5810,121.0000],
  "Sta. Cruz, Manila":[14.6150,120.9830],
  "Quiapo, Manila":[14.5990,120.9830],
  "Pandacan, Manila":[14.5850,121.0090],
  "Sta. Ana, Manila":[14.5780,121.0140],
  "San Andres, Manila":[14.5680,121.0000]
};

let reports = [];
let draft = load("esumbong_draft", null);
let attachment = null, map = null, markers = [];

/* ---------- Navigation ---------- */
function go(view) {
  ["home","announcements","report","map"].forEach(v =>
    $("#view-" + v).classList.toggle("hidden", v !== view)
  );

  document.querySelectorAll(".nav a").forEach(b => {
    const on = b.dataset.go === view;
    b.classList.toggle("active", on);
    on ? b.setAttribute("aria-current", "page")
       : b.removeAttribute("aria-current");
  });

  $("#menu").classList.add("hidden");
  window.scrollTo({top:0, behavior:"smooth"});

  if (view === "map")
    setTimeout(() => initMap("main", "map"), 50);

  if (view === "report")
    setTimeout(initPicker, 50);

  if (view === "home") {
    renderReports();
    setTimeout(() => initMap("home", "homeMap"), 50);
  }
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-go]");

  if (t) {
    e.preventDefault();
    go(t.dataset.go);
  }

  if (!e.target.closest("#menu") && !e.target.closest("#avatarBtn"))
    $("#menu").classList.add("hidden");
});

/* ---------- User Display & Logout ---------- */
$("#who").textContent = user.name;

$("#logoutBtn").onclick = () => {
  localStorage.removeItem("esumbong_user");
  window.location.href = "index.html";
};

$("#avatarBtn").onclick = e => {
  e.stopPropagation();
  $("#menu").classList.toggle("hidden");
};

/* ---------- Modals & Toast ---------- */
function modal(html) {
  $("#modalRoot").innerHTML = `
    <div class="overlay" role="dialog" aria-modal="true">
      <div class="modal">
        ${html}
        <button class="btn small" id="closeModal">Close</button>
      </div>
    </div>`;

  const close = () => $("#modalRoot").innerHTML = "";

  $("#closeModal").onclick = close;

  $(".overlay").addEventListener("click", e => {
    if (e.target.classList.contains("overlay")) close();
  });
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

$("#contactsBtn").onclick = () => modal(`
  <h2>Contacts</h2>
  <ul>
    <li><b>Emergency:</b> 911</li>
    <li><b>Manila Disaster Risk Reduction (MDRRMO):</b> (02) 8527-0000</li>
    <li><b>Public Works Hotline:</b> (02) 8527-1111</li>
    <li><b>E-Sumbong Support:</b> support@esumbong.example</li>
  </ul>
  <p style="font-size:12px;color:#666">
    Sample numbers for the mockup — replace with real ones.
  </p>
`);

/* ---------- Reports List ---------- */
function fmt(d) {
  return new Date(d).toLocaleString("en-US", {
    month:"short",
    day:"numeric",
    year:"numeric",
    hour:"numeric",
    minute:"2-digit"
  });
}

let showAll = false, filter = "All";

function renderStats() {
  const c = s => reports.filter(r => r.status === s).length;

  $("#stTotal").textContent = reports.length;
  $("#stPending").textContent = c("Pending");
  $("#stReviewing").textContent = c("Reviewing");
  $("#stResolved").textContent = c("Resolved");
}

function renderReports() {
  renderStats();

  const q = $("#search").value.trim().toLowerCase();

  let list = reports.filter(r =>
    (filter === "All" || r.status === filter) &&
    (!q || [r.ref,r.id,r.category,r.location,r.text]
      .join(" ").toLowerCase().includes(q))
  );

  const total = list.length;
  const limited = !q && filter === "All";

  if (!showAll && limited) list = list.slice(0, 4);

  $("#viewAll").textContent = showAll ? "Show less" : "View all";
  $("#viewAll").classList.toggle(
    "hidden",
    !limited || reports.length <= 4
  );

  $("#reportList").innerHTML = total === 0
    ? `<p class="empty">No reports match. Try a different search or filter.</p>`
    : list.map(r => `
      <article class="card">
        <div class="card-img">
          ${r.img
            ? `<img src="${r.img}" alt="Attached photo for report ${esc(r.id)}">`
            : `<div class="noimg">No photo attached</div>`
          }
        </div>

        <div class="card-body">
          <div class="card-top">
            <span class="badge ${esc(r.status)}">${esc(r.status)}</span>
            <span>${fmt(r.date)}</span>
          </div>

          <h3>${esc(r.category)}</h3>
          <p class="loc">${esc(r.location)}</p>
          <p class="txt">${esc(r.text)}</p>

          <div class="by">
            <div class="av">${esc((r.name || "U")[0])}</div>
            <span>${esc(r.name)} ${esc(r.handle)}</span>
          </div>

          <div class="actions">
            <label>
              Status:
              <select data-status="${esc(r.ref)}">
                ${["Pending","Reviewing","Resolved"].map(s =>
                  `<option ${s === r.status ? "selected" : ""}>${s}</option>`
                ).join("")}
              </select>
            </label>

            <button class="btn ghost-dark small"
              data-delete="${esc(r.ref)}">Delete</button>
          </div>

          <div class="ref">Reference code: ${esc(r.ref)}</div>
        </div>
      </article>
    `).join("");
}

$("#chips").addEventListener("click", e => {
  const f = e.target.dataset.filter;
  if (!f) return;

  filter = f;

  document.querySelectorAll(".chip").forEach(c =>
    c.classList.toggle("active", c.dataset.filter === f)
  );

  renderReports();
});

$("#search").addEventListener("input", renderReports);

$("#viewAll").onclick = () => {
  showAll = !showAll;
  renderReports();
};

/* ---------- API: GET Reports ---------- */
async function fetchReports() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok)
      throw new Error("Unable to load reports.");

    reports = await response.json();
    renderReports();

    if (views.home) initMap("home", "homeMap");
    if (views.main) initMap("main", "map");

  } catch (error) {
    console.error(error);
    toast("Could not connect to the backend.");
  }
}

/* ---------- API: UPDATE Report ---------- */
$("#reportList").addEventListener("change", async e => {
  const ref = e.target.dataset.status;
  if (!ref) return;

  const newStatus = e.target.value;

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(ref)}`,
      {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:newStatus})
      }
    );

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.message || "Update failed");

    const index = reports.findIndex(r => r.ref === ref);
    if (index !== -1) reports[index] = data;

    renderReports();
    toast("Status updated successfully.");

  } catch (error) {
    console.error(error);
    toast("Could not update report.");
    fetchReports();
  }
});

/* ---------- API: DELETE Report ---------- */
$("#reportList").addEventListener("click", async e => {
  const ref = e.target.dataset.delete;

  if (!ref || !confirm("Delete this report?")) return;

  try {
    const response = await fetch(
      `${API_URL}/${encodeURIComponent(ref)}`,
      {method:"DELETE"}
    );

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.message || "Delete failed");

    reports = reports.filter(r => r.ref !== ref);

    renderReports();
    initMap("home", "homeMap");

    toast("Report deleted successfully.");

  } catch (error) {
    console.error(error);
    toast("Could not delete report.");
  }
});

/* ---------- Report Form ---------- */
$("#districts").innerHTML = Object.keys(DISTRICTS)
  .map(d => `<option value="${d}">`).join("");

$("#description").addEventListener("input", e => {
  if (e.target.value.length > 300)
    e.target.value = e.target.value.slice(0, 300);

  $("#count").textContent = e.target.value.length;
});

$("#uploadBtn").onclick = () => $("#file").click();

$("#file").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;

  if (f.size > 3 * 1024 * 1024) {
    toast("Please choose an image under 3 MB.");
    e.target.value = "";
    return;
  }

  const rd = new FileReader();

  rd.onload = () => {
    attachment = rd.result;
    $("#fileName").textContent = f.name;
    $("#preview").innerHTML =
      `<img src="${attachment}" alt="Preview of attached photo">`;
  };

  rd.readAsDataURL(f);
});

function validate() {
  let ok = true;

  ["category","description","location"].forEach(id => {
    const el = $("#" + id);
    const bad = !el.value.trim() ||
      (id === "description" && el.value.trim().length < 10);

    el.closest(".field").classList.toggle("invalid", bad);
    if (bad) ok = false;
  });

  return ok;
}

["category","description","location"].forEach(id =>
  $("#" + id).addEventListener("input", () =>
    $("#" + id).closest(".field").classList.remove("invalid")
  )
);

function rnd(n, chars) {
  let s = "";
  for (let i = 0; i < n; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ---------- API: CREATE Report ---------- */
let picker = null, pickMarker = null, picked = null;
const views = {};

$("#reportForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!validate()) return;

  const loc = $("#location").value.trim();
  const base = DISTRICTS[loc] || [14.5995,120.9842];

  const coords0 = DISTRICTS[loc]
    ? [
        base[0] + (Math.random() - .5) * .004,
        base[1] + (Math.random() - .5) * .004
      ]
    : [
        base[0] + (Math.random() - .5) * .03,
        base[1] + (Math.random() - .5) * .03
      ];

  const coords = picked || coords0;

  const reportData = {
    name:(user?.name || "USER").toUpperCase(),
    handle:"@" + (user?.name || "user").toLowerCase().replace(/\s+/g, "_"),
    category:$("#category").value,
    location:loc,
    text:$("#description").value.trim(),
    img:attachment,
    coords
  };

  try {
    const response = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(reportData)
    });

    const data = await response.json();

    if (!response.ok)
      throw new Error(data.message || "Submission failed");

    reports.unshift(data);

    try {
      localStorage.removeItem("esumbong_draft");
    } catch {}

    draft = null;
    $("#reportForm").reset();
    picked = null;

    if (pickMarker) {
      pickMarker.remove();
      pickMarker = null;
    }

    attachment = null;
    $("#fileName").textContent = "";
    $("#preview").innerHTML = "";
    $("#count").textContent = "0";

    markers.forEach(m => m.remove());
    markers = [];

    modal(`
      <h2>Report submitted ✔</h2>
      <p>Thank you! Keep your reference code to track the status:</p>
      <p style="font-size:20px"><b>${esc(data.ref)}</b></p>
    `);

    renderReports();
    go("home");
    initMap("home", "homeMap");

  } catch (error) {
    console.error(error);
    toast(error.message || "Could not submit report.");
  }
});

/* ---------- Draft ---------- */
$("#draftBtn").onclick = () => {
  draft = {
    category:$("#category").value,
    description:$("#description").value,
    location:$("#location").value
  };

  save("esumbong_draft", draft);
  toast("Draft saved");
};

if (draft) {
  $("#category").value = draft.category;
  $("#description").value = draft.description;
  $("#location").value = draft.location;
  $("#count").textContent = draft.description.length;
}

/* ---------- Map ---------- */
const COLORS = {
  Pending:"#a06a00",
  Reviewing:"#3870ba",
  Resolved:"#2e6b34"
};

const pin = st => L.divIcon({
  className:"",
  html:`<span class="pin" style="background:${COLORS[st] || "#7a1414"}"></span>`,
  iconSize:[26,34],
  iconAnchor:[13,34],
  popupAnchor:[0,-30]
});

const noLeaflet = id => {
  $("#" + id).innerHTML =
    '<p style="padding:20px">The map needs an internet connection.</p>';
};

function baseMap(id) {
  const m = L.map(id).setView([14.5995,120.9842],13);

  const street = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}",
    {
      attribution:"© OpenStreetMap contributors",
      maxZoom:19
    }
  ).addTo(m);

  const sat = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:"Tiles © Esri",
      maxZoom:19
    }
  );

  L.control.layers({Street:street, Satellite:sat}).addTo(m);
  return m;
}

function initMap(key, el) {
  if (typeof L === "undefined") return noLeaflet(el);

  if (!views[key])
    views[key] = {map:baseMap(el), markers:[]};

  const v = views[key];

  v.markers.forEach(m => m.remove());
  v.markers = [];

  reports.forEach(r => {
    if (!r.coords || !r.coords.length) return;

    v.markers.push(
      L.marker(r.coords, {icon:pin(r.status), title:r.category})
        .addTo(v.map)
        .bindTooltip(esc(r.category))
        .bindPopup(`
          <b>${esc(r.category)}</b><br>
          ${esc(r.location)}<br>
          Status: ${esc(r.status)}<br>
          <small>Ref: ${esc(r.ref)}</small>
        `)
    );
  });

  v.map.invalidateSize();
}

async function geocode(q) {
  const r = await fetch(
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=" +
    encodeURIComponent(q)
  );

  return (await r.json())[0];
}

$("#mapSearch").addEventListener("submit", async e => {
  e.preventDefault();

  const q = $("#mapQ").value.trim();
  if (!q || !views.main) return;

  try {
    const p = await geocode(q);

    if (!p)
      return toast("No place found. Try a nearby landmark or barangay.");

    views.main.map.setView([+p.lat,+p.lon],17);

  } catch {
    toast("Search needs an internet connection.");
  }
});

function locate(map, onFound) {
  map.once("locationfound", ev => {
    L.circleMarker(ev.latlng, {
      radius:8,
      color:"#fff",
      weight:3,
      fillColor:"#4286de",
      fillOpacity:1
    }).addTo(map);

    if (onFound) onFound(ev.latlng);
  });

  map.once("locationerror", () =>
    toast("Couldn't get your location. Allow location access and use https or localhost.")
  );

  map.locate({setView:true,maxZoom:17});
}

$("#locateBtn").onclick = () =>
  views.main && locate(views.main.map);

function initPicker() {
  if (typeof L === "undefined") return noLeaflet("pickMap");

  if (!picker) {
    picker = baseMap("pickMap");
    picker.on("click", e => setPick(e.latlng));
  }

  picker.invalidateSize();
}

async function setPick(ll) {
  picked = [ll.lat,ll.lng];

  if (pickMarker)
    pickMarker.setLatLng(ll);
  else
    pickMarker = L.marker(ll, {icon:pin("")}).addTo(picker);

  const loc = $("#location");
  loc.value = ll.lat.toFixed(5) + ", " + ll.lng.toFixed(5);
  loc.closest(".field").classList.remove("invalid");

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ll.lat}&lon=${ll.lng}`
    );

    const d = await r.json();

    if (d.display_name && picked && picked[0] === ll.lat)
      loc.value = d.display_name.split(",").slice(0,3).join(",").trim();

  } catch {}
}

$("#pickLocate").onclick = () => {
  initPicker();
  if (picker) locate(picker, setPick);
};

/* ---------- Boot ---------- */
go("home");
fetchReports();