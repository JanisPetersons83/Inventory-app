let data = [];
let analysisData = [];
let analysisFiles = [];
let selectedMaterial = "egle";
let expandedDimension = null;
let editIndex = null;
let currentLocation = null;
let isGaliMode = false;
let isMixedMode = false;
let dimensionsLibrary = [];
let importedBackup = null;
let importedAreaSummary = null;
let dataChanged = false;
let expandedArea = null;
let expandedAreaEntries = null;
let expandedSize = null;
let areaPhotos = {};
let currentArea = null;
let previousArea = null;
let photoTargetArea = null;
let photoBusy = false;
    window.APP_STARTED = true;
// ✅ Sākuma ekrāns
    document.addEventListener("DOMContentLoaded", () => {
        const splash = document.getElementById("appSplash");
            if (!splash) return;
                setTimeout(() => {
                    splash.style.transition = "opacity 0.35s ease";
                    splash.style.opacity = "0";
                setTimeout(() => {
                    splash.remove();
                }, 350);
            }, 2000);
    });

function loadAreaPhotos() {
    try {const saved = localStorage.getItem("areaPhotos");
        if (!saved) {areaPhotos = {};
            return;
                }
    const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ) {areaPhotos = parsed;
                } else {areaPhotos = {};}
        } catch (error) {
                console.error(
                    "❌ Neizdevās ielādēt areaPhotos:",
                error
                );
        areaPhotos = {};
        }    
}
loadAreaPhotos();
// ✅ Login
let selectedBtn = null;
    const areasByLocation = {
        "Dārdu": [
            "2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "3-1", "3-2", "3-3", "3-4",
            "3-5", "3-6", "4-1", "5-1", "5-2", "6-1", "7-1", "7-2", "7-3",
            "7-4", "7-5", "7-6", "9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7",
            "9-8", "9-9", "9-10", "9-11", "9-12", "9-13", "9-14", "9-15", "10-1",
            "10-2", "10-3", "10-4", "10-5", "10-6", "10-7", "10-8", "11-1", "11-2",
            "11-3", "11-4", "11-5", "12-1", "12-2", "12-3", "12-4", "12-5"
          ],
        "Cecīļu": [
            "2-1", "3-1", "4-1", "4-2", "4-3", "6-1", "6-2", "7-1", "7-2", "7-3", "8-1", "8-2", "8-3",
            "8-4", "8-5", "8-6", "8-7", "9-1", "9-2", "9-3", "9-4", "9-5", "9-6", "9-7", "9-8", "9-9", "9-10",
            "9-11", "9-12", "11-1", "11-2", "11-3", "11-4", "11-5", "11-6", "11-7", "11-8", "11-9", "11-10",
            "11-11", "11-12", "11-13", "11-14", "11-15", "ZM", "B-L", "D-L", "N-1", "N-2", "N-3",
            "N-4", "N-5", "N-6", "N-7", "N-8", "N-9", "P-N"
          ]
};
    //✅ APGABALA MAIŅA
function handleAreaChange() {
    const areaSelect = document.getElementById("area");
        if (!areaSelect) {
        return;
        }
    const newArea = areaSelect.value;
    // Ja nekas nav izvēlēts
        if (!newArea) {
            currentArea = null;
            previousArea = null;
            photoTargetArea = null;
            renderAreaPhotoPanel(null);
        return;
        }    
    //✅ Pārbauda iepriekšējo apgabalu
        if (previousArea && previousArea !== newArea
            ) {
            const hasEntries = data.some(e => e.area === previousArea);
            const hasPhoto = hasAreaPhoto(previousArea);       
    //✅ Iepriekšējam apgabalam ir dati, bet nav foto          
        if (hasEntries && !hasPhoto
            ) {
            console.log("📷 Foto pieprasījums:", previousArea);
            const addPhoto = confirm(
                `Apgabalam ${previousArea} nav foto.\n\n` +
                `Vai vēlies pievienot foto?`
            );
        if (addPhoto) {currentArea = previousArea;
                photoTargetArea = previousArea;
            const input = document.getElementById("areaPhotoInput");
        if (input) {input.value = "";
                    input.click();
                    }
                }
            }
        }  
    //✅ Jaunais apgabals kļūst par aktīvo  
            currentArea = newArea;
            previousArea = newArea;
            photoTargetArea = newArea;
        console.log("📍 Aktīvais apgabals:", currentArea);
        console.log("📷 Foto:", hasAreaPhoto(currentArea)
                ? "IR"
                : "NAV");
        renderAreaPhotoPanel(currentArea);
}    
    //✅ Saglabā izvēlētā apgabala foto
