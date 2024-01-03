var danetemp = [];
var iloscdanych = 0;
var lekcjazastepstwa = {};
var errornow = false;
var nicknamesstate = false;
const selectElement = document.getElementById("day");

function deleteRow(row) {
    document.getElementById('Tabela').deleteRow(row);
}

function createRow(cells, strikeout = "") {
    var x = document.getElementById('Tabela');
    var len = x.rows.length;
    row = x.insertRow(len);

    for (var i = 0; i < cells.length; i++) {
        var cell = row.insertCell(i);
        cell.id = len + String.fromCharCode(65 + i);
        cell.className = getClassName(i);
        cell.innerHTML = cells[i];
    }

    if (strikeout !== "") {
        row.className = "strikeout" + (strikeout === "all" ? "all" : "");
    }
}

function getClassName(index) {
    switch (index) {
        case 0:
            return "sala";
        case 1:
            return "lekcje";
        case 2:
            return "klasa";
        case 3:
            return "inne";
        default:
            return "";
    }
}

function createRowNormal(numer = 0, lekcja = "TEST", nauczyciel = "SYSTEMU", uwagi = "-", strikeout = "") {
    var cells = [numer, lekcja, nauczyciel, uwagi];
    createRow(cells, strikeout);
}

function createRowInfo(uwaga = true, tresc = 'TEST SYSTEMU - Informacje mogą być nieprawidłowe!') {
    var x = document.getElementById('Tabela');
    var len = x.rows.length;
    row = x.insertRow(len);

    var uwagatext = (uwaga ? '<b>UWAGA:</b> ' : '');
    row.innerHTML = `<td colspan="4" class="tekst przewijak">${uwagatext}${tresc}</td>`;
}

function formatLesson(lesson) {
    var sformatowanaLista = [];

    lesson.split(/\n/).forEach((element) => {
        element = element.trim();
        if (element.startsWith("- ")) {
            element = element.replace("- ", "");
        } else if (element.startsWith("-")) {
            element = element.replace("-", "");
        }

        if (element.match(/s\./)) {
            element.split(/s\./).forEach(el => {
                if (el.trim().match(/\!s/)) {
                    el.split(/\!s/).forEach(subEl => {
                        sformatowanaLista.push(subEl.trim());
                    });
                }
                sformatowanaLista.push(el.trim());
            });
        } else if (element.match(/\!s/)) {
            element.split(/\!s/).forEach(el => {
                sformatowanaLista.push(el.trim());
            });
        } else {
            sformatowanaLista.push(element.trim());
        }
    });

    return sformatowanaLista;
}

function handleReceivedData(dayt) {
    console.log("Dane odebrane z dnia: " + dayt);
    let ostatnialekcjanr = 0;

    danetemp.forEach(function (row, index) {
        var strikeouted = "";
        var day = dayt;

        if (row[2 + day] === "puste") {
            day = day + 1;
        }

        var zastepstwo = false;
        var formatedlesson = formatLesson(row[2 + day]);

        if (formatedlesson[0] === "odwołane") {
            formatedlesson.splice(0, 1);
            strikeouted = "lesson";
            if (formatLesson(row[3 + day])[1] === "przesunięcie") {
                lekcjazastepstwa[day] = formatLesson(row[3 + day])[1];
                row[3 + day] = "puste";
            }
        } else if (formatedlesson[0] === "zastępstwo") {
            formatedlesson.splice(0, 1);
            zastepstwo = true;
            if (formatLesson(row[3 + day])[0] === "odwołane") {
                lekcjazastepstwa[day] = formatLesson(row[3 + day])[1];
                row[3 + day] = "puste";
            }
        } else if (formatedlesson[0] === "przesunięcie") {
            formatedlesson.splice(0, 1);
            strikeouted = "lesson";
        } else if (formatedlesson[0] === "dzień wolny szkoły") {
            formatedlesson.splice(0, 1);
            strikeouted = "all";
        } else if (formatedlesson[0] !== "") {
            ostatnialekcjanr = row[1];
        }

        if (formatedlesson[2] === "") {
            formatedlesson[2] = "-";
        }

        if (formatedlesson[0] !== "") {
            createRowNormal(row[1], formatedlesson[0], formatedlesson[1], formatedlesson[2], strikeouted);
        }

        if (zastepstwo) {
            var zastepstwoText = lekcjazastepstwa[day] ? "Zastępstwo z lekcji: " + lekcjazastepstwa[day] : "Zastępstwo";
            createRowInfo(true, zastepstwoText);
        }
    });

    if (ostatnialekcjanr === 0) {
        createRowInfo(true, "Dzień wolny od lekcji");
        ostatnialekcjanr = "🎉 BRAK";
    }

    createRowInfo(false, "Dzień: " + getDayText(dayt) + " | " + ostatnialekcjanr + " lekcji | Plan z dnia: " + jakiplan);
    document.title = "Plan Lekcji: " + getDayText(dayt);
}

