var danetemp = []
var iloscdanych = 0

function deleteRow(row) {
    document.getElementById('Tabela').deleteRow(row);
}

function createRowNormal(numer = 0, lekcja = "TEST", nauczyciel = "SYSTEMU", uwagi = "-", strikeout = false) {
    var x = document.getElementById('Tabela');
    var len = x.rows.length;
    // deep clone the targeted row
    row = x.insertRow(len)
    row.innerHTML =
        `<td id="${len}S" class="sala">${numer}</td>
        <td id="${len}L" class="lekcje">${lekcja}</td>
        <td id="${len}K" class="klasa">${nauczyciel}</td>
        <td id="${len}I" class="inne">${uwagi}</td>`;
    if (strikeout) {
        row.setAttribute("class", "strikeout")
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

function handleReceivedData(day) {
    console.log("Dane odebrane z dnia: " + day)
    data = danetemp

    // Zakłada, że dane są przesłane jako tablica obiektów
    data.forEach(function (row, index) {
        // Iteruj przez komórki w danym wierszu (każda komórka zawiera lekcję)
        var przes = false;

        if (row[2 + day] != "") {
            if (row[2 + day].startsWith("przesunięcie")) {
                row[2 + day] = row[2 + day].replace("przesunięcie", "");
                row[2 + day] = row[2 + day].replaceAll("\n", " ");
                przes = true;
            }
            try {
                var unsplit = row[2 + day].split('-');
            } catch (error) {
                console.log(error);
                return;
            }
            if (unsplit[1] != null) {


                if (unsplit[1].split('s.')[1] != null) {
                    var unsplit2a = unsplit[1].split('s.')[0];
                    var unsplit2b = unsplit[1].split('s.')[1];
                } else if (unsplit[2] != null) {
                    var unsplit2a = unsplit[2].split('s.')[0];
                    var unsplit2b = unsplit[2].split('s.')[1];
                } else {
                    try {
                        var unsplit2a = unsplit[1]
                        var unsplit2b = "-"
                    } catch (error) { }
                }
                if (unsplit2b.split("!")[1] != null) {
                    unsplit2b = unsplit2b.split("!")[0]
                    var strikeout = true
                    przes = true
                }
                createRowNormal(row[1].trim(), unsplit[0].trim(), unsplit2a.trim(), unsplit2b.trim(), strikeout);
            }
            if (przes === true) {
                createRowInfo(false, "Uwaga, nastąpiło przesunięcie powyższej lekcji na inny dzień!");
            }
        }
    });
    switch (day) {
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
}


// Pobierz dane z URL
var urlParams = new URLSearchParams(window.location.search);
var encodedData = urlParams.get('data');

// Sprawdź, czy dane zostały przekazane w URL
if (encodedData) {
    try {
        // Zdekoduj dane JSON
        var decodedData = JSON.parse(decodeURIComponent(encodedData));
        console.log(decodedData);

        danetemp = decodedData

        // Przekaż dane do funkcji handleReceivedData
        handleReceivedData(0);
    } catch (e) {
        if (e instanceof TypeError) { }
        else {
            console.error("Coś poszło nie tak: " + e.message);
            createRowInfo(true, "WYSTĄPIŁ BŁĄD! - Przepraszamy za utrudnienia!")
        }
    }

} else {
    console.log('Brak danych do przetworzenia.');
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