function saveAreaPhoto(event) {
        if (photoBusy) {
            return;
            }
    const input = event.target;
    const file = input.files &&
            input.files[0];
        if (!file) {
            return;
        }
    const targetArea = photoTargetArea || currentArea;
        if (!targetArea) {showNotice("⚠️ Nav izvēlēts apgabals!", "error");
            input.value = "";
        return;
        }
    //✅ Pārbauda faila tipu
        if (!file.type.startsWith("image/")) {
            showNotice("❌ Lūdzu izvēlies attēla failu!", "error");
            input.value = "";
        return;
        }
    //✅ Maksimālais oriģinālā faila izmērs
    const maxFileSize = 15 * 1024 * 1024;
        if (file.size > maxFileSize) {
            showNotice("❌ Foto fails ir pārāk liels. " + "Maksimums 15 MB.",
                    "error");
                input.value = "";
            return;
            }
            photoBusy = true;
    const img = new Image();
    const reader = new FileReader();
        reader.onload = function (e) {
            img.onload = function () {
                        try {
    //✅ Maksimālais attēla platums/augstums                   
    const maxSize = 600;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
    const scale = Math.min(1,
            maxSize / width,
            maxSize / height
            );
            width = Math.round(width * scale);
            height = Math.round(height * scale);           
    //✅ Canvas               
    const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
    const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error(
                "Canvas nav pieejams");
        }                    
    //✅ Balts fons JPEG gadījumā                    
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);                
    //✅ JPEG                
    const photo = canvas.toDataURL("image/jpeg", 0.5);
        if (!photo || photo === "data:,") {
            throw new Error("Foto konvertēšana neizdevās");
        }                
    //✅ Saglabā konkrētajam apgabalam                
        areaPhotos[targetArea] = photo;                
    //✅ localStorage                
    const saved = saveAreaPhotosStorage();
        if (!saved) {                        
    //✅ Ja saglabāšana neizdevās, atceļ izmaiņu                    
        delete areaPhotos[targetArea];
            return;
        }
        dataChanged = true;             
    //✅ Aktīvais apgabals                      
        currentArea = targetArea;
        previousArea = document.getElementById("area")
                ?.value || targetArea;        
    //✅ Pārzīmē foto paneli                
        renderAreaPhotoPanel(targetArea);                
    //✅ Importēšanas skats                
        if (typeof renderImportAreas === "function" && importedBackup &&
            importedAreaSummary) {
            renderImportAreas();
            }
            console.log("📷 Foto saglabāts:", targetArea);
            console.log("📷 Visi foto:", Object.keys(areaPhotos));
                showNotice(`📷 Foto pievienots apgabalam ${targetArea}`,
                    "success");
            } catch (error) {
            console.error("❌ Foto apstrādes kļūda:", error);
                showNotice("❌ Neizdevās apstrādāt foto.", "error");
            } finally {
                photoBusy = false;
                input.value = "";}
        };
        img.onerror = function () {
            photoBusy = false;
            input.value = "";
                showNotice("❌ Neizdevās ielādēt attēlu!", "error");
        };
        img.src = e.target.result;
    };
    reader.onerror = function () {
        photoBusy = false;
        input.value = "";
            showNotice("❌ Neizdevās nolasīt foto failu!", "error");
    };
    reader.readAsDataURL(file);
}
function renderAreaPhotoPanel(area) {
    const panel = document.getElementById(
            "areaPhotoPanel");
        if (!panel) {
            return;
        }
        if ((!area)
            ) {
            panel.innerHTML = "";
            panel.style.display = "none";
        return;
            }
            panel.style.display = "block";
    const photo = areaPhotos[area];
        if (photo) {panel.innerHTML = `
            <div class="areaPhotoTitle">
                📷 Apgabala ${area} foto
            </div>
            <div class="areaPhotoContent">
                <div class="areaPhotoPreview">
                    <img
                        src="${photo}"
                        alt="Apgabala ${area} foto"
                        onclick="viewAreaPhoto('${area}')">
                </div>
                <div class="areaPhotoButtons">
                    <button
                        type="button"
                        onclick="chooseAreaPhoto('${area}')">
                        🔄 Nomainīt
                    </button>
                    <button
                        type="button"
                        onclick="deleteAreaPhoto('${area}')">
                        🗑 Dzēst
                    </button>
                </div>
            </div> `;
        } else {panel.innerHTML = `
            <div class="areaPhotoTitle">
                📷 Apgabala ${area} foto
            </div>
            <div class="areaPhotoContent">
                <div class="areaPhotoPreview areaPhotoPlaceholder">
                    📷 Foto<br>nav<br>pievienots
                </div>
                <div class="areaPhotoButtons">
                    <button
                        type="button"
                        onclick="chooseAreaPhoto('${area}')">
                        📷 Pievienot<br>foto
                    </button>
                </div>
            </div>`;
        }
}
function updateAreas() {
    const location = localStorage.getItem("location");
    const select = document.getElementById("area");
        select.innerHTML = `<option value="">Apgabals *</option>`;
          (areasByLocation[location] || []).forEach(a => {
    const opt = document.createElement("option");
          opt.value = a;
          opt.textContent = a;
          select.appendChild(opt);
      });
        previousArea = document.getElementById("area").value;
}
function startDataViewMode() {
    analysisData = [];
    analysisFiles = [];
    expandedDimension = null;
        document.getElementById("analysisInfo").innerHTML = "";
        document.getElementById("analysisView").innerHTML = "";
        document.getElementById("analysisBackupFile").value = "";
        document.getElementById("locationSelect").style.display = "none";
        document.getElementById("appContent").style.display = "none";
        document.getElementById("analyticsContent").style.display = "block";
}
function openAnalysisBackupFile() {
  document
    .getElementById("analysisBackupFile")
    .click();
}
async function importAnalysisBackup(event) {
    const files = [...event.target.files];
        if (!files.length) return;
    const backups = [];
        for (const file of files) {
            let backup;
                try {
                    const text = await file.text();
                      backup = JSON.parse(text);
                } catch (error) {
            alert(`Fails "${file.name}" nav derīgs JSON fails!`);
                return;
        }
        if (!backup || typeof backup !== "object") {
            alert(`Fails "${file.name}" nav derīgs backup fails!`);
                return;
        }
        if (!Array.isArray(backup.entries)) {
            alert(`Failā "${file.name}" nav derīgu entries datu!`);
                return;
        }
        backups.push(backup);
        }
    const baseLocation = backups[0].location;
    const users = [...new Set(backups.map(b => b.user))];
    const baseMonth = backups[0].inventoryMonth;
    const baseYear = backups[0].inventoryYear;
    const invalidFile = backups.find(b =>
        b.location !== baseLocation ||
        b.inventoryMonth !== baseMonth ||
        b.inventoryYear !== baseYear
    );
        if (invalidFile) {
            alert("Izvēlētie faili ir no dažādām ražotnēm vai periodiem!"
              );
        return;
        }
        analysisData = [];
        backups.forEach(backup => {
        analysisData.push(
        ...backup.entries
            );
        });
    const groups = {};  
      analysisData.forEach(e => {
    const key = `${e.thickness}x${e.width}`;
        if (!groups[key]) {groups[key] = {
            packages: 0,
            totalM3: 0,
            rows: []
            };
      }
        groups[key].packages += e.packages || 0;
        groups[key].totalM3 += e.total || 0;
        groups[key].rows.push(e);
      });  
  const totalPackages = analysisData.reduce(
      (sum, e) => sum + (e.packages || 0), 0);
  const totalM3 = analysisData.reduce(
      (sum, e) => sum + (e.total || 0), 0);
    document.getElementById("analysisInfo")
        .innerHTML = `
            <h3>📊 Kopsavilkums</h3>
            Ražotne: ${baseLocation}<br>
            Lietotāji:<br> ${users.join("<br>")}<br><br>
            Datu reģistrācija: ${String(baseMonth).padStart(2, "0")}.${baseYear}<br>
            Faili: ${backups.length}<br>
            Ieraksti: ${analysisData.length}<br>
            Paletes: ${totalPackages}<br>
            m³: ${totalM3.toFixed(4)}`;
  renderDimensionAnalysis();
}
function setMaterialFilter(type) {
    selectedMaterial = type;
    expandedDimension = null;
    document
        .querySelectorAll(".materialTabs button")
        .forEach(btn =>
            btn.classList.remove("active")
        );
    document
        .getElementById(`mat_${type}`)
        .classList.add("active");
  renderDimensionAnalysis();
}
function renderDimensionAnalysis() {
    let filteredData = analysisData;
        const groups = {};
            if (selectedMaterial === "egle") {
                filteredData = analysisData.filter(e =>
                    e.comment !== "Lapegle" &&
                    e.comment !== "Termokoks"
                );
            } else if (selectedMaterial === "lapegle") {
                filteredData = analysisData.filter(e =>
                e.comment === "Lapegle"
                );
            } else if (selectedMaterial === "termokoks") {
                filteredData = analysisData.filter(e =>
                    e.comment === "Termokoks"
                );
            }
                filteredData.forEach(e => {
        const key = e.mode === "mixed"
                ? "Dažādi"
                : `${e.thickness}x${e.width}`;
            if (!groups[key]) {groups[key] = {
                packages: 0,
                totalM3: 0,
                rows: []
                };
            }
            groups[key].packages += e.packages || 0;
            groups[key].totalM3 += e.total || 0;
            groups[key].rows.push(e);
        });
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Dimensija</th>
                            <th>Pakas</th>
                            <th>m³</th>
                        </tr>
                    </thead>
                    <tbody>`;
                        Object.entries(groups)
                            .sort(([a], [b]) =>
                                a.localeCompare(b, undefined, { numeric: true })
                                )
                            .forEach(([size, info]) => {
                        html += `
                            <tr>
                                <td onclick="toggleDimension('${size}')"
                                    style="cursor:pointer;">
                                    ${expandedDimension === size ? "▼" : "▶"} ${size}
                                </td>
                                <td>${info.packages}</td>
                                <td>${info.totalM3.toFixed(4)}</td>
                            </tr>`;
            if (expandedDimension === size) {
                info.rows.forEach(row => {
        const lengthText = row.mode === "mixed"
            ? `${row.packLength}×${row.packWidth}×${row.packHeight} mm (${row.mixedFill}%)`
            : String(row.length).toLowerCase() === "gali"
                ? `≈${row.avgLength} mm`
                : `${row.length} mm`;
        const productionDate = `${String(row.month).padStart(2, "0")}.${String(row.year).slice(-2)}`;
            html += `
                <tr class="detailRow">
                    <td colspan="3">
                        ${row.area} |
                        ${row.mode === "mixed"
                            ? (row.grade || "Dažādi")
                            : row.grade} |
                        ${lengthText} |
                        ${row.packages} pal. |
                        ${row.mode === "mixed" ? "" : `${row.pieces} gab. |`}
                        ${productionDate} |
                        ${row.total.toFixed(3)} m³
                    </td>
                </tr>`;
            });
          }
        });
              html += `
                  </tbody>
                    </table>`;
              document.getElementById("analysisView").innerHTML = html;
}
function toggleArea(area) {
    expandedArea = expandedArea === area
        ? null
        : area;
    expandedAreaEntries = null;
    expandedSize = null;
    renderImportAreas();
}
function toggleAreaEntries(area) {
    expandedAreaEntries = expandedAreaEntries === area
        ? null
        : area;
    expandedSize = null;
    renderImportAreas();
}
function toggleSize(area, size) {
    const key =`${area}_${size}`;
        expandedSize = expandedSize === key
            ? null
            : key;
    renderImportAreas();
}
function toggleDimension(size) {
    if (expandedDimension === size) {
        expandedDimension = null;
    } else {
        expandedDimension = size;
    }
  renderDimensionAnalysis();
}
function closeDataViewMode() {
    analysisFiles = [];
    analysisData = [];
    expandedDimension = null;
    selectedMaterial = "egle";
    //✅ Notīra kopsavilkumu
    document.getElementById("analysisInfo").innerHTML = "";
    //✅ Notīra analītikas saturu
    document.getElementById("analysisView").innerHTML = "";
    //✅ Notīra izvēlētos backup failus
    document.getElementById("analysisBackupFile").value = "";
    //✅ Aizver analītikas skatu
    document.getElementById("analyticsContent").style.display = "none";
    //✅ Atgriežas Login logā
    document.getElementById("locationSelect").style.display = "block";
}
function showNotice(message, type = "info", fieldId = null) {
    const notice = document.getElementById("notice");
        notice.className = "";
        notice.classList.add("notice-" + type);
        notice.innerText = message;
        notice.style.display = "block";
            setTimeout(() => {
        notice.classList.add("show");
            }, 10);
            clearTimeout(notice.timer);
        notice.timer = setTimeout(() => {
        notice.classList.remove("show");
            setTimeout(() => {
        notice.style.display = "none";
        if (fieldId) {
    const field =
            document.getElementById(fieldId);
        if (field) {
            field.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        field.focus();
            }
          }
        }, 250);
      }, type === "error" ? 5000 : 2000);
}
function setMixedMode(active) {
    isMixedMode = active;
        if (active) {
            isGaliMode = false;
        }
        document.getElementById("mixedInputs").style.display =
            active ? "grid" : "none";
    const mixedBtn = document.getElementById("mixedBtn");
            mixedBtn.classList.toggle("active", active);
            mixedBtn.setAttribute("aria-pressed", String(active));
        for (const id of ["thickness", "width", "length", "pieces"]) {
        const field = document.getElementById(id);
            field.disabled = active;
        if (active) {
            field.value = "";
        }
    }
    document.getElementById("thickness").style.display = active ? "none" : "";
    document.getElementById("width").style.display = active ? "none" : "";
    document.getElementById("GaliContainer").style.display = active ? "none" : "flex";
    document.querySelector(".piecesRow").style.display = active ? "none" : "flex";
    document.getElementById("galiBtn").disabled = active;
    document.getElementById("galiBtn").classList.remove("active");
    document.getElementById("galiInputs").style.display = "none";
    document.getElementById("calcInfo").style.display = "none";
        const suggestions = document.getElementById("sizeSuggestions");
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
}
function toggleMixed() {
    setMixedMode(!isMixedMode);
}
  function toggleGali() {
      if (isMixedMode) 
          return;
        isGaliMode = !isGaliMode; 
    const block = document.getElementById("galiInputs");
    const calcInfo = document.getElementById("calcInfo");
    const btn = document.getElementById("galiBtn");
    const lengthInput = document.getElementById("length");
      if (isGaliMode) {
        block.style.display = "block";
        calcInfo.style.display = "block";
        btn.classList.add("active");
    // ✅ Garums nav rediģējams
        lengthInput.disabled = true;
        lengthInput.value = "";
      } else {
        block.style.display = "none";
        calcInfo.style.display = "none";
        btn.classList.remove("active");
    // ✅ Atkal ļauj ievadīt garumu
        lengthInput.disabled = false;
    }
  }
function validateDimensionFields() {
    const thicknessField = document.getElementById("thickness");
    const widthField = document.getElementById("width");
    if (!thicknessField || !widthField) {
        return;}
    const thickness = thicknessField.value.trim();
    const width = widthField.value.trim();
    const library = Array.isArray(dimensionsLibrary)
        ? dimensionsLibrary
        : [];
    const knownThicknesses = new Set();
    const knownWidths = new Set();
    const knownDimensions = new Set();
    library.forEach(size => {
        const normalizedSize = String(size)
            .trim()
            .toLowerCase()
            .replaceAll("×", "x")
            .replace(/\s+/g, "");
        const [savedThickness, savedWidth] = normalizedSize.split("x");
            if (savedThickness) {
                knownThicknesses.add(savedThickness);
            }
            if (savedWidth) {
                knownWidths.add(savedWidth);
            }
            if (savedThickness && savedWidth) {
                knownDimensions.add(
                `${savedThickness}x${savedWidth}`
                );
            }
    });
    //✅ Krāsojumu noņem tikai aizpildītam laukam.
    //✅ Tukšam laukam saglabā AI uzlikto aiAttention.
            if (thickness) {
                thicknessField.classList.remove("aiAttention");
            }
            if (width) {
                widthField.classList.remove("aiAttention");
            }
    //✅ Abi lauki tukši — saglabā AI brīdinājumus
            if (!thickness && !width) {
            return;
            }
    //✅ Ievadīts tikai biezums
            if (thickness && !width) {
                if (!knownThicknesses.has(thickness)) {
                    thicknessField.classList.add("aiAttention");
                }
            return;
            }
    //✅ Ievadīts tikai platums
        if (!thickness && width) {
            if (!knownWidths.has(width)) {
                widthField.classList.add("aiAttention");
            }
            return;
        }
    //✅ Aizpildīti abi — pārbauda pilno kombināciju
    const dimension = `${thickness}x${width}`;
        if (!knownDimensions.has(dimension)) {
            thicknessField.classList.add("aiAttention");
            widthField.classList.add("aiAttention");
        return;
        }    
    //✅ Saglabāta un pareiza kombinācija
            thicknessField.classList.remove("aiAttention");
            widthField.classList.remove("aiAttention");
}
function showSizeSuggestions() {
    const thickness = document.getElementById("thickness").value.trim();
    const container = document.getElementById("sizeSuggestions");
            container.innerHTML = "";
        if (!thickness) {
            container.style.display = "none";
        return;
        }
    const matches = dimensionsLibrary.filter(size =>
            size.startsWith(thickness + "x"))
            .slice(0, 20);
        if (matches.length === 0) {
            container.style.display = "none";
          return;
        }
        matches.forEach(size => {
    const div = document.createElement("div");
        div.className = "sizeOption";
        div.textContent = size;
        div.onclick = () => {
    const parts = size.split("x");
        document.getElementById("thickness").value = parts[0];
        document.getElementById("width").value = parts[1];
        container.innerHTML = "";
        container.style.display = "none";
            validateDimensionFields();
        document.getElementById("length").focus();
        };
        container.appendChild(div);
      });
        container.style.display = "block";
}
function updateMaps() {
    const location = localStorage.getItem("location");
    const container = document.getElementById("mapLinks");
    const BASE_PATH = "/Inventory-app";
            container.innerHTML = ""; // notīra iepriekšējo
        if (location === "Dārdu") {
            container.innerHTML = `
                <a href="#" onclick="openImageFromSrc('${BASE_PATH}/dardu_map1.jpeg'); return false;">
                    📍 Karte 1
                </a>
                <a href="#" onclick="openImageFromSrc('${BASE_PATH}/dardu_map2.jpeg'); return false;">
                    📍 Karte 2
                </a>`;
        } else if (location === "Cecīļu") {
            container.innerHTML = `
                <a href="#" onclick="openImageFromSrc('${BASE_PATH}/cecilu_map.jpeg'); return false;">
                    📍 Karte
                </a>`;
          }
}
    //✅ Kartes attēla modelis un žesti
    let mapImageScale = 1;
    let mapImageTranslateX = 0;
    let mapImageTranslateY = 0;
        const mapImagePointers = new Map();
    let mapImageDragOffsetX = 0;
    let mapImageDragOffsetY = 0;
    let mapPinchStartDistance = 0;
    let mapPinchStartScale = 1;
    let mapPinchStartCenterX = 0;
    let mapPinchStartCenterY = 0;
    let mapPinchStartTranslateX = 0;
    let mapPinchStartTranslateY = 0;
function openImageFromSrc(src) {
    const modal = document.getElementById("imageModal");
    const image = document.getElementById("modalImg");
        if (!modal || !image) return;
        resetImageZoom();
            image.src = src;
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        initImageGestures();
}
function closeImageModal() {
    const modal = document.getElementById("imageModal");
    const image = document.getElementById("modalImg");
        resetImageZoom();
        if (modal) modal.style.display = "none";
            if (image) image.src = "";
                document.body.style.overflow = "";
}
function limitImageScale(value) {
    return Math.min(5, Math.max(1, value));
}
function applyImageTransform() {
    const image = document.getElementById("modalImg");
        if (!image) return;
            image.style.transform =`translate(${mapImageTranslateX}px,
                ${mapImageTranslateY}px) scale(${mapImageScale})`;
}
function resetImageZoom() {
    mapImageScale = 1;
    mapImageTranslateX = 0;
    mapImageTranslateY = 0;
    mapImagePointers.clear();
    mapPinchStartDistance = 0;
    mapPinchStartScale = 1;   
    applyImageTransform();
}
function getImagePointerDistance() {
    const points = Array.from(mapImagePointers.values());
        if (points.length < 2) return 0;
        return Math.hypot(
            points[1].x - points[0].x,
            points[1].y - points[0].y
        );
}
function getImagePointerCenter() {
    const points = Array.from(mapImagePointers.values());
        if (points.length < 2) {
            return {
                x: points[0]?.x || 0,
                y: points[0]?.y || 0
            };
        }
        return {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2
        };
}
function initImageGestures() {
    const modal = document.getElementById("imageModal");
    const image = document.getElementById("modalImg");
        if (!modal || !image) return;
        if (image.dataset.gesturesReady === "true") {
        return;
        }
        image.dataset.gesturesReady = "true";
        image.style.touchAction = "none";
        image.addEventListener("pointerdown", event => {
            event.preventDefault();
            event.stopPropagation();
        image.setPointerCapture?.(event.pointerId);
            mapImagePointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY
            });
        if (mapImagePointers.size === 1) {
            mapImageDragOffsetX = event.clientX - mapImageTranslateX;
            mapImageDragOffsetY = event.clientY - mapImageTranslateY;
        }
        if (mapImagePointers.size === 2) {
            const center = getImagePointerCenter();
        mapPinchStartDistance = getImagePointerDistance();
        mapPinchStartScale = mapImageScale;
        mapPinchStartCenterX = center.x;
        mapPinchStartCenterY = center.y;
        mapPinchStartTranslateX = mapImageTranslateX;
        mapPinchStartTranslateY = mapImageTranslateY;
        }
    });
    image.addEventListener("pointermove", event => {
        if (!mapImagePointers.has(event.pointerId)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        mapImagePointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY
        });
        if (mapImagePointers.size >= 2 && mapPinchStartDistance > 0) {
            const distance = getImagePointerDistance();
            const center = getImagePointerCenter();
                mapImageScale = limitImageScale(mapPinchStartScale * (distance / mapPinchStartDistance));
                mapImageTranslateX = mapPinchStartTranslateX + (center.x - mapPinchStartCenterX);
                mapImageTranslateY = mapPinchStartTranslateY + (center.y - mapPinchStartCenterY);
                    applyImageTransform();
            return;}
        if (mapImagePointers.size === 1 && mapImageScale > 1) {
            mapImageTranslateX = event.clientX - mapImageDragOffsetX;
            mapImageTranslateY = event.clientY - mapImageDragOffsetY;
                applyImageTransform();
            }
    });
    function finishImagePointer(event) {
        mapImagePointers.delete(
        event.pointerId
        );
        if (mapImagePointers.size === 1) {
            const remaining = Array.from(
                mapImagePointers.values()
            )[0];
            mapImageDragOffsetX = remaining.x - mapImageTranslateX;
            mapImageDragOffsetY = remaining.y - mapImageTranslateY;
            }
        if (mapImagePointers.size === 0) {
            mapPinchStartDistance = 0;
        if (mapImageScale <= 1) {
        resetImageZoom();
            }
        }
    }
    image.addEventListener("pointerup", finishImagePointer);
    image.addEventListener("pointercancel", finishImagePointer);
    image.addEventListener("wheel", event => {
        event.preventDefault();
        event.stopPropagation();
    const zoomAmount = event.deltaY < 0 ? 0.2 : -0.2;
        mapImageScale = limitImageScale(
        mapImageScale + zoomAmount
        );
        if (mapImageScale === 1) {
            mapImageTranslateX = 0;
            mapImageTranslateY = 0;
            }
            applyImageTransform();
        },
        { passive: false }
        );
        image.addEventListener("dblclick", event => {
            event.preventDefault();
            event.stopPropagation();
            resetImageZoom();
            });
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeImageModal();
            }
        }
    );
}
function setLocation(loc, btn) {
      currentLocation = loc;
      localStorage.setItem("location", loc);
      // ✅ noņem highlight no iepriekšējās
  if (selectedBtn) {
      selectedBtn.classList.remove("activeLocation");
  }
      // ✅ uzliek highlight jaunajai
      btn.classList.add("activeLocation");
      selectedBtn = btn;
}
function openImage(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
        modal.style.display = "block";
        modalImg.src = img.src;
}
function setHeaderInfo() {
    const name = localStorage.getItem("userName") || "";
    const location = localStorage.getItem("location") || "";
    const d = new Date();
    const date =
        String(d.getDate()).padStart(2, "0") + "." +
        String(d.getMonth() + 1).padStart(2, "0") + "." +
            d.getFullYear();
    const testText = isTestMode()
        ? " 🧪 TEST"
        : "";
        document.getElementById("infoLine").innerText =
            `${location} | ${name}${testText} | ${date}`;
}
function saveUser() {
    const input = document.getElementById("userNameInput");
    const name = input
        ? input.value.trim()
        : "";
    const location = localStorage.getItem("location");
    if (!location) {
        showNotice("⚠️ Izvēlies ražotni", "error");
        return;
    }
    if (!name) {
        showNotice("⚠️ Ievadi vārdu", "error");
        return;
    }
    const cleanName = name
        .replace(/\s+test$/i, "")
        .trim();
    localStorage.setItem(
        "sessionStart",
        String(Date.now())
    );
    localStorage.setItem(
        "userName",
        name
    );
    saveRecentUser(cleanName);
    document.getElementById("locationSelect")
        .style.display = "none";
    document.getElementById("appContent")
        .style.display = "block";
    currentArea = null;
    previousArea = null;
    photoTargetArea = null;
    setHeaderInfo();
    updateAreas();
    updateMaps();
    renderAreaPhotoPanel(null);
    render();
    checkBetaAccess();
    loadAITestScript();
}
function saveRecentUser(name) {
    const cleanName = typeof name === "string"
            ? name.trim()
            : "";
        if (!cleanName) {
            return;
        }
    let users = [];
        try {
            const saved = JSON.parse(localStorage.getItem("recentUsers") || "[]");
                users = Array.isArray(saved)
                ? saved.filter(user =>
                    typeof user === "string" && user.trim()
                )
            : [];
        } catch (error) {
        console.warn("Lietotāju vēsturi neizdevās nolasīt:", error);
        users = [];
    }
    //✅ Novērš viena lietotāja atkārtošanos
    users = users.filter(
        user =>
            user.trim().toLowerCase() !== cleanName.toLowerCase()
    );
    //✅ Jaunāko ieliek saraksta sākumā
    users.unshift(cleanName);
    // Saglabā pēdējos 10 lietotājus
    users = users.slice(0, 10);
    try {
        localStorage.setItem(
            "recentUsers",
            JSON.stringify(users)
        );
    } catch (error) {
        console.warn("Lietotāju vēsturi neizdevās saglabāt:", error);
    }
}
function getRecentUsers() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("recentUsers") || "[]"
            );
        if (!Array.isArray(saved)) {
            return [];}
        return saved.filter(user =>
            typeof user === "string" && user.trim()
        );
    } catch (error) {
        console.warn("Neizdevās ielādēt lietotāju sarakstu:", error);
        return [];
    }
}
function loadRecentUsers(filterText = "") {
    const list = document.getElementById("recentUsersList");
    if (!list) {
        return;
    }
    const search = String(filterText)
        .trim()
        .toLowerCase();
    const users = getRecentUsers().filter(user => user.toLowerCase().includes(search));
        list.innerHTML = "";
    if (users.length === 0) {
        list.style.display = "none";
        return;
    }
    users.forEach(user => {
        const row = document.createElement("div");
            row.className = "recent-user-row";
    //✅ Lietotāja izvēles poga
        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.className = "recent-user-option";
        selectButton.textContent = user;
        selectButton.addEventListener("click", () => {
            const input = document.getElementById("userNameInput");
            if (input) {
                input.value = user;
                input.focus();
            }
            list.style.display = "none";
        });
    //✅ Dzēšanas poga
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "recent-user-delete";
        deleteButton.textContent = "🗑️";
        deleteButton.setAttribute(
            "aria-label",
            `Dzēst lietotāju ${user}`
        );
        deleteButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            deleteRecentUser(user);
        });
        row.appendChild(selectButton);
        row.appendChild(deleteButton);
        list.appendChild(row);
    });
    list.style.display = "block";
}
function deleteRecentUser(userToDelete) {
    const confirmed = confirm(
        `Vai izdzēst lietotāju "${userToDelete}" no saraksta?`
    );
    if (!confirmed) {
        return;
    }
    const users = getRecentUsers().filter(user =>
        user.toLowerCase() !== userToDelete.toLowerCase()
    );
    try {
        localStorage.setItem(
            "recentUsers",
            JSON.stringify(users)
        );
    } catch (error) {
        console.warn("Neizdevās saglabāt lietotāju sarakstu:", error);
        showNotice("❌ Lietotāju neizdevās izdzēst.", "error");
        return;
    }
    const input = document.getElementById("userNameInput");
    loadRecentUsers(input ? input.value : "");
    showNotice(
        `✅ Lietotājs "${userToDelete}" izdzēsts no saraksta.`,
        "success");
}
function showRecentUsers() {
    const input = document.getElementById("userNameInput");
    const list = document.getElementById("recentUsersList");
        if (!input || !list) {
            return;
        }
    loadRecentUsers(input.value);
        if ( getRecentUsers().length > 0) {
            list.style.display = "block";
        }
}
function filterRecentUsers() {
    const input = document.getElementById("userNameInput");
    if (!input) {
        return;
    }
    loadRecentUsers(input.value);
}
function safeFileName(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_");
}
// ✅ Automātiski gads
function updateYearFromMonth() {
    const month = Number(document.getElementById("month").value);
        if (!month) return;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const fullYear =
        month > currentMonth
            ? currentYear - 1
            : currentYear;
        document.getElementById("year").value = fullYear;
}
function getFullYear(yearValue) {
    const year = Number(yearValue);
        if (!Number.isInteger(year)) {
            return null;
        }
    //✅ 26 → 2026
        if (year >= 20 && year <= 99) {
            return 2000 + year;
        }
    //✅ 2026 → 2026
        if (year >= 2000 && year <= 2099) {
            return year;
        }
    return null;
}
// ✅ Pievieno ierakstu
function add() {
    const areaVal = document.getElementById("area").value.trim();
    const packagesVal = Number(document.getElementById("packages").value);
    const thicknessVal = Number(document.getElementById("thickness").value);
    const widthVal = Number(document.getElementById("width").value);
    const monthVal = Number(document.getElementById("month").value);
    const yearInput = Number(document.getElementById("year").value);
    const yearVal = getFullYear(yearInput);
        if (!areaVal)
            return error("Apgabals obligāts", "area");
        if (packagesVal <= 0 || isNaN(packagesVal))
            return error("Pakas obligātas", "packages");
        if (!isMixedMode && (thicknessVal <= 0 || isNaN(thicknessVal)))
            return error("Biezums obligāts", "thickness");
        if (!isMixedMode && (widthVal <= 0 || isNaN(widthVal)))
            return error("Platums obligāts", "width");
        if (!isMixedMode) {
    const size = `${thicknessVal}x${widthVal}`;
  //✅ Izmēru saglabāšana bibliotēkā
        dimensionsLibrary = Array.isArray(dimensionsLibrary)
            ? dimensionsLibrary
            : [];
        dimensionsLibrary = dimensionsLibrary.filter(
            s => s !== size
          );
        dimensionsLibrary.unshift(size);
            localStorage.setItem(
                "dimensionsLibrary",
            JSON.stringify(dimensionsLibrary)
            );
        }
        if (!monthVal || monthVal < 1 || monthVal > 12)
            return error("Mēnesis 1–12", "month");
        if (yearVal === null) {
            return error(
                "Nepareizs gads", "year");
        }
        if (!document.getElementById("grade").value)
                return error("Izvēlies šķiru", "gradeBtn");
            let rawLength = document.getElementById("length").value.trim();
        if (isGaliMode) {rawLength = "gali";}
            let lengthVal = rawLength.toLowerCase();
            let totalM3 = 0;
            let m3PerPack = 0;
            let packWidth = null;
            let packLength = null;
            let packHeight = null;
            let piecesPerPack = null;
            let avgLength = null;
            let mixedFill = null;
  //✅ Dažādi un Gali režīms
        if (isMixedMode) {
            packLength = Number(document.getElementById("mixedLength").value);
            packWidth = Number(document.getElementById("mixedWidth").value);
            packHeight = Number(document.getElementById("mixedHeight").value);
            mixedFill = Number(document.getElementById("mixedFill").value);
        if (!Number.isFinite(packLength) || packLength <= 0)
            return error("Paletes garums obligāts", "mixedLength");
        if (!Number.isFinite(packWidth) || packWidth <= 0)
            return error("Paletes platums obligāts", "mixedWidth");
        if (!Number.isFinite(packHeight) || packHeight <= 0)
            return error("Paletes augstums obligāts", "mixedHeight");
        if (!Number.isFinite(mixedFill) || mixedFill <= 0 || mixedFill > 100)
            return error("Aizpildījumam jābūt no 0 līdz 100%", "mixedFill");
        m3PerPack = packLength * packWidth * packHeight * (mixedFill / 100) / 1000000000;
            totalM3 = m3PerPack * packagesVal;
            rawLength = "";
            } else if (lengthVal === "gali") {
        packWidth = Number(document.getElementById("packWidth").value);
        packLength = Number(document.getElementById("packLength").value);
        packHeight = Number(document.getElementById("packHeight").value);
        avgLength = Number(document.getElementById("avgLength").value);
        if (packWidth <= 0 || isNaN(packWidth))
            return error(
                "Pakas platums obligāts",
                "packWidth"
                );
        if (packLength <= 0 || isNaN(packLength))
            return error(
                "Pakas garums obligāts",
                "packLength"
                );
        if (packHeight <= 0 || isNaN(packHeight))
            return error(
                "Pakas augstums obligāts",
                "packHeight"
                );
        if (avgLength <= 0 || isNaN(avgLength))
            return error(
                "Vidējais garums obligāts",
                "avgLength"
                );
    //✅ Pakas tilpums m³
            m3PerPack = (packWidth * packLength * packHeight) / 1000000000;
    const piecesAcrossWidth = Math.floor(packWidth / widthVal);
    const piecesAcrossHeight = Math.floor(packHeight / thicknessVal);
    const piecesFront = piecesAcrossWidth * piecesAcrossHeight;
    const columns = Math.floor(packLength / avgLength);
    const efficiency = 0.95;
        piecesPerPack = Math.max(1, Math.floor(piecesFront * columns * efficiency)
        );
    //✅ Parāda ar ≈
        document.getElementById("pieces").value = "≈ " + piecesPerPack;
            totalM3 = m3PerPack * packagesVal;
      } else {
    // Parastais režīms
    const lengthNum = Number(rawLength);
    const piecesVal = Number(document.getElementById("pieces").value);
        if (lengthNum <= 0 || isNaN(lengthNum))
            return error(
                "Garums nav pareizs",
                "length"
                );
        if (piecesVal <= 0 || isNaN(piecesVal))
            return error(
                "Gabali pakā obligāti",
                "pieces"
                );
        piecesPerPack = piecesVal;
        m3PerPack = (thicknessVal * widthVal * lengthNum * piecesVal) / 1000000000;
        totalM3 = m3PerPack * packagesVal;
      }
  //✅ Jaunais ieraksts
  const entry = {
    area: areaVal,
    packages: packagesVal,
    thickness: isMixedMode ? null : thicknessVal,
    width: isMixedMode ? null : widthVal,
    length: rawLength,
    month: monthVal,
    year: yearVal,
    packWidth: packWidth,
    packLength: packLength,
    packHeight: packHeight,
        mixedFill: mixedFill,
            mode: isMixedMode ? "mixed" :
              (isGaliMode ? "gali" : "standard"),
    pieces: piecesPerPack,
    avgLength: avgLength,
    name: document.getElementById("name").value,
    code: document.getElementById("productCode").value,
    grade: document.getElementById("grade").value,
    comment: document.getElementById("comment").value,
    m3Pack: m3PerPack,
    total: totalM3
  };
  //✅ Labošana / jauns ieraksts
  if (editIndex !== null) {
    data[editIndex] = entry;
    dataChanged = true;
    editIndex = null;
    document.getElementById("addBtn").innerText =
      "➕ Pievienot";
    document.getElementById("cancelEditBtn").style.display =
      "none";
    showNotice(
      "✅ Labojums saglabāts",
      "success"
    );
  } else {
    data.push(entry);
    dataChanged = true;
    showNotice(
      "✅ Ieraksts pievienots",
      "success"
    );
  }
  //✅ Saglabāšana
  localStorage.setItem(
    "data",
    JSON.stringify(data)
  );
  saveBackup();
  //✅ Formas attīrīšana
  clearError();
  render();
  clearForm();
  document.getElementById("galiInputs").style.display = "none";
}
// ✅ Atcelt
function cancelEdit() {
  editIndex = null;
  document.getElementById("addBtn").innerText =
    "➕ Pievienot";
  document.getElementById("cancelEditBtn").style.display =
    "none";
  clearForm();
  clearError();
  showNotice(
      "ℹ️ Labošana atcelta",
      "info"
      );
}
// ✅ Tabula
function render() {
    let html = `
        <tr>
            <th>Apgabals</th>
            <th>Pakas</th>
            <th>Izmērs</th>
            <th>Gabali</th>
            <th>m3</th>
            <th>Darbības</th>
        </tr>`;
    let totalPackages = 0;
    let totalM3 = 0;
        [...data]
        .map((e, i) => ({ e, i }))
        .reverse()
        .forEach(({ e, i }) => {
            totalPackages += e.packages || 0;
            totalM3 += e.total || 0;
    let size;
        if (e.mode === "mixed") {
            size = `Dažādi (${e.packLength}×${e.packWidth}×${e.packHeight} mm; ${e.mixedFill}%)`;
        } else if ((e.length || "").trim().toLowerCase() === "gali") {
            size = `${e.packLength}×${e.packWidth}×${e.packHeight}`;
        } else {
            size = `${e.thickness}×${e.width}×${e.length}`;
        }
            html += `
                <tr>
                    <td>${e.area}</td>
                    <td>${e.packages}</td>
                    <td>${size}</td>
                    <td>${e.pieces || ""}</td>
                    <td>${e.total?.toFixed(4) || ""}</td>
                    <td>
                    <button onclick="edit(${i})">✏️</button>
                    <button onclick="remove(${i})">🗑️</button>
                    </td>
                </tr>`;
            });
    // ✅ Kopsumma (vienreiz!)
            html += `
                <tr style="font-weight:bold; background:#eee;">
                    <td>Kopā:</td>
                    <td>${totalPackages}</td>
                    <td></td>
                    <td></td>
                    <td>${totalM3.toFixed(4)}</td>    
                </tr>`;  
            document.getElementById("table").innerHTML = html;
}
    // ✅ Delete
function remove(i) {
    data.splice(i, 1);
    dataChanged = true;
    localStorage.setItem("data", JSON.stringify(data));
  render();
}
// ✅ Edit
function edit(i) {
    const e = data[i];
        clearForm(false);
        setMixedMode(e.mode === "mixed");
        /*updateGradeColor();*/
  // ✅ atceramies kuru ierakstu labo
        editIndex = i;
            document.getElementById("area").value = e.area;
            document.getElementById("packages").value = e.packages;
            document.getElementById("thickness").value = e.thickness;
            document.getElementById("width").value = e.width;
            document.getElementById("length").value = e.length;
            document.getElementById("month").value = e.month;
            document.getElementById("year").value = Number(e.year);
            document.getElementById("pieces").value = e.pieces;
            document.getElementById("name").value = e.name;
            document.getElementById("productCode").value = e.code;
            document.getElementById("grade").value = e.grade || "";
        }
    const selectedItem = document.querySelector(
        `.item[data-value="${e.grade}"]`
      );
        if (selectedItem) {
            document.getElementById("gradeBtn").innerHTML =
            selectedItem.innerHTML + " ▼";
        }
            document.getElementById("comment").value = e.comment;
        if (e.mode === "mixed") {
            document.getElementById("mixedLength").value = e.packLength ?? "";
            document.getElementById("mixedWidth").value = e.packWidth ?? "";
            document.getElementById("mixedHeight").value = e.packHeight ?? "";
            document.getElementById("mixedFill").value = e.mixedFill ?? "";
        }
        if ((e.length || "").toLowerCase() === "gali") {
            isGaliMode = true;
            document.getElementById("length").disabled = true;
            document.getElementById("galiBtn").classList.add("active");
            document.getElementById("galiInputs").style.display = "block";
            document.getElementById("packWidth").value = e.packWidth;
            document.getElementById("packLength").value = e.packLength;
            document.getElementById("packHeight").value = e.packHeight;
            document.getElementById("avgLength").value = e.avgLength || "";
        } else {
            isGaliMode = false;
            document.getElementById("length").disabled = e.mode === "mixed";
            document.getElementById("galiBtn").classList.remove("active");
            document.getElementById("galiInputs").style.display = "none";
        }
    // ✅ poga pāriet labošanas režīmā 
            document.getElementById("addBtn").innerText =
                "💾 Saglabāt labojumu";
            document.getElementById("cancelEditBtn").style.display =
                "inline-block";
}
window.onload = () => {
    clearForm(false);
    document.getElementById("year").value = "";
    loadRecentUsers();
    const location = localStorage.getItem("location");
    const name = localStorage.getItem("userName");
    const savedData = localStorage.getItem("data");
    const backupRaw = localStorage.getItem("backupData");
    if (backupRaw) {
        try {
            const backup = JSON.parse(backupRaw);
            const age = Date.now() - new Date(backup.timestamp).getTime();
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (age > sevenDays) {
                localStorage.removeItem(
                    "backupData"
                );
            } else {
                document
                    .getElementById("restoreInfo")
                    .innerHTML = `
                        Ražotne: ${backup.location || ""}<br>
                        Lietotājs: ${backup.user || ""}<br><br>
                        📊 Inventarizācija<br>
                        Ieraksti: ${backup.summary?.entries || 0}<br>
                        Paletes: ${backup.summary?.packages || 0}<br>
                        m³: ${Number(backup.summary?.totalM3 || 0).toFixed(4)}<br><br>
                        Datums:<br> ${new Date(backup.timestamp).toLocaleString()} `;
                document
                    .getElementById("restoreModal")
                    .style.display = "block";
            }
        } catch (error) {
            console.warn("Bojāts lokālais backup:", error);
            localStorage.removeItem("backupData");
        }
    }
  // ✅ Komentāru izvēlne
      document.getElementById("thickness")
        .addEventListener("input", showSizeSuggestions);
      document.getElementById("thickness")
        .addEventListener("input", validateDimensionFields);
      document.getElementById("width")
        .addEventListener("input", validateDimensionFields);
      document.getElementById("width")
        .addEventListener("focus", () => {
  const container = document.getElementById("sizeSuggestions");
        container.innerHTML = "";
        container.style.display = "none";
      });
      document.getElementById("commentPreset")
        .addEventListener("change", 
    function() {
        if (this.value === "Cits") {
            document.getElementById("comment").focus();
        } else {
            document.getElementById("comment").value =
        this.value;
        }
    });
    const savedLibrary = localStorage.getItem("dimensionsLibrary");
    //✅ Dimensiju bibliotēkas ielāde
  if (savedLibrary) {
    dimensionsLibrary = JSON.parse(savedLibrary);
  }  
    //✅ Mēnesis - Gads
        document.getElementById("month")
            .addEventListener("input", updateYearFromMonth);
        document.getElementById("month")
            .addEventListener("change", updateYearFromMonth);;
    // ✅ Izvēlne
    const gradeBtn = document.getElementById("gradeBtn");
    const menu = document.querySelector(".menu");
    const gradeInput = document.getElementById("grade");
        gradeBtn.addEventListener("click", () => {
            menu.style.display = menu.style.display === "block"
                ? "none"
                : "block";
        });
        document.querySelectorAll(".menu .item")
            .forEach(item => {
                item.addEventListener("click", () => {
                gradeInput.value = item.dataset.value;
                gradeBtn.innerHTML = item.innerHTML + " ▼";
                menu.style.display = "none";
                });
            });
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".dropdown")) {
                menu.style.display = "none";
            }
        });
        document.addEventListener("click", event => {
            const wrapper = event.target.closest(".user-name-wrapper");
            const list = document.getElementById("recentUsersList");
                if (!wrapper && list) {list.style.display = "none";}
        });
    //✅ Login Pārbaude
        if (location && name) {
            currentLocation = location;
                document.getElementById("locationSelect")
                    .style.display = "none";
                document.getElementById("appContent")
                    .style.display = "block";
        setHeaderInfo();
        updateAreas();
        updateMaps();
        renderAreaPhotoPanel(null);
        checkBetaAccess();
        loadAITestScript();
        }
    //✅ LOAD DATA
        if (savedData) {
            try {
                data = JSON.parse(savedData);
                render();
            } catch (e) {
            console.warn("Neizdevās ielādēt datus", e);
            }
        }
    // ✅ Ja gads tukšs, ieliek aktuālo
        if (!document.getElementById("year").value) {
            document.getElementById("year").value = new Date().getFullYear();
        }
  // ✅ LIVE APRĒĶINS
    document.getElementById("avgLength").addEventListener("input", calculateGali);
    document.getElementById("packWidth").addEventListener("input", calculateGali);
    document.getElementById("packLength").addEventListener("input", calculateGali);
    document.getElementById("packHeight").addEventListener("input", calculateGali);
    document.getElementById("thickness").addEventListener("input", calculateGali);
    document.getElementById("width").addEventListener("input", calculateGali);
        const areaSelect = document.getElementById("area");
            if (areaSelect) {
                areaSelect.removeEventListener("change", handleAreaChange);
                areaSelect.addEventListener("change", handleAreaChange);
            }
            document.addEventListener("input", event => {
        const field = event.target;
            //✅  Šos laukus pārvalda validateDimensionFields()
            if (
                field.id === "thickness" ||
                field.id === "width"
                ) {
            return;
            }
                //✅  Citiem AI laukiem noņem brīdinājumu,
                //✅  kad lietotājs sāk ievadīt vērtību
            if (field.classList.contains("aiAttention")) {
                field.classList.remove("aiAttention");
                }
        });
    };

// ✅ ERROR
function error(msg, fieldId = null) {
    document.getElementById("error").innerText = msg;
        showNotice("⚠️ " + msg, "error", fieldId);
}
//✅  💾 DROŠI SAGLABĀ DARBA DATUS
function saveWorkingState() {
    try {
        localStorage.setItem(
            "data", JSON.stringify(data)
        );
        localStorage.setItem(
            "areaPhotos", JSON.stringify(areaPhotos)
        );
        return true;
    }
    catch (error) {
        console.error(
            "❌ Neizdevās saglabāt darba datus:",
            error
        );
        const message = error?.name === "QuotaExceededError"
                ? "❌ Nepietiek vietas pārlūka krātuvē."
                : "❌ Neizdevās saglabāt darba datus.";
        showNotice(
            message,
            "error"
        );
        return false;
    }
}
function checkBetaAccess() {
    const testMode = isTestMode();
    [
        "betaFeatures",
        "betaImportView",
        "aiLabelBtn",
        "betaAnalytics"
    ].forEach(id => {
        const el = document.getElementById(id);
            if (el) {
                el.style.display = testMode
                    ? "block"
                    : "none";
            }
    });    
}
function isTestMode() {
    const user = (localStorage.getItem("userName") || "")
        .trim()
        .toLowerCase();
    return user.endsWith(" test");
}
    //✅  📷 Foto palīgfunkcija
function hasAreaPhoto(area) {
    return !!(area && areaPhotos && areaPhotos[area]);
}
    //✅  Saglabā foto localStorage
function saveAreaPhotosStorage() {
    try {
        localStorage.setItem(
            "areaPhotos", JSON.stringify(areaPhotos));
        return true;
    } catch (error) {
        console.error("❌ Neizdevās saglabāt foto:", error);
        if (error && error.name === "QuotaExceededError") {
            showNotice(
                "❌ Nepietiek vietas pārlūka krātuvē. " +
                "Foto ir pārāk liels vai foto ir par daudz.",
                "error");
        } else {
            showNotice(
                "❌ Neizdevās saglabāt foto.",
                "error");
        }
        return false;
    }
}
    //✅  Atver foto izvēli konkrētam apgabalam
function chooseAreaPhoto(area) {
    if (!area) {
        showNotice(
            "⚠️ Nav izvēlēts apgabals!",
            "error");
        return;
    }
    const input = document.getElementById("areaPhotoInput");
        if (!input) {
            showNotice(
                "❌ Foto ievades lauks nav atrasts!",
                "error");
            console.error("❌ Nav #areaPhotoInput");
        return;
        }
        photoTargetArea = area;
        currentArea = area;
            //✅  Notīra iepriekšējo izvēli,
            //✅  lai var izvēlēties to pašu foto vēlreiz
        input.value = "";
        input.click();
}
    //✅  Dzēš apgabala foto
function deleteAreaPhoto(area) {
        if (!area) {
            return;
        }
        if (!hasAreaPhoto(area)) {
            showNotice(
                `ℹ️ Apgabalam ${area} nav foto.`,
                "info");
        return;
        }
    const confirmed = confirm(`Vai tiešām dzēst apgabala ${area} foto?`);
        if (!confirmed) {
            return;
        }
    delete areaPhotos[area];
        if (!saveAreaPhotosStorage()) {
            return;
        }
    dataChanged = true;
    saveBackup();
    renderAreaPhotoPanel(area);
    //✅  Ja ir importēšanas logs
        if (typeof renderImportAreas === "function" && importedBackup && importedAreaSummary) {
            renderImportAreas();
        }
        showNotice(
            `🗑️ Foto dzēsts apgabalam ${area}`,
            "success"
        );
}
    //✅  Atver foto apskatei
function viewAreaPhoto(area) {
        if (!area) {
            return;
        }
    const photo = areaPhotos[area];
        if (!photo) {
            showNotice(
                `ℹ️ Apgabalam ${area} nav foto.`,
                "info");
            return;
        }
    openImageFromSrc(photo);
}
    //✅  Atver importētā backup foto
function viewImportedAreaPhoto(area) {
        if (!importedBackup || !importedBackup.areaPhotos) {
            return;
        }
    const photo = importedBackup.areaPhotos[area];
        if (!photo) {
            showNotice(
                `ℹ️ Apgabalam ${area} nav foto.`,
                "info");
        return;
        }    
    openImageFromSrc(photo);
}
function clearError() {
    document.getElementById("error").innerText = "";
}
function clearForm(focus = true) {
    setMixedMode(false);
        for (const id of ["mixedLength", "mixedWidth", "mixedHeight", "mixedFill"]) {
            document.getElementById(id).value = "";
        }
        document.getElementById("packages").value = "";
        document.getElementById("thickness").value = "";
        document.getElementById("width").value = "";
        document.getElementById("length").value = "";
        document.getElementById("month").value = "";
        document.getElementById("year").value = "";
        document.getElementById("name").value = "";
        document.getElementById("productCode").value = "";
        document.getElementById("comment").value = "";
        document.getElementById("commentPreset").value = "";
        document.getElementById("pieces").value = "";
        document.getElementById("packWidth").value = "";
        document.getElementById("packLength").value = "";
        document.getElementById("packHeight").value = "";
        document.getElementById("avgLength").value = "";
        document.getElementById("galiInputs").style.display = "none";
        document.getElementById("sizeSuggestions").innerHTML = "";
        document.getElementById("sizeSuggestions").style.display = "none";
    const calcInfo = document.getElementById("calcInfo");
        if (calcInfo) {
            calcInfo.style.display = "none";
        }
        isGaliMode = false;
        document.getElementById("length").disabled = false;
        document.getElementById("galiBtn").classList.remove("active");
    const field = document.getElementById("packages");
        if (field && focus) {
    //✅  SVARĪGI:
    //✅  focus uzliek uzreiz, kamēr vēl darbojas
    //✅  lietotāja klikšķis uz "Pievienot"
        field.focus({preventScroll: true});
    //✅  Pārvieto vajadzīgajā vietā
    const y = field.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({
            top: y,
            behavior: "smooth"
        });
        }
}
    // ✅ TABULAS SLĒPŠANA
    let tableVisible = true;
function toggleTable() {
    const t = document.getElementById("table");
        tableVisible = !tableVisible;
        t.style.display = tableVisible ? "table" : "none";
}
function calculateGali() {
        console.log("GALI CALC");
    const thicknessVal = Number(document.getElementById("thickness").value);
    const widthVal = Number(document.getElementById("width").value);
    const packWidth = Number(document.getElementById("packWidth").value);
    const packLength = Number(document.getElementById("packLength").value);
    const packHeight = Number(document.getElementById("packHeight").value);
    const avgLength = Number(document.getElementById("avgLength").value);
        if (
            thicknessVal <= 0 || widthVal <= 0 ||
            packWidth <= 0 || packLength <= 0 || packHeight <= 0 ||
            avgLength <= 0
        ) return;
    let piecesAcrossWidth = Math.floor(packWidth / widthVal);
    let piecesAcrossHeight = Math.floor(packHeight / thicknessVal);
    let piecesFront = piecesAcrossWidth * piecesAcrossHeight;
    let columns = Math.floor(packLength / avgLength);
    // ✅ MAINĪJUMS ŠEIT
    let efficiency = 0.95;
    let piecesPerPack = Math.max( 1, Math.floor(piecesFront * columns * efficiency));
  // ✅ PARĀDA AR ≈
        document.getElementById("pieces").value = "≈ " + piecesPerPack;
        document.getElementById("calcInfo").style.display = "block";
}
    //✅ Border
function borderAll() {
    return {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
    };
}
    //✅ Color
function fillGray() {
    return {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }
    };
}
    //✅ Row style
function applyRowStyle(row, type) {
    let color;
        switch (type) {
            case "lightGreen":
                color = "FFC6EFCE";
                break;
            case "yellow":
                color = "FFFFEB9C";
                break;
            case "softGreen":
                color = "FFE2EFDA";
                break;
            case "blue":
                color = "FFBDD7EE";
                break;
            case "beige":
                color = "FFFCE4D6";
                break;
            default:
                color = "FFFFFFFF";
        }
    // ✅ palielina rindas augstumu (vizuāls "padding")
        row.height = 22;
        row.eachCell((cell, colNumber) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: color }
            };
            cell.border = borderAll();
    // ✅ centrē tekstu visur
            cell.alignment = {
                vertical: "middle",
                horizontal: colNumber === 2 ? "left" : "center",
                wrapText: true,
                indent: colNumber === 2 ? 1 : 0
            };
        });
}
  //✅ Export Excel
async function exportExcel() {
        if (data.length === 0) {
            return showNotice(
                "⚠️ Nav datu eksportam",
                "error"
            );
        }
    const location = localStorage.getItem("location") || "";
    const name = localStorage.getItem("userName") || "";
    const d = new Date();
    const safeLocation = safeFileName(location);
    const safeName = safeFileName(name);
    const dateStr =
        String(d.getDate()).padStart(2, "0") + "." +
        String(d.getMonth() + 1).padStart(2, "0") + "." +
        d.getFullYear();
    const fileDate =
        String(d.getDate()).padStart(2, "0") + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        d.getFullYear();
    const timeStr =
        String(d.getHours()).padStart(2, "0") +
        String(d.getMinutes()).padStart(2, "0") +
        String(d.getSeconds()).padStart(2, "0");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Inventarizācija");
    //✅ Title
        ws.mergeCells("A1:O1");
        ws.getCell("A1").value = "Nepabeigtas Ražošanas Inventarizācijas protokols";
        ws.getCell("A1").alignment = { horizontal: "center" };
        ws.getCell("A1").font = { bold: true, size: 14 };
        ws.addRow([]);
    //✅ Skaidrojumu bloks
function addLegendRow(values, color) {
    let row = ws.addRow(values);
        applyRowStyle(row, color);
    let r = row.number;
    // ✅ merge Skaidrojums (B → L)
        ws.mergeCells(`B${r}:L${r}`);
    // ✅ skaists alignment
        ws.getCell(`B${r}`).alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
            indent: 1
        };
}
    //✅ Header
    let legendHeader = ws.addRow([
        "Šķira", "Skaidrojums", "", "", "", "", "", "", "", "", "", "", "", "Apzīmējums"
        ]);
        legendHeader.eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = borderAll();
            cell.fill = fillGray();
        });
    //✅ Header merge
    let hr = legendHeader.number;
        ws.mergeCells(`B${hr}:L${hr}`);
    //✅ ROWS
    addLegendRow(["K kods", "Sakomplektēta produkcija", "", "", "", "", "", "", "", "", "", "", "", "K"], "lightGreen");
    addLegendRow(["Augstākā šķira", "Pilnībā gatava detaļa, pabeigtas visas operācijas, t.sk., impregnācija", "", "", "", "", "", "", "", "", "", "", "", "A"], "yellow");
    //✅ 1. šķira
        [
            ["1. šķira", "Ēvelēti dēļi", "1a"],
            ["", "Neēvelēti, bet sagarināti dēļi", "1b"],
            ["", "Ēvelētas sagarinātas sagataves", "1c"],
            ["", "Tālākā apstrādē esošas sagataves", "1d"]
        ].forEach(r => {
            addLegendRow([r[0], r[1], "", "", "", "", "", "", "", "", "", "", "", r[2]], "softGreen");
        });
    //✅ 2. šķira
        [
            ["2. šķira", "Sagataves, detaļas un gali, kurām pagaidām nav konkrēta pielietojuma", "2a"],
            ["", "Brāķis, kuram redzams pielietojums - varam izmantot tālākā apstrādē", "2b"],
            ["", "Brāķis, kuram nav pielietojums - iznīcināms", "2c"]
        ].forEach(r => {
            addLegendRow([r[0], r[1], "", "", "", "", "", "", "", "", "", "", "", r[2]], "blue");
        });
    //✅ Paletes
            addLegendRow(
                ["Paletes", "Paletes gatavai produkcijai", "", "", "", "", "", "", "", "", "", "", "", "PAL"], "beige");
        ws.addRow([]);
        ws.addRow([]);
    //✅ INFO
        ws.addRow([
            "Datums:", dateStr, "", "",
            "Sastādīja:", name, "", "",
            "Ražotne:", location
        ]);
        ws.addRow([]);
    //✅ TABULAS HEADER
    const headers = [
        "Apgabals",
        "Paku skaits",
        "Detaļas nosaukums",
        "Produkta kods",
        "m3 vienā pakā",
        "Biezums",
        "Platums",
        "Garums",
        "Detaļu skaits pakā",
        "m3 kopā",
        "Mēnesis",
        "Gads",
        "Šķira",
        "Komentārs",
        "",
        "m3 detaļas"
      ];
    const tableHeader = ws.addRow(headers);
        tableHeader.eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.border = borderAll();
            cell.fill = fillGray();
        });
    const startRow = tableHeader.number + 1;
    //✅ DATA
    let totalPackages = 0;
        data.forEach(e => {
        totalPackages += e.packages || 0;
    let pieceM3 = 0;
        if ((e.length || "").toLowerCase() === "gali") {
            pieceM3 = (e.thickness * e.width * e.avgLength) / 1000000000;
        } else {
            pieceM3 = (e.thickness * e.width * Number(e.length)) / 1000000000;
        }
    const rowIndex = ws.rowCount + 1;
    const row = ws.addRow([
        //✅  A — Apgabals
            e.area,
        //✅  B — Paku skaits
            e.packages,
        //✅  C — Detaļas nosaukums
            e.name,
        //✅  D — Produkta kods
            e.code,
        //✅  E — m3 vienā pakā
            e.mode === "mixed" || (e.length || "").toLowerCase() === "gali"
                ? e.m3Pack
                : { formula: `P${rowIndex}*I${rowIndex}` },
        //✅  F — Biezums
            e.mode === "mixed" ? "" : e.thickness,
        //✅  G — Platums
            e.mode === "mixed" ? "" : e.width,
        //✅  H — Garums
            e.mode === "mixed"
                ? ""
                : (e.length || "").toLowerCase() === "gali"
                    ? e.avgLength || ""
                    : Number(e.length),
        //✅  I — Detaļu skaits pakā
            e.mode === "mixed" ? "" : e.pieces,
        //✅  J — m3 kopā (Paku skaits × m3 vienā pakā)
            { formula: `B${rowIndex}*E${rowIndex}` },
        //✅  K — Mēnesis
            String(e.month).padStart(2, "0"),
        //✅  L — Gads
            e.year < 100 ? "20" + e.year : e.year,
        //✅  M — Šķira
            e.grade,
        //✅  N — Komentārs
            e.comment,
        //✅  O — Gali
            (e.length || "").toLowerCase() === "gali" ? "Gali" : "",
        //✅  P = m3 detaļas
            e.mode === "mixed"
                ? ""
                : { formula: `F${rowIndex}*G${rowIndex}*H${rowIndex}/1000000000` }
    ]);
        // 🔢 3 cipari aiz komata
            row.getCell(5).numFmt = '0.000';   // E
            row.getCell(10).numFmt = '0.000';  // J
            row.eachCell(cell => {
                cell.border = borderAll();
            });
        });
    const lastRow = ws.rowCount;
      //✅ SUM
        ws.addRow([]);
        ws.addRow(["Pakas kopā:", {
            formula: `SUM(B${startRow}:B${lastRow})`,
            result: totalPackages
            }
        ]);
    const totalM3Row = ws.addRow([
        "m3 kopā:", { formula: `SUM(J${startRow}:J${lastRow})` }
        ]);
        totalM3Row.getCell(2).numFmt = "0.000";
    //✅ COLUMN WIDTH
        [
            10, 12, 25, 20, 14,
            10, 10, 10,
            16, 10,
            10, 10,
            10, 25, 10, 12
        ].forEach((w, i) => {
            ws.getColumn(i + 1).width = w;
            });
    //✅ SAVE
    const buf = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buf]),
            `inv_${safeLocation}_${safeName}_${fileDate}_${timeStr}.xlsx`
            );
}
    // ✅ LOG OUT
function doLogout() {
    localStorage.removeItem("data");
    localStorage.removeItem("userName");
    localStorage.removeItem("location");
    localStorage.removeItem("areaPhotos");
    localStorage.removeItem("sessionStart");
    //✅  Veca GP atslēga — nekaitīgi iztīra,
    //✅  ja tā palikusi pēc testēšanas
    localStorage.removeItem("userProfile");
    data = [];
    areaPhotos = {};
    dataChanged = false;
    currentLocation = null;
    currentArea = null;
    previousArea = null;
    photoTargetArea = null;
    document.getElementById("userNameInput").value = "";
    document.getElementById("appContent")
        .style.display = "none";
    document.getElementById("confirmModal")
        .style.display = "none";
    document.getElementById("locationSelect")
        .style.display = "block";
    if (selectedBtn) {
        selectedBtn.classList.remove(
            "activeLocation"
        );
        selectedBtn = null;
    }
    renderAreaPhotoPanel(null);
    loadRecentUsers();
    render();
}
function endSession() {
    const sessionStart = Number(localStorage.getItem("sessionStart"));
    const durationMs = Date.now() - sessionStart;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (data.length === 0) {
        doLogout();
        return;
    }
    const totalPackages = data.reduce(
        (sum, entry) =>
            sum + (Number(entry.packages) || 0),
        0
    );
    const totalM3 = data.reduce(
        (sum, entry) =>
            sum + (Number(entry.total) || 0),
        0
    );
    document.getElementById("logoutSummary")
        .innerHTML = `
            Ražotne: ${localStorage.getItem("location") || ""}<br>
            Lietotājs: ${localStorage.getItem("userName") || ""}<br><br>
            📊 Inventarizācija pabeigta!<br><br>
            📦 Reģistrētas ${totalPackages} paletes.<br>
            🪵 Kopā reģistrēti
            ${totalM3.toFixed(4)} m³.<br>
            📝 Veikti ${data.length} ieraksti.<br><br>
            ⏱️ Reģistrācija aizņēma
            ${hours} h ${remainingMinutes} min.
        `;
    document.getElementById("confirmModal")
        .style.display = "block";
}
function closeConfirmModal() {
    const modal = document.getElementById("confirmModal");
        if (modal) {
            modal.style.display = "none";
            }
}
function saveAndExit() {
    if (dataChanged) {
        const backupSaved = saveBackup();
        if (!backupSaved) {
            showNotice(
                "❌ Backup neizdevās. Darbs netika pabeigts.",
                "error"
            );
            return;
        }
        const exported = exportBackupFile();
        if (!exported) {
            showNotice(
                "❌ Backup failu neizdevās izveidot. Darbs netika pabeigts.",
                "error"
            );
            return;
        }
        dataChanged = false;
        showNotice(
            "✅ Izveidota rezerves kopija",
            "success"
        );
    } else {
        showNotice(
            "ℹ️ Izmaiņu nav, rezerves kopija netika veidota",
            "info"
        );
    }
    closeConfirmModal();
    doLogout();
}
// ✅ BACKUP
function saveBackup() {
    const totalPackages = data.reduce(
            (sum, e) => sum + (Number(e.packages) || 0), 0);
    const totalM3 = data.reduce((sum, e) => 
            sum + (Number(e.total) || 0), 0);
    const now = new Date();
    const inventoryMonth = now.getMonth() + 1;
    const inventoryYear = now.getFullYear();
    const backup = {timestamp:
            now.toISOString(),
        user: localStorage.getItem("userName") || "",
        location: localStorage.getItem("location") || "",
        inventoryMonth,
        inventoryYear,
        inventoryPeriod: `${String(inventoryMonth)
                .padStart(2, "0")}.${inventoryYear}`,
        summary: {entries:
                    data.length,
                packages:
                    totalPackages,
                totalM3:
                    Number(totalM3.toFixed(4))},
        entries: data
    };
    try {
        localStorage.setItem(
            "backupData",
            JSON.stringify(backup)
        );
        //✅  Foto tiek glabāti tikai VIENĀ vietā
        localStorage.setItem(
            "areaPhotos",
            JSON.stringify(areaPhotos)
        );
        console.log("💾 Backup saglabāts");
        console.log("📷 Foto skaits:", Object.keys(areaPhotos).length);
        return true;
    }
    catch (error) {
        console.error("❌ Neizdevās saglabāt backup:", error);
        showNotice(error?.name === "QuotaExceededError"
                ? "❌ Nepietiek vietas rezerves kopijas saglabāšanai."
                : "❌ Neizdevās saglabāt rezerves kopiju.", "error"
                );
        return false;
    }
}
function closeRestoreModal() {
    document.getElementById("restoreModal")
        .style.display = "none";
}
function restoreBackup() {
    const backupText = localStorage.getItem("backupData");
    if (!backupText) {
        showNotice(
            "❌ Backup dati nav atrasti!",
            "error"
        );
        return;
    }
    let backup;
    try {
        backup = JSON.parse(backupText);
    } catch (error) {
        console.error(
            "Backup JSON kļūda:",
            error
        );
        showNotice(
            "❌ Backup fails nav derīgs!",
            "error"
        );
        return;
    }
    // Atjauno ierakstus
    data = Array.isArray(backup.entries)
            ? backup.entries
            : [];
    let storedPhotos = {};
        try {storedPhotos = JSON.parse(
            localStorage.getItem("areaPhotos") || "{}"
        );
}
catch (error) {
    storedPhotos = {};
}
areaPhotos = Object.keys(storedPhotos).length
        ? storedPhotos
        : (
            backup.areaPhotos &&
            typeof backup.areaPhotos === "object"
                ? { ...backup.areaPhotos }
                : {}
        );
if (!saveWorkingState()) {
    showNotice(
            "❌ Backup datus neizdevās atjaunot.",
            "error"
        );
    return;
}
    dataChanged = false;
    render();
    closeRestoreModal();
    showNotice(
        `✅ Atjaunoti ${data.length} ieraksti un ${
            Object.keys(areaPhotos).length
        } apgabalu foto.`,
        "success"
    );
    currentArea = null;
    previousArea = null;
    photoTargetArea = null;
    renderAreaPhotoPanel(null);
}
function discardBackup() {
  localStorage.removeItem("backupData");
      data = [];
  localStorage.removeItem("data");
    document.getElementById("backupFile").value = "";
    document.getElementById("backupInfo").textContent = "";
    document.getElementById("backupInfo").style.display = "none";
    localStorage.removeItem("areaPhotos");
        areaPhotos = {};
    renderAreaPhotoPanel(null);
  closeRestoreModal();
    document.getElementById("restoreModal")
  .style.display = "none";
    showNotice(
    "ℹ️ Sākta jauna inventarizācija",
    "info"
    );
}
function exportBackupFile() {
    try {
        const backupRaw = localStorage.getItem(
                "backupData");
        if (!backupRaw) {
            showNotice(
                "❌ Backup dati nav atrasti.",
                "error");
            return false;
        }
        const storedBackup =
            JSON.parse(backupRaw);
        // 📷 FOTO PIEVIENO TIKAI EKSPORTĒJAMAJAM FAILAM
        const exportBackup = {
            ...storedBackup,
            areaPhotos: {
                ...areaPhotos
            }
        };
        const location = safeFileName(exportBackup.location);
        const user = safeFileName(exportBackup.user);
        const d = new Date();
        const fileDate =
            String(d.getDate()).padStart(2, "0") + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            d.getFullYear();
        const timeStr =
            String(d.getHours()).padStart(2, "0") +
            String(d.getMinutes()).padStart(2, "0") +
            String(d.getSeconds()).padStart(2, "0");
        const blob = new Blob([
                    JSON.stringify(exportBackup,
                        null, 2)],
                {type: "application/json"}
            );
        saveAs(blob,
            `inv_${location}_${user}_${fileDate}_${timeStr}_backup.json`
        );
        return true;
    }
    catch (error) {
        console.error("❌ Backup eksporta kļūda:",
            error);
        showNotice("❌ Neizdevās izveidot backup failu.",
            "error");
        return false;
    }
}
function buildAreaSummary(entries) {
  const summary = {};
    entries.forEach(entry => {
  if (!summary[entry.area]) {
    summary[entry.area] = {
      entries: 0,
      packages: 0,
      totalM3: 0
      };
    }
    summary[entry.area].entries++;
    summary[entry.area].packages +=
      Number(entry.packages) || 0;
    summary[entry.area].totalM3 +=
      Number(entry.total) || 0;
    });
  return summary;
}
async function importBackupFile(event) {
    const files = Array.from(event?.target?.files || []);
    let importPhotos = true;
        if (files.length > 1) {
            importPhotos = confirm(
                "Importēt arī foto?\n\n" +
                "Foto palielina atmiņas patēriņu.\n" +
                "Ja veido kopēju backup no daudziem lietotājiem, ieteicams izvēlēties Nē."
                );
} else {
importPhotos = true;
}
    const backupInfo = document.getElementById("backupInfo");
    // ==========================================
    // 0. Ja faili nav izvēlēti
    // ==========================================
    if (files.length === 0) {
        backupInfo.style.display = "none";
        backupInfo.textContent = "";
        return;
    }
    backupInfo.textContent =
        `Pievienots ${files.length} Backup ${
            files.length === 1 ? "fails" : "faili"
        }`;
    backupInfo.style.display = "inline-block";
    try {
        // ==========================================
        // 1. Sagatavo mainīgos
        // ==========================================
        const backups = [];
        const uniqueEntries = [];
        const seen = new Set();
        let duplicates = 0;
        // ==========================================
        // 2. Nolasa VISUS izvēlētos backup failus
        // ==========================================
        for (const file of files) {
            let backup;
            try {
                const text = await file.text();
                backup = JSON.parse(text);
            } catch (error) {
                alert(
                    `Backup fails "${file.name}" nav derīgs JSON fails!`
                );
                return;
            }
            console.log(
                `Ielādētais backup "${file.name}":`,
                backup
            );
            // ==========================================
            // 2.1. Pārbauda backup struktūru
            // ==========================================
            if (!backup || typeof backup !== "object") {
                alert(
                    `Backup failā "${file.name}" nav derīgu datu!`
                );
                return;
            }
            if (!Array.isArray(backup.entries)) {
                alert(
                    `Backup failā "${file.name}" nav derīgu "entries" datu!`
                );
                return;
            }
            if (
                !backup.summary ||
                typeof backup.summary !== "object"
            ) {
                alert(
                    `Backup failā "${file.name}" nav derīgu "summary" datu!`
                );
                return;
            }
            // 2.2. Pievieno backup kopējam sarakstam
            backups.push(backup);
            // 2.3. Apvieno ierakstus un izņem dublikātus
            for (const entry of backup.entries) {
                if (!entry || typeof entry !== "object") {
                    continue;
                }
                const key = getEntryKey(entry);
                if (seen.has(key)) {
                    duplicates++;
                    continue;
                }
                seen.add(key);
                uniqueEntries.push(entry);
            }
        }
        // 3. Pārbauda, vai vispār ir backup
        if (backups.length === 0) {
            alert(
                "Nav atrasts neviens derīgs backup fails!"
            );
            return;
        }
        // 4. Nosaka aktīvo ražotni
        const currentLocation =
            localStorage.getItem("location");
        if (!currentLocation) {
            alert(
                "Nav iestatīta aktīvā ražotne!"
            );
            return;
        }
        // 5. Pārbauda, vai VISI backup ir
        //    no tās pašas ražotnes
        for (const backup of backups) {
            if (backup.location !== currentLocation) {
                alert(
                    `Nevar ielādēt backup!
Aktīvā ražotne: ${currentLocation}
Backup ražotne: ${
    backup.location || "Nav norādīta"
}`
                );
                return;
            }
        }
        // 6. Nosaka pašreizējo un iepriekšējo mēnesi
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const previousDate = new Date(
            currentYear,
            currentMonth - 2,
            1
        );
        const previousMonth = previousDate.getMonth() + 1;
        const previousYear = previousDate.getFullYear();
        // 7. Pārbauda katra backup datumu
        for (const backup of backups) {
            const backupMonth = Number(backup.inventoryMonth);
            const backupYear = Number(backup.inventoryYear);
            const validCurrent = backupMonth === currentMonth &&
                backupYear === currentYear;
            const validPrevious = backupMonth === previousMonth &&
                backupYear === previousYear;
            if (!validCurrent && !validPrevious) {
                alert(
                    `Backup no lietotāja "${
                        backup.user || "Nezināms"
                    }" ir pārāk vecs un to nevar ielādēt.
                Backup periods: ${backup.inventoryPeriod ||
                    `${backupMonth}.${backupYear}`}
                Atļauts: ${currentMonth}.${currentYear}
                    vai ${previousMonth}.${previousYear}`
                );
                return;
            }
        }
        // ==========================================
        // 8. Apvieno lietotājus
        // ==========================================
        const users = [
            ...new Set(
                backups
                    .map(backup => backup.user)
                    .filter(Boolean)
            )
        ];
        const combinedUser = users.length === 0
                ? "Nav norādīts"
                : users.length === 1
                    ? users[0]
                    : users.join(", ");
        // ==========================================
        // 9. Izveido KOPĒJO summary
        // ==========================================
        const combinedSummary = {
            entries:
                uniqueEntries.length,
            packages:
                uniqueEntries.reduce(
                    (sum, e) =>
                        sum + Number(e.packages || 0),
                    0
                ),
            totalM3:
                uniqueEntries.reduce(
                    (sum, e) =>
                        sum + Number(e.total || 0),
                    0
                )
        };
        // ======================================================
        // 📷 APVIENO VISU BACKUP FAILU APGABALU FOTO
        // ======================================================
      const combinedAreaPhotos = {};
        if (importPhotos) {
            backups.forEach(backup => {
                if (
                  backup.areaPhotos &&
                typeof backup.areaPhotos === "object"
                ) {
                    Object.assign(
                    combinedAreaPhotos,
                    backup.areaPhotos
                );
              }
            });
        }
        // ==========================================
        // 10. Izveido vienotu importedBackup objektu
        // ==========================================
        importedBackup = {
            ...backups[0],
            duplicates,
            user: combinedUser,
            entries: uniqueEntries,
            summary: combinedSummary,
            inventoryMonth:
                backups[0].inventoryMonth,
            inventoryYear:
                backups[0].inventoryYear,
            inventoryPeriod:
                backups[0].inventoryPeriod,
            areaPhotos:
                combinedAreaPhotos
            };
        // ==========================================
        // 11. Debug informācija
        // ==========================================
        console.log(
            "Apvienotais backup:",
            importedBackup
        );
        console.log(
            "Backup faili:",
            backups.length
        );
        console.log(
            "Unikālie ieraksti:",
            uniqueEntries.length
        );
        console.log(
            "Dublikāti:",
            duplicates
        );
        // ==========================================
        // 12. Izveido apgabalu kopsavilkumu
        //     tikai no unikālajiem ierakstiem
        // ==========================================
        const areaSummary = buildAreaSummary(uniqueEntries);
        importedAreaSummary = areaSummary;
        console.log("Apgabalu kopsavilkums:",
            areaSummary);
        // 13. Parāda informāciju import logā
        const importInfo = document.getElementById("importInfo");
            importInfo.innerHTML = `
                Ražotne: ${currentLocation}<br>
                Lietotājs: ${combinedUser}<br>
                Backup faili: ${backups.length}<br>
                Dublikāti: ${duplicates}<br>
                📷 Foto: ${importPhotos ? "Importēti" : "Izlaisti"}<br><br>
                📊 Inventarizācija<br>
                Ieraksti: ${combinedSummary.entries}<br>
                Paletes: ${combinedSummary.packages}<br>
                m³: ${Number(
                combinedSummary.totalM3.toFixed(4)
            )}
        `;
        // ==========================================
        // 14. Atver import modal
        // ==========================================
        const importModal = document.getElementById("importModal");
            importModal.style.display = "block";
        // 15. Parāda apgabalu sarakstu       
        expandedArea = null;
        expandedAreaEntries = null;
        expandedSize = null;
        renderImportAreas();
    } catch (error) {
        console.error(
            "Backup importēšanas kļūda:",
            error
        );
        showNotice(
            "⚠️ Nederīgs backup fails",
            "error"
        );
    }
}
function renderImportAreas() {
    const areaList = document.getElementById("areaList");
    if (
        !areaList ||
        !importedAreaSummary ||
        !importedBackup ||
        !Array.isArray(importedBackup.entries)
    ) {
        if (areaList) {
            areaList.innerHTML = "";
        }
        return;
    }
    let areaHtml = "";
    Object.entries(importedAreaSummary)
        .sort(([a], [b]) =>
            a.localeCompare(
                b,
                undefined,
                { numeric: true }
            )
        )
        .forEach(([area, info]) => {
            // ==========================================
            // APGABALA IERAKSTI
            // ==========================================
            const areaEntries = importedBackup.entries.filter(
                    entry =>
                        entry.area === area
                );
            // ==========================================
            // GRUPĒ PĒC BIEZUMA × PLATUMA
            // ==========================================
            const sizeGroups = {};
            areaEntries.forEach(entry => {
                const thickness = entry.thickness ?? "";
                const width = entry.width ?? "";
                const size = entry.mode === "mixed"
                        ? "Dažādi"
                        : `${thickness}×${width}`;
                    if (!sizeGroups[size]) {
                        sizeGroups[size] = [];
                    }
                    sizeGroups[size].push(entry);
            });
            const areaOpen = expandedArea === area;
            const entriesOpen = expandedAreaEntries === area;
            //✅  📷 APGABALA FOTO
            const photo =
                importedBackup.areaPhotos &&
                importedBackup.areaPhotos[area]
                    ? importedBackup.areaPhotos[area]
                    : null;
            //✅  APGABALA BLOKS
            areaHtml += `
                <div class="areaBlock">
                    <label class="areaHeader">
                        <input
                            type="checkbox"
                            value="${area}">
                        <strong onclick="toggleArea('${area}')">
                            ${areaOpen ? "▼" : "▶"}
                            ${area}
                        </strong>
                    </label>
            `;
            //✅  JA APGABALS IR ATVĒRTS
            if (areaOpen) {
                areaHtml += `
                    <div class="areaDetails">
                        <div class="areaEntriesHeader"
                            onclick="toggleAreaEntries('${area}')">
                                📄 ${info.entries} ieraksti
                                ${entriesOpen ? "▼" : "▶"}
                        </div> `;
                areaHtml += `
                        <div class="areaTotals">
                            📦 ${Number(info.packages || 0)
                                  .toLocaleString("lv-LV")} paletes<br>
                            🪵 ${Number(info.totalM3).toFixed(4)} m³
                        </div> `;
                if (photo) {
                    areaHtml += `
                        <div class="areaPhotoContainer">
                            <button
                                type="button"
                                onclick="viewImportedAreaPhoto('${area}')">
                                📷 Skatīt foto
                            </button>
                        </div>
                    `;
                } else {
                    areaHtml += `
                        <div class="areaPhotoMissing">
                                📷 Foto nav pievienots
                        </div>
                    `;
                }       
                //✅  IERAKSTI ATVĒRTI
                if (entriesOpen) {
                    Object.entries(sizeGroups)
                        .sort(([a], [b]) => a.localeCompare(b, undefined, {numeric:true}))
                        .forEach(
                            ([size, entries]) => {
                                const sizeKey = `${area}_${size}`;
                                const sizeOpen = expandedSize === sizeKey;
                                //✅  IZMĒRS
                                areaHtml += `
                                    <div class="areaSize"
                                        onclick=" toggleSize('${area}', '${size}')">
                                            ${sizeOpen ? "▼" : "▶"}
                                            ${size}
                                    </div>
                                `;
                                //✅  KONKRĒTIE IERAKSTI
                                if (sizeOpen) {entries.forEach(entry => {
                                                let sizeText;
                                                    if (entry.mode === "mixed") {
                                                        sizeText =
                                                            `Dažādi — ${entry.packLength}×${entry.packWidth}` +
                                                            `×${entry.packHeight} mm (${entry.mixedFill}%)`;
                                                    } else {
                                                const lengthText =
                                                        String(entry.length ?? "").trim().toLowerCase() === "gali"
                                                            ? (entry.avgLength ? `≈${entry.avgLength}` : "Gali")
                                                            : (entry.length ?? "");
                                                        sizeText =
                                                            `${entry.thickness}×${entry.width}×${lengthText}`;
                                                    }
                                                    const packages = Number(entry.packages) || 0;
                                            areaHtml += `
                                                <div class="areaEntry">
                                                    ${sizeText} | ${entry.grade || "-"} | ${packages} pal.
                                                </div>
                                            `;
                                        }
                                    );
                                }
                            }
                        );
                }
              areaHtml += `
                </div>
                `;
            }
            areaHtml += `
                </div>
            `;
        });
    //✅ Ja nav apgabalu
    if (!areaHtml) {
        areaHtml = `
            <p>
                Nav atrasti apgabali
                ar derīgiem ierakstiem.
            </p>
        `;
    }
    areaList.innerHTML = areaHtml;
} 
function getEntryKey(e) {
    return JSON.stringify([
        e.area,
        e.packages,
        e.thickness,
        e.width,
        e.length,
        e.avgLength,
        e.packWidth,
        e.packLength,
        e.packHeight,
        e.mode,
        e.mixedFill,
        e.month,
        e.year,
        e.pieces,
        e.name,
        e.code,
        e.grade,
        e.comment,
        e.total,
        e.m3Pack
    ]);
}
function closeImportModal() {
    document.getElementById("importModal")
        .style.display = "none";
}
function openBackupFile() {
    const fileInput = document.getElementById("backupFile");
        fileInput.value = "";
    const backupInfo = document.getElementById("backupInfo");
        backupInfo.style.display = "none";
        backupInfo.textContent = "";
        fileInput.click();
}
function restoreImportedBackup() {
    if (
        !importedBackup || !Array.isArray(importedBackup.entries)
    ) {
        showNotice(
            "❌ Nav pieejami importētie backup dati!",
            "error"
        );
        return;
    }
// ==============================================
// ⚠️ DROŠĪBAS APSTIPRINĀJUMS
// ==============================================
if (data.length > 0) {
    const confirmed = confirm(
        "⚠️ Darba režīmā jau ir ievadīti dati.\n\n" +
        `Pašlaik: ${data.length} ieraksti.\n\n` +
        "Atjaunojot VISU backup, pašreizējie dati tiks aizvietoti.\n\n" +
        "Vai tiešām turpināt?"
    );
    if (!confirmed) {
        return;
    }
}
    // ==============================================
    // 📝 ATJAUNO IERAKSTUS
    // ==============================================
    data = [...importedBackup.entries];
    // ==============================================
    // 📷 ATJAUNO VISUS APGABALU FOTO
    // ==============================================
    areaPhotos = importedBackup.areaPhotos &&
        typeof importedBackup.areaPhotos === "object"
            ? {
                ...importedBackup.areaPhotos
            }
            : {};
   if (!saveWorkingState()) {
    showNotice(
        "❌ Importētos datus neizdevās saglabāt.",
        "error"
    );
    return;
}
    dataChanged = true;
    //✅ Notīra backup input
    const backupFile = document.getElementById("backupFile");
        if (backupFile) {
            backupFile.value = "";
        }
    const backupInfo = document.getElementById("backupInfo");
        if (backupInfo) {
            backupInfo.textContent = "";
            backupInfo.style.display = "none";
        }
    //✅ Pārzīmē App
    render();
    //✅ Izveido jauno lokālo backup
    saveBackup();
    closeImportModal();
    //✅ PAZIŅOJUMS
    showNotice(
        `✅ Atjaunoti ${data.length} ieraksti.
        📷 Atjaunoti ${
            Object.keys(areaPhotos).length
        } apgabalu foto.
        Izlaisti ${
            importedBackup.duplicates || 0
        } dublikāti.`,
        "success"
    );
}
function restoreSelectedAreas() {
    if (!importedBackup || !Array.isArray(importedBackup.entries))
        {showNotice("❌ Nav pieejami importētie backup dati!", "error");
        return;
    }
    //✅ Izvēlētie Apgabali
    const selectedAreas = [
        ...document.querySelectorAll(
            "#areaList input:checked"
            )
        ].map(cb => cb.value);
        if (!selectedAreas.length) {
            showNotice("⚠️ Izvēlies vismaz vienu apgabalu!", "error");
        return;
    }
    //✅ Izvēlētie ieraksti
    const selectedData = importedBackup.entries.filter(e => selectedAreas.includes(e.area));
    // Esošo ierakstu atslēgas
    const existingKeys = new Set(
            data.map(getEntryKey)
        );
    //✅ Atlasa tikai jaunos ierakstus
    const newEntries = selectedData.filter(e => {
            const key = getEntryKey(e);
                if (existingKeys.has(key)) {
                return false;
            }
            existingKeys.add(key);
            return true;
        });
    // 📷 ATJAUNO IZVĒLĒTO APGABALU FOTO
    let photosAdded = 0;
        selectedAreas.forEach(area => {
        const photo = importedBackup.areaPhotos && importedBackup.areaPhotos[area];
            if (photo) {
                areaPhotos[area] = photo;
                photosAdded++;
                }
        });
    //✅ Pievieno jaunos ierakstus
    if (newEntries.length) {
        data.push(
            ...newEntries
        );
    }
    // Ja nebija ne ierakstu, ne foto
    if (
        !newEntries.length &&
        !photosAdded
    ) {
        showNotice(
            "ℹ️ Izvēlētie dati un foto jau atrodas darba režīmā. Nekas netika pievienots.",
            "info"
        );
        closeImportModal();
        return;
    }
    // 💾 Saglabā
    if (!saveWorkingState()) {
    showNotice(
        "❌ Izvēlētos datus neizdevās saglabāt.",
        "error"
    );
    return;
}
    dataChanged = true;
    //✅ Pārzīmē
    render();
    //✅ Izveido backup ar jaunajiem datiem + foto
    saveBackup();
    closeImportModal();
    //✅ Paziņojums
    showNotice(
        `✅ Pievienoti ${newEntries.length} jauni ieraksti no: ${selectedAreas.join(", ")}.
        📷 Atjaunoti ${photosAdded} apgabalu foto.`,
        "success"
    );
}
// 🤖 IELĀDĒ AI TESTA KODU TIKAI TEST LIETOTĀJIEM
function loadAITestScript() {
    if (!isTestMode()) {
        return;
    }
    if (document.querySelector(
            'script[data-ai-test="true"]')
        ) {
        return;
        }
    const script = document.createElement("script");
    script.src = "/Inventory-app/ai-test.js";
    script.dataset.aiTest = "true";
    script.onload = () => {
        console.log( "🤖 AI testa modulis ielādēts"
        );
         const aiBtn = document.getElementById("aiLabelBtn");
        if (aiBtn) {
            aiBtn.style.display = "block";
        }
    };
    script.onerror = () => {
        console.error("❌ AI testa moduli neizdevās ielādēt"
        );
        showNotice("⚠️ AI testa funkcija pašlaik nav pieejama.",
            "error");
    };
    document.body.appendChild(script);
}
//✅ SERVICE WORKER
if ("serviceWorker" in navigator) {
    let refreshing = false;
        navigator.serviceWorker
            .register("/Inventory-app/sw.js")
            .then(async reg => {
                console.log("SW registered");
                    showNotice(
                        "🔄 Pārbauda un ielādē jaunāko pieejamo versiju...",
                        "info"
                    );
                await reg.update();
            })
            .catch(err =>
                console.log("SW error", err)
                );
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (refreshing) return;
                    refreshing = true;
                console.log(
                    "✅ Jaunā versija palaista"
                );
            window.location.reload();
        }
    );
}
