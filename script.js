var danetemp = [];
var iloscdanych = 0;
var lekcjazastepstwa = {};

function deleteRow(row) {
    document.getElementById('Tabela').deleteRow(row);
}

function createRowNormal(numer = 0, lekcja = "TEST", nauczyciel = "SYSTEMU", uwagi = "-", strikeout = "") {
    var x = document.getElementById('Tabela');
    var len = x.rows.length;
    // deep clone the targeted row
    row = x.insertRow(len)
    row.innerHTML =
        `<td id="${len}S" class="sala">${numer}</td>
        <td id="${len}L" class="lekcje">${lekcja}</td>
        <td id="${len}K" class="klasa">${nauczyciel}</td>
        <td id="${len}I" class="inne">${uwagi}</td>`;
    if (strikeout === "lesson") {
        row.setAttribute("class", "strikeout")
    } else if (strikeout === "all") {
        row.setAttribute("class", "strikeoutall")
    }
}

function createRowInfo(uwaga = true, tresc = 'TEST SYSTEMU - Informacje mogą być nie prawidłowe!') {
    var x = document.getElementById('Tabela');
    var len = x.rows.length;
    // deep clone the targeted row
    row = x.insertRow(len)
    if (uwaga == true) {
        var uwagatext = '<b>UWAGA:</b> '
    }
    else {
        var uwagatext = ''
    }
    row.innerHTML =
        `<td colspan="4" class="przewijak"><div class="tekst">
        ${uwagatext}${tresc}
        </div></td>`;

    const przewijak = document.querySelectorAll('.przewijak');

    //przewijak.forEach(function (self) {
    //    var kontenerSzerokosc = self.offsetWidth;
    //    var text = self.querySelector('.tekst');
    //    var tekstSzerokosc = text.scrollWidth;
    //    var animacjaCzas = (tekstSzerokosc / kontenerSzerokosc) * 15; // 10s to początkowy czas trwania
    //    text.style.animation = `przewijanie ${animacjaCzas}s linear infinite`;
    //})
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
    console.log("Dane odebrane z dnia: " + dayt)
    data = danetemp
    var strikeouted = "";
    var strikeoutedtemp = "";

    // Zakłada, że dane są przesłane jako tablica obiektów
    data.forEach(function (row, index) {
        strikeouted = "";
        day = dayt
        if (row[2 + day] === "puste") {
            day = day + 1;
        }

        // Iteruj przez komórki w danym wierszu (każda komórka zawiera lekcję)

        var zastepstwo = false;
        var formatedlesson = formatLesson(row[2 + day]);

        if (formatedlesson[0] === "odwołane") {
            formatedlesson.splice(0, 1);
            strikeouted = "lesson";
        } else if (formatedlesson[0] === "zastępstwo") {
            formatedlesson.splice(0, 1);
            zastepstwo = true;
            if (formatLesson(row[3 + day])[0] === "odwołane") {
                lekcjazastepstwa[day] = formatLesson(row[3 + day])[1]
                row[3 + day] = "puste";
            }
        } else if (formatedlesson[0] === "przesunięcie") {
            formatedlesson.splice(0, 1);
            strikeouted = "lesson";
        } else if (formatedlesson[0] === "dzień wolny szkoły") {
            formatedlesson.splice(0, 1);
            strikeouted = "all";
            strikeoutedtemp = strikeouted;
        }

        if (formatedlesson[2] === "") {
            formatedlesson[2] = "-"
        }

        if (formatedlesson[0] != "") {
            createRowNormal(row[1], formatedlesson[0], formatedlesson[1], formatedlesson[2], strikeouted);
        }

        if (zastepstwo) {
            if (lekcjazastepstwa[day]) {
                createRowInfo(true, "Zastępstwo z lekcji: " + lekcjazastepstwa[day]);
            } else {
                createRowInfo(true, "Zastępstwo");
            }
        }
    });
    if (strikeoutedtemp === "all") {
        createRowInfo(true, "Dzień wolny od lekcji")
    }

    switch (dayt) {
        case 0:
            daytext = 'Poniedziałek';
            break;
        case 1:
            daytext = 'Wtorek';
            break;
        case 2:
            daytext = 'Środa';
            break;
        case 3:
            daytext = 'Czwartek';
            break;
        case 4:
            daytext = 'Piątek';
            break;
    }
    createRowInfo(false, "Dane pobrane z dnia: " + daytext);
    document.title = ("Plan Lekcji: " + daytext)
}

var urlParams = new URLSearchParams(window.location.search);
var jakiplan = decodeURIComponent(urlParams.get('jakiplan'));

if (jakiplan != "null" && jakiplan != "") {
    GetTimetable(jakiplan)
} else {
    GetTimetable("aktualny")
    urlParams.set('jakiplan', "aktualny");
    window.location.search = urlParams
}

async function GetTimetable(plik) {
    const response = await fetch(`./planylekcji/${plik}.json`);

    try {
        const datas = await response.json();
        danetemp = datas;
        handleReceivedData(0)
    } catch (e) {
        console.error("Coś poszło nie tak: " + e.message);
        createRowInfo(true, "WYSTĄPIŁ BŁĄD! - Przepraszamy za utrudnienia!")
    }
}

const selectElement = document.getElementById("day");

// Add an event listener for the change event
selectElement.addEventListener("change", function () {
    const selectedOption = parseInt(selectElement.options[selectElement.selectedIndex].value);
    var x = document.getElementById('Tabela').childElementCount - 1;
    while (x >= 0) {
        deleteRow(x)
        x = x - 1
    }
    handleReceivedData(selectedOption)
});