function getDayText(dayt) {
    switch (dayt) {
        case 0:
            return 'Poniedziałek';
        case 1:
            return 'Wtorek';
        case 2:
            return 'Środa';
        case 3:
            return 'Czwartek';
        case 4:
            return 'Piątek';
    }
}

var urlParams = new URLSearchParams(window.location.search);
var jakiplan = decodeURIComponent(urlParams.get('jakiplan'));

if (jakiplan !== "null" && jakiplan !== "") {
    GetTimetable();
} else {
    GetTimetable();
}

async function GetTimetable() {
    const listResponse = await fetch('./planylekcji/lista.json');

    if (!listResponse.ok) {
        handleErrorResponse();
        return;
    }

    try {
        const listData = await listResponse.json();
        let plikaktualny = 0;

        // Sprawdź, w pętli czy pierwszy plan jest Arrayem
        for (const plan of listData) {
            if (Array.isArray(plan)) {
                if (plan[0] === jakiplan) {
                    break;
                } else {
                    plikaktualny++;
                }
            }
        }

        if (jakiplan === "nowy") {
            jakiplan = listData[0][0];
            urlParams.set('jakiplan', jakiplan);
            window.location.search = urlParams;
            return;
        }

        // Sprawdź, czy jakiplan znajduje się na liście, jeśli nie to użyj pierwszego pliku
        let selectedPlan = listData.includes(jakiplan) ? jakiplan : listData[plikaktualny];

        if (Array.isArray(selectedPlan)) {
            selectedPlan = selectedPlan[0];
        }

        // Jeśli jakiplan nie był na liście, zmień parametr w URL
        if (jakiplan !== selectedPlan) {
            urlParams.set('jakiplan', selectedPlan);
            window.location.search = urlParams;
        }

        const timetableResponse = await fetch(`./planylekcji/${selectedPlan}.json`);
        if (!timetableResponse.ok) {
            handleErrorResponse();
            return;
        }

        const timetableData = await timetableResponse.json();
        danetemp = timetableData;

        var dizin = decodeURIComponent(urlParams.get('dzien'));

        if (!dizin || dizin === "null" || dizin === "") {
            dizin = 0;
            urlParams.set('dzien', "0");
            window.location.search = urlParams;
        } else if (dizin > 5) {
            dizin = 0;
            urlParams.set('dzien', "0");
            window.location.search = urlParams;
        } else {
            selectElement.value = dizin;
        }

        handleReceivedData(parseInt(dizin));
    } catch (e) {
        console.error("Coś poszło nie tak: " + e.message);
        createRowInfo(true, "WYSTĄPIŁ BŁĄD! - Przepraszamy za utrudnienia!");
        errornow = true;
        return;
    }
}


function handleErrorResponse() {
    console.error("Nie udało się pobrać danych z serwera");
    createRowInfo(true, "ZŁY LINK! - Przepraszamy za utrudnienia!");
    errornow = true;
}

selectElement.addEventListener("change", function () {
    const selectedOption = parseInt(selectElement.options[selectElement.selectedIndex].value);
    var x = document.getElementById('Tabela').childElementCount - 1;

    while (x >= 0) {
        deleteRow(x);
        x = x - 1;
    }

    if (errornow) {
        createRowInfo(true, "WYSTĄPIŁ BŁĄD! - Przepraszamy za utrudnienia!");
        return;
    }

    handleReceivedData(selectedOption);
    nicknames(nicknamesstate);
});

function nicknameschange() {
    console.log("Nicknames changed");
    var nicknamebutton = document.getElementById("nickname");

    if (nicknamebutton.innerHTML === "Imię i Nazwisko") {
        nicknamebutton.innerHTML = "Przezwiska";
        nicknames(false);
        nicknamesstate = false;
    } else {
        nicknamebutton.innerHTML = "Imię i Nazwisko";
        nicknames(true);
        nicknamesstate = true;
    }
}

async function nicknames(change) {
    const response = await fetch(`./inne/przezwiska.json`);

    if (!response.ok) {
        console.error("Nie udało się pobrać danych z serwera przezwisk");
    }

    przeswiska = await response.json();

    var rows = document.getElementById("Tabela").getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var cell = row.getElementsByTagName("td")[2];
        if (cell === undefined) {
            continue;
        }

        for (var j = 0; j < Object.keys(przeswiska).length; j++) {
            if (cell.innerHTML.replace(/&nbsp;/g, ' ') === (change ? Object.keys(przeswiska)[j] : Object.values(przeswiska)[j])) {
                cell.innerHTML = (change ? Object.values(przeswiska)[j] : Object.keys(przeswiska)[j]);
                break;
            }
        }
    }
}