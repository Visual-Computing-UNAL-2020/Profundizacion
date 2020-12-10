//Variables auxiliares para el mapa
var posicionInicialY = 4.65;
var posicionInicialX = -74.1;
var zoom = 12;
var map = L.map('map').setView([posicionInicialY,posicionInicialX], zoom);

//Se inicializa el dataset, la copia para filtrar los datos y los nombres de las localidades para hacer comparaciones
var data;
var filteredData;
var localityNames = ["Antonio Narino","Barrios Unidos","Bosa","Candelaria","Chapinero","Ciudad Bolivar","Engativa","Fontibon","Kennedy","Martires",
"Puente Aranda","Rafael Uribe Uribe","San Cristobal","Santafe","Suba","Teusaquillo","Tunjuelito","Usaquen","Usme","Fuera de Bogota","Sin dato"];

//Figuras de las localidades
var localitiesPolygons;

//Estado de la aplicación
var state = {
    "localities" : [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //Lista igual de larga al numero de localidades
    "ages" : [1,103],                                           //Lista de dos posiciones: [0]->Edad minima [1]->Edad máxima
    "sexos": [1,1],                                             //Lista de dos posiciones: [0]->Mujer [1]->Hombre
    "fechas": ["03/06/2020","05/06/2020"],                      //Lista de dos posiciones: [0]->fechaMinima [1]->fechaMaxima
    "nRegistros" : 3599                                         //Numero de registros de la busqueda actual
};

//INICIO
$( document ).ready(function() {

    //Se crean los datepicker para filtrar por fecha
    $("#initDateDatepicker").datepicker();
    $("#endDateDatepicker").datepicker();

    //Se ocultan las cards para interacturar con el mapa
    $("#localityControl").hide();
    $("#ageControl").hide();
    $("#sexControl").hide();
    $("#dateControl").hide();
    $("#registerCounter").hide();
    $("#chartButtons").hide();


    //Permitir que sean draggables los divs de control
    $( "#localityControl" ).draggable();
    $("#ageControl").draggable();
    $("#sexControl").draggable();
    $("#dateControl").draggable();
    $("#registerCounter").draggable();

    //Script para cargar el CSV
    $('#submit-file').on("click",function(e){

        //Se encarga de subir el archivo al servidor
        e.preventDefault();
        $('#files').parse({
            config: {
                delimiter: "auto",
                complete: iniciar,
            },
            before: function(file, inputElem)
            {
                //console.log("Parsing file...", file);
            },
            error: function(err, file)
            {
                //console.log("ERROR:", err, file);
            },
            complete: function()
            {
                //console.log("Done with all files");
            }
        });
    });

    //Se configura el mapa
    buildMap();

    //Se agregan los listeners de las cards de sexo y localidad
    document.querySelector("#localitiesUpdateButton").addEventListener('click',function (event) {
        updateLocalitiesState();
        updateFilteredData();
        repaintLocalities();
    });

    document.querySelector("#sexUpdateButton").addEventListener('click',function (event) {
        updateSexState();
        updateFilteredData();
        //repintar los sexos
    });

    document.querySelector("#ageForm").addEventListener('submit',function (event) {
        event.preventDefault();
        updateAgesState();
        updateFilteredData();
        //repintar el mapa
    });

    document.querySelector("#dateForm").addEventListener('submit',function (event) {
        event.preventDefault();
        updateDateState();
        updateFilteredData();
        //repintar el mapa
    });

    document.querySelector("#evolutionButton").addEventListener('click',function (event) {
        deployEvolutionChart(state.fechas[0],state.fechas[1],'evolutionChart',filteredData);
    });

    document.querySelector("#casesButton").addEventListener('click',function (event) {
        deployCasesChart(state.ages[0],state.ages[1],'casesChart',filteredData);
    });

    document.querySelector("#statesButton").addEventListener('click',function (event) {
        deployStateChart('statesChart',filteredData);
    });

});


//FUNCIONES CHARTS

function deployEvolutionChart(initDate,endDate,divName,data){

    var ctx = document.getElementById(divName).getContext('2d');

    var frequencies = evolutionFrequencies(initDate,endDate,data);
    console.log(frequencies);

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: frequencies[0],
            datasets: [{
                label: 'Evolución de contagios de covid-19 en BOGOTÁ',
                data: frequencies[1],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function evolutionFrequencies(initDate,endDate,data){
    var fechaAuxString="13/03/1971";

    var fechaAux = new Date(parseInt(fechaAuxString.split("/")[2]),parseInt(fechaAuxString.split("/")[1])-1,parseInt(fechaAuxString.split("/")[0]));
    var fechaInicio = new Date(parseInt(initDate.split("/")[2]),parseInt(initDate.split("/")[0])-1,parseInt(initDate.split("/")[1]));
    var fechaFinal = new Date(parseInt(endDate.split("/")[2]),parseInt(endDate.split("/")[0])-1,parseInt(endDate.split("/")[1]));

    var frequenciesArray = [];
    var datesArray = [];
    var frequenciesIndex = -1;
    var frequenciesAux = 0;

    for (var i = 0; i < data.length; i++) {

        console.log("("+i+")________________");
        var fechaActualString = data[i].join().split(",")[1];
        var fechaActual = new Date(parseInt(fechaActualString.split("/")[2]),parseInt(fechaActualString.split("/")[1])-1,parseInt(fechaActualString.split("/")[0]));

        if(fechaActual>=fechaInicio && fechaActual<=fechaFinal){//La fecha es agregada
            console.log("\tLa fecha "+fechaActual+" esta dentro de los limites");

            console.log("Comparamos "+fechaAux+" con "+fechaActual);
            if(fechaAux.getTime() != fechaActual.getTime()){


                if(frequenciesIndex!=-1){

                    var repeatedPosition = -1;
                    for (var j = 0; j < frequenciesArray.length; j++) {
                        console.log("Holi");
                        console.log(frequenciesArray[j]);
                        console.log(fechaAuxString);
                        console.log("baio");
                        if(frequenciesArray[j]==fechaAuxString){
                            console.log("Fecha ya insertada");
                            repeatedPosition = j;
                            break;
                        }
                    }

                    if(repeatedPosition!=-1){
                        datesArray[j]=datesArray[j]+frequenciesAux
                    }else{
                        frequenciesArray.push(fechaAuxString);
                        datesArray.push(frequenciesAux);
                    }

                }
                frequenciesIndex++;
                console.log("\tCAMBIO DE FECHA");
                console.log("\tAntes: "+fechaAuxString);

                fechaAux = new Date(parseInt(fechaActualString.split("/")[2]),parseInt(fechaActualString.split("/")[1])-1,parseInt(fechaActualString.split("/")[0]));
                fechaAuxString = data[i].join().split(",")[1];
                frequenciesAux=1;

                console.log("\tAhora: "+fechaAuxString);

            }else{
                console.log("\tAUMENTO DE FRECUENCIA")
                frequenciesAux++;
            }
        }else{

            console.log("La fecha "+fechaActual);
            console.log("PAILA");
        }
        console.log("________________");
    }

    repeatedPosition = -1;
    for (var j = 0; j < frequenciesArray.length; j++) {
        console.log("Holi");
        console.log(frequenciesArray[j]);
        console.log(fechaAuxString);
        console.log("baio");
        if(frequenciesArray[j]==fechaAuxString){
            console.log("Fecha ya insertada");
            repeatedPosition = j;
            break;
        }
    }

    if(repeatedPosition!=-1){
        console.log("Me reemplazaré")
        datesArray[j]=datesArray[j]+frequenciesAux
    }else{
        console.log("NO Me reemplazaré")
        frequenciesArray.push(fechaAuxString);
        datesArray.push(frequenciesAux);
    }

    var retornar = [frequenciesArray,datesArray];
    console.log(retornar);

    return retornar;

}

function deployCasesChart(minimaEdad,maximaEdad,divName,data){

    var ctx = document.getElementById(divName).getContext('2d');

    var frequencies = casesFrequencies(minimaEdad,maximaEdad,data);

    console.log(frequencies);

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: frequencies[0],
            datasets: [{
                label: 'No. de casos por edad de covid-19 en BOGOTÁ',
                data: frequencies[1],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function casesFrequencies(minimaEdad,maximaEdad,data){

    var frequenciesArray = new Array(maximaEdad-minimaEdad+1);
    var agesArray = new Array(maximaEdad-minimaEdad+1);


    for (let i = 0; i < agesArray.length; i++) {
        agesArray[i]=parseInt(minimaEdad)+parseInt(i);
        frequenciesArray[i]=0;
    }



    for (var i = 0; i < data.length; i++) {

        var edadActual = parseInt(data[i].join().split(',')[4])

        if(edadActual>= minimaEdad && edadActual<=maximaEdad){
            frequenciesArray[edadActual-1]=frequenciesArray[edadActual-1]+1;
        }

    }

    return [agesArray,frequenciesArray]
}

function deployStateChart(divName,data){

    var ctx = document.getElementById(divName).getContext('2d');

    var frequencies = stateFrequencies(data);
    console.log(frequencies);

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: frequencies[0],
            datasets: [{
                label: 'No. de casos por edad de covid-19 en BOGOTÁ',
                data: frequencies[1],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function stateFrequencies(data){

    var statesArray = ["Fallecido","Moderado","Recuperado","Severo","Critico"]
    var frequenciesArray = new Array(statesArray.length);

    for (let i = 0; i < statesArray.length; i++) {
        frequenciesArray[i]=0;
    }

    for (var i = 0; i < data.length; i++) {

        var estadoActual = data[i].join().split(',')[8]
        console.log(estadoActual)

        if(estadoActual=="Fallecido"){
            frequenciesArray[0]=frequenciesArray[0]+1;

        }else if(estadoActual=="Moderado"){
            frequenciesArray[1]=frequenciesArray[1]+1;

        }else if(estadoActual=="Recuperado"){
            frequenciesArray[2]=frequenciesArray[2]+1;

        }else if(estadoActual=="Severo"){
            frequenciesArray[3]=frequenciesArray[3]+1;

        }else if(estadoActual=="Critico"){
            frequenciesArray[4]=frequenciesArray[4]+1;

        }

    }

    return [statesArray,frequenciesArray]

}

function getDataByLocality(localityName,data){

    var dataReturned = [];
    for (var i = 0; i < data.length; i++) {
        var currentLocality = data[i].join().split(',')[3]


        //console.log("Comparando "+currentLocality+" con "+localityName);
        if(currentLocality == localityName){
            dataReturned.push(data[i]);
        }
    }

    return dataReturned;

}
//FUNCIONES UPDATE STATE

function updateLocalitiesState(){
    state.localities = [
        document.querySelector("#antonioNarinoCheckbox").checked,
        document.querySelector("#barriosUnidosCheckbox").checked,
        document.querySelector("#bosaCheckbox").checked,
        document.querySelector("#calendariaCheckbox").checked,
        document.querySelector("#chapineroCheckbox").checked,
        document.querySelector("#ciudadBolivarCheckbox").checked,
        document.querySelector("#engativaCheckbox").checked,
        document.querySelector("#fontibonCheckbox").checked,
        document.querySelector("#kennedyCheckbox").checked,
        document.querySelector("#martiresCheckbox").checked,
        document.querySelector("#puenteArandaCheckbox").checked,
        document.querySelector("#rafaelUribeUribeCheckbox").checked,
        document.querySelector("#sanCristobalCheckbox").checked,
        document.querySelector("#santafeCheckbox").checked,
        document.querySelector("#subaCheckbox").checked,
        document.querySelector("#teusaquilloCheckbox").checked,
        document.querySelector("#tunjuelitoCheckbox").checked,
        document.querySelector("#usaquenCheckbox").checked,
        document.querySelector("#usmeCheckbox").checked,
        document.querySelector("#fueraDeBogotaCheckbox").checked,
        document.querySelector("#sindatoCheckbox").checked,
    ];

}

function updateSexState(){
    state.sexos = [
        document.querySelector("#femaleCheckbox").checked,
        document.querySelector("#maleCheckbox").checked
    ];
}

function updateAgesState(){
    state.ages = [
        document.querySelector("#minAge").value,
        document.querySelector("#maxAge").value
    ]
}

function updateDateState(){
    state.fechas = [
        document.querySelector("#initDateDatepicker").value,
        document.querySelector("#endDateDatepicker").value
    ]

}

//OTRAS FUNCIONES

function buildMap(){

    //Se crea el mapa
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18
    }).addTo(map);

    //Se añaden los controles de escala
    L.control.scale().addTo(map);
}

function repaintLocalities() {
    for (var i = 0; i < state.localities.length-2; i++) { //-2 porque 'sin dato' y 'fuera de bogota' no tienen región
        if(state.localities[i]){
            map.addLayer(localitiesPolygons[i]);
        }else{
            map.removeLayer(localitiesPolygons[i]);
        }
    }
}

function updateFilteredData() {

    filteredData=[]
    var localityNamesAux = Array.from(localityNames) ;


    //FILTRO LOCALIDADES
    var indexToDelete = [];

    //1.Se guarda el índice de las localidades que no se desean
    for (var i = 0; i < state.localities.length; i++) {
        if(!state.localities[i]){
            indexToDelete.push(i);
        }
    }

    //2. Se eliminan las localidades de los índices dados
    for (var i = indexToDelete.length ; i > 0; i--) {
        localityNamesAux.splice(indexToDelete[i-1],1);
    }

    //3. Se agregan al arreglo todos los datos que tengan las localidades deseadas
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < localityNamesAux.length; j++) {
            if(data[i].join().split(",")[3] === localityNamesAux[j]){
                filteredData.push(data[i]);
            }
        }
    }
    //FILTRO EDAD
    indexToDelete = [];

    //1. Se buscan los índices a borrar
    for (var i = 0; i <filteredData.length ; i++) {

        if(!(parseInt(filteredData[i].join().split(",")[4]) >= parseInt(state.ages[0]) && parseInt(filteredData[i].join().split(",")[4]) <= parseInt(state.ages[1]))){
            //Se revisa que la edad del dato NO esté en el rango deseado
            //Si se cumple esto, se procede a eliminar
            indexToDelete.push(i);
        }
    }

    //2. Se eliminan los índices del arreglo filtrado
    for (var i = indexToDelete.length ; i > 0; i--) {
        filteredData.splice(indexToDelete[i-1],1);
    }

    //FILTRO SEXO
    indexToDelete = [];

    //1. Se revisan los índices que se deben eliminar
    for (var i = 0; i <filteredData.length ; i++) {

        //Obtengo el sexo
        var sexoMasculino = filteredData[i].join().split(",")[5] === 'M' ? 1:0; //1 si es hombre, 0 si es mujer

        if(!state.sexos[0] && !sexoMasculino){
            // Se revisa si se solicita eliminar las mujeres y se revisa si el dato i-esimo es mujer
            indexToDelete.push(i);
        }

        if(!state.sexos[1] && sexoMasculino){
            // Se revisa si se solicita eliminar los hombres y se revisa si el dato i-esimo es hombre
            indexToDelete.push(i);
        }
    }

    //2. Se eliminan los índices del arreglo filtrado
    for (var i = indexToDelete.length ; i > 0; i--) {
        filteredData.splice(indexToDelete[i-1],1);
    }

    //FILTRO FECHA
    indexToDelete = [];

   //1. Revisar qué índices se eliminarán

    var fechaMinima = new Date(parseInt(state.fechas[0].split("/")[2]),parseInt(state.fechas[0].split("/")[0])-1,parseInt(state.fechas[0].split("/")[1]))
    var fechaMaxima = new Date(parseInt(state.fechas[1].split("/")[2]),parseInt(state.fechas[1].split("/")[0])-1,parseInt(state.fechas[1].split("/")[1]))

    for (var i = 0; i <filteredData.length ; i++) {


        var fechaEvaluarString = filteredData[i].join().split(",")[1];
        var fechaEvaluar = new Date(fechaEvaluarString.split("/")[2],fechaEvaluarString.split("/")[1]-1,fechaEvaluarString.split("/")[0]);

        if(!((fechaEvaluar >= fechaMinima) && (fechaEvaluar <= fechaMaxima))){
            //Se revisa que la edad del dato NO esté en el rango deseado
            //Si se cumple esto, se procede a eliminar
            indexToDelete.push(i);
        }
    }

    //2. Se eliminan los índices del arreglo filtrado
    for (var i = indexToDelete.length ; i > 0; i--) {
        filteredData.splice(indexToDelete[i-1],1);
    }

    state.nRegistros = filteredData.length;
    $("#h6NRegistros").text(state.nRegistros);

    console.log(filteredData.length);
}


function iniciar(results) {

    //Se crean los polígonos de cada localidad
    localitiesPolygons = createPolygons();

    //Se encarga de mostrar los datos por consola y mostrar las cards correspondientes
    data = results.data;
    filteredData = results.data;

    $("#chargeCSV").hide();
    $("#ageControl").show();
    $("#sexControl").show();
    $("#localityControl").show();
    $("#dateControl").show();
    $("#registerCounter").show();
    $("#chartButtons").show();

}

function createPolygons() {

    var marker;

    var usme = L.polygon([
        [4.4711, -74.08184],
        [4.4634, -74.13016],
        [4.48534, -74.12085],
        [4.49168, -74.12802],
        [4.52346, -74.12853],
        [4.52706, -74.12107],
        [4.54648, -74.12107],
        [4.53933, -74.1148],
        [4.53946, -74.10173],
        [4.54556, -74.10334],
        [4.54588, -74.10158],
        [4.53604, -74.09544],
        [4.52137, -74.0937],
        [4.51803, -74.08442],
        [4.52366, -74.08392],
        [4.544, -74.07506],
        [4.528, -74.07566],
        [4.52748, -74.06897],

    ],{color: 'red'}).addTo(map);

    usme.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Usme",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var sanCristobal = L.polygon([
        [4.54588, -74.10158],
        [4.53604, -74.09544],
        [4.52137, -74.0937],
        [4.51803, -74.08442],
        [4.52366, -74.08392],
        [4.544, -74.07506],
        [4.528, -74.07566],
        [4.52748, -74.06897],
        [4.51484, -74.07184],
        [4.50798, -74.05613],
        [4.51225, -74.04227],
        [4.55683, -74.02905],
        [4.56898, -74.03356],
        [4.57506, -74.05197],
        [4.58297, -74.06562],
        [4.57437, -74.0751],
        [4.57386, -74.07549],
        [4.57078, -74.0754],
        [4.57553, -74.07845],
        [4.58015, -74.07776],
        [4.58306, -74.07948],
        [4.58605, -74.0815],
        [4.58892, -74.08489],
        [4.57565, -74.09459],
        [4.56496, -74.10489]
    ],{color: 'green'}).addTo(map);

    sanCristobal.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("San Cristobal",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var rafaelUribeUribe = L.polygon([
        [4.57565, -74.09459],
        [4.56496, -74.10489],
        [4.54588, -74.10158],
        [4.54556, -74.10334],
        [4.53946, -74.10173],
        [4.53933, -74.1148],
        [4.54648, -74.12107],
        [4.55555, -74.12158],
        [4.56637, -74.12652],
        [4.56881, -74.12531],
        [4.57844, -74.12755],
        [4.57809, -74.12888],
        [4.58571, -74.13089],
        [4.58665, -74.12819],
        [4.59178, -74.12707],
        [4.58879, -74.12255],
        [4.58902, -74.10883]

    ],{color: 'blue'}).addTo(map);

    rafaelUribeUribe.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Rafael Uribe Uribe",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var tunjuelito = L.polygon([
        [4.52509, -74.1251],
        [4.52706, -74.12107],
        [4.54648, -74.12107],
        [4.55555, -74.12158],
        [4.56637, -74.12652],
        [4.56637, -74.12652],
        [4.56881, -74.12531],
        [4.57844, -74.12755],
        [4.57809, -74.12888],
        [4.58571, -74.13089],
        [4.58571, -74.13089],
        [4.58665, -74.12819],
        [4.59178, -74.12707],
        [4.59482, -74.13737],
        [4.59495, -74.14527],
        [4.59576, -74.15252],
        [4.58575, -74.15085],
        [4.57634, -74.14845],
        [4.57377, -74.14287],
        [4.56376, -74.13909],
        [4.56017, -74.13308],
        [4.54451, -74.12493]


    ],{color: 'yellow'}).addTo(map);

    tunjuelito.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Tunjuelito",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var ciudadBolivar = L.polygon([
        [4.59627, -74.18312],
        [4.5961, -74.16158],
        [4.59989, -74.1522],
        [4.59576, -74.15252],
        [4.58575, -74.15085],
        [4.57634, -74.14845],
        [4.57377, -74.14287],
        [4.56376, -74.13909],
        [4.56017, -74.13308],
        [4.54451, -74.12493],
        [4.52509, -74.1251],
        [4.52346, -74.12853],
        [4.49168, -74.12802],
        [4.48534, -74.12085],
        [4.4634, -74.13016],
        [4.46545, -74.18226],
        [4.50558, -74.17488],
        [4.52851, -74.18724],
        [4.54066, -74.17402],
        [4.57095, -74.17849]

    ],{color: 'purple'}).addTo(map);

    ciudadBolivar.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Ciudad Bolivar",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var bosa = L.polygon([
        [4.61554, -74.17673],
        [4.62006, -74.17125],
        [4.62276, -74.17312],
        [4.62573, -74.1751],
        [4.62409, -74.17653],
        [4.62821, -74.17716],
        [4.63161, -74.17857],
        [4.65068, -74.1863],
        [4.65428, -74.19406],
        [4.6438, -74.2008],
        [4.64632, -74.20604],
        [4.6405, -74.20767],
        [4.64042, -74.20853],
        [4.64431, -74.2178],
        [4.63246, -74.21466],
        [4.62853, -74.22209],
        [4.61877, -74.22149],
        [4.61531, -74.21707],
        [4.59992, -74.20449],
        [4.60064, -74.20424],
        [4.59627, -74.18312],
        [4.5961, -74.16158],
        [4.59989, -74.1522],
        [4.605, -74.1584],
        [4.60616, -74.16347],
        [4.60342, -74.1693],
        [4.60337, -74.17385],
        [4.6056, -74.17698],
        [4.61082, -74.17831],
        [4.61484, -74.18273],
        [4.61576, -74.18434],
        [4.61886, -74.18471],
        [4.61916, -74.18336],
        [4.61888, -74.18057]

    ],{color: 'orange'}).addTo(map);

    bosa.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Bosa",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var kennedy = L.polygon([
        [4.65693, -74.17188],
        [4.66292, -74.16235],
        [4.66121, -74.1572],
        [4.66386, -74.15239],
        [4.66275, -74.14132],
        [4.65988, -74.13888],
        [4.65197, -74.1336],
        [4.64803, -74.12905],
        [4.64889, -74.12639],
        [4.6414, -74.1236],
        [4.63734, -74.11815],
        [4.62887, -74.12231],
        [4.62831, -74.12248],
        [4.60885, -74.12883],
        [4.59482, -74.13737],
        [4.59576, -74.15252],
        [4.59989, -74.1522],
        [4.605, -74.1584],
        [4.60616, -74.16347],
        [4.60342, -74.1693],
        [4.60337, -74.17385],
        [4.6056, -74.17698],
        [4.61082, -74.17831],
        [4.61484, -74.18273],
        [4.61576, -74.18434],
        [4.61886, -74.18471],
        [4.61916, -74.18336],
        [4.61888, -74.18057],
        [4.61554, -74.17673],
        [4.62006, -74.17125],
        [4.62573, -74.1751],
        [4.62409, -74.17653],
        [4.62821, -74.17716],
        [4.63161, -74.17857],
        [4.65068, -74.1863],

    ],{color: 'grey'}).addTo(map);

    kennedy.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Kennedy",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var puenteAranda = L.polygon([
        [4.59482, -74.13737],
        [4.60885, -74.12883],
        [4.62831, -74.12248],
        [4.63734, -74.11815],
        [4.64525, -74.11042],
        [4.62502, -74.09111],
        [4.62481, -74.08296],
        [4.60637, -74.09763],
        [4.59781, -74.1069],
        [4.59576, -74.1136],
        [4.59319, -74.12493]

    ],{color: 'brown'}).addTo(map);

    puenteAranda.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Puente Aranda",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var antonioNarino = L.polygon([

        [4.58892, -74.08489],
        [4.59165, -74.08909],
        [4.59478, -74.09879],
        [4.59497, -74.10298],
        [4.59813, -74.10652],
        [4.59781, -74.1069],
        [4.59576, -74.1136],
        [4.59319, -74.12493],
        [4.59482, -74.13737],
        [4.59178, -74.12707],
        [4.58879, -74.12255],
        [4.58902, -74.10883],
        [4.57565, -74.09459],

    ],{color: 'olive'}).addTo(map);

    antonioNarino.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Antonio Narino",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });


    var candelaria = L.polygon([
        [4.59326, -74.08233],
        [4.60213, -74.07667],
        [4.60226, -74.07485],
        [4.60128, -74.07321],
        [4.60061, -74.07083],
        [4.60075, -74.06926],
        [4.60254, -74.06697],
        [4.60327, -74.06491],
        [4.60224, -74.06015],
        [4.60158, -74.06002],
        [4.60062, -74.06431],
        [4.59944, -74.06568],
        [4.59739, -74.06734],
        [4.59448, -74.06772],
        [4.5933, -74.06832],
        [4.59356, -74.06963],
        [4.58975, -74.07135],
        [4.58966, -74.07519],
        [4.59056, -74.07948]
    ],{color: 'fuchsia'}).addTo(map);

    candelaria.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Candelaria",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var coordenadasSantaFe = [
        //Exterior
        [

            [4.62416, -74.05742],
            [4.62481, -74.06169],
            [4.62595, -74.06565],
            [4.62774, -74.06862],
            [4.61989, -74.07025],
            [4.60859, -74.07613],
            [4.59165, -74.08909],
            [4.58892, -74.08489],
            [4.58605, -74.0815],
            [4.58306, -74.07948],
            [4.58015, -74.07776],
            [4.57553, -74.07845],
            [4.57078, -74.0754],
            [4.57386, -74.07549],
            [4.58297, -74.06562],
            [4.57506, -74.05197],
            [4.56898, -74.03356],
            [4.55683, -74.02905],
            [4.56068, -74.01807],
            [4.56051, -74.00648],
            [4.57968, -73.99979],
            [4.58447, -73.99618],
            [4.59148, -74.0015],
            [4.59867, -73.99395],
            [4.61013, -73.99455],
            [4.621, -73.99223],
            [4.62656, -73.98949],
            [4.62665, -74.00966],
            [4.62613, -74.01858],
            [4.61946, -74.02725],
            [4.61621, -74.03601],
            [4.61338, -74.04459],
            [4.62126, -74.04957]

        ],
        [
            //Hueco
            [4.59326, -74.08233],
            [4.60213, -74.07667],
            [4.60226, -74.07485],
            [4.60128, -74.07321],
            [4.60061, -74.07083],
            [4.60075, -74.06926],
            [4.60254, -74.06697],
            [4.60327, -74.06491],
            [4.60224, -74.06015],
            [4.60158, -74.06002],
            [4.60062, -74.06431],
            [4.59944, -74.06568],
            [4.59739, -74.06734],
            [4.59448, -74.06772],
            [4.5933, -74.06832],
            [4.59356, -74.06963],
            [4.58975, -74.07135],
            [4.58966, -74.07519],
            [4.59056, -74.07948],
        ]
    ];

    var santaFe = L.polygon(coordenadasSantaFe).addTo(map);

    santaFe.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Santafe",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var martires = L.polygon([

        [4.62481, -74.08296],
        [4.60637, -74.09763],
        [4.59781, -74.1069],
        [4.59497, -74.10298],
        [4.59478, -74.09879],
        [4.59165, -74.08909],
        [4.60859, -74.07613],
        [4.61531, -74.0727],
        [4.62382, -74.07888],

    ],{color: 'GreenYellow'}).addTo(map);

    martires.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Martires",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var teusaquillo = L.polygon([

        [4.64944, -74.0645],
        [4.65325, -74.08321],
        [4.666, -74.09326],
        [4.64525, -74.11042],
        [4.62502, -74.09111],
        [4.62481, -74.08296],
        [4.62382, -74.07888],
        [4.61531, -74.0727],
        [4.61989, -74.07025],
        [4.62774, -74.06862],

    ],{color: 'black'}).addTo(map);

    teusaquillo.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Teusaquillo",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });


    var chapinero = L.polygon([


        [4.62774, -74.06862],
        [4.64944, -74.0645],
        [4.65402, -74.0633],
        [4.68683, -74.05699],
        [4.68554, -74.04985],
        [4.67977, -74.03837],
        [4.67532, -74.02519],
        [4.67387, -74.01953],
        [4.6701, -74.01609],
        [4.663, -74.01026],
        [4.66138, -74.01361],
        [4.65612, -74.02665],
        [4.64487, -74.03043],
        [4.64213, -74.0118],
        [4.64461, -74.01176],
        [4.64525, -74.00609],
        [4.64085, -74.00751],
        [4.63434, -74.00189],
        [4.63109, -73.99588],
        [4.62656, -73.98949],
        [4.62665, -74.00966],
        [4.62613, -74.01858],
        [4.61946, -74.02725],
        [4.61621, -74.03601],
        [4.61338, -74.04459],
        [4.62126, -74.04957],
        [4.62416, -74.05742],
        [4.62481, -74.06169],
        [4.62595, -74.06565],


    ],{color: 'MediumSpringGreen'}).addTo(map);

    chapinero.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Chapinero",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var usaquen = L.polygon([
        [4.68683, -74.05699],
        [4.68554, -74.04985],
        [4.67977, -74.03837],
        [4.67532, -74.02519],
        [4.67387, -74.01953],
        [4.6701, -74.01609],
        [4.663, -74.01026],
        [4.66412, -74.00691],
        [4.66933, -74.00468],
        [4.67652, -74.00228],
        [4.68276, -74.01052],
        [4.6914, -74.0118],
        [4.7145, -74.01026],
        [4.74461, -74.00854],
        [4.75556, -74.01017],
        [4.76283, -74.01609],
        [4.76877, -74.01828],
        [4.78481, -74.01627],
        [4.80559, -73.99987],
        [4.82167, -74.00571],
        [4.82159, -74.0215],
        [4.82518, -74.03481],

    ],{color: 'Indigo'}).addTo(map);

    usaquen.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Usaquen",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });


    var suba = L.polygon([
        [4.68683, -74.05699],
        [4.82518, -74.03481],
        [4.82689, -74.04116],
        [4.83288, -74.0439],
        [4.83023, -74.04777],
        [4.83305, -74.053],
        [4.8274, -74.06073],
        [4.83544, -74.06253],
        [4.83544, -74.06742],
        [4.8286, -74.07034],
        [4.83613, -74.07463],
        [4.83271, -74.08613],
        [4.82193, -74.08364],
        [4.81795, -74.08686],
        [4.81316, -74.08467],
        [4.8103, -74.07952],
        [4.80294, -74.08785],
        [4.79764, -74.08768],
        [4.79046, -74.09351],
        [4.79909, -74.09635],
        [4.79636, -74.1057],
        [4.7908, -74.11334],
        [4.77352, -74.11523],
        [4.75616, -74.12012],
        [4.75436, -74.12012],
        [4.75, -74.12441],
        [4.7405, -74.13154],
        [4.73914, -74.11986],
        [4.72288, -74.10356],
        [4.71604, -74.09489],
        [4.70727, -74.08952],
        [4.69927, -74.08785],
        [4.6914, -74.08072],
        [4.68533, -74.07746],
        [4.68935, -74.07171],
        [4.68969, -74.06459]

    ],{color: 'Maroon'}).addTo(map);

    suba.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Suba",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var barriosUnidos = L.polygon([
        [4.68683, -74.05699],
        [4.65402, -74.0633],
        [4.64944, -74.0645],
        [4.65325, -74.08321],
        [4.666, -74.09326],
        [4.67746, -74.08562],
        [4.68533, -74.07746],
        [4.68935, -74.07171],
        [4.68969, -74.06459]

    ],{color: 'Gold'}).addTo(map);

    barriosUnidos.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Barrios Unidos",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var fontibon = L.polygon([

        [4.66292, -74.16235],
        [4.66121, -74.1572],
        [4.66386, -74.15239],
        [4.66275, -74.14132],
        [4.65988, -74.13888],
        [4.65197, -74.1336],
        [4.64803, -74.12905],
        [4.64889, -74.12639],
        [4.6414, -74.1236],
        [4.63734, -74.11815],
        [4.64525, -74.11042],
        [4.65411, -74.10321],
        [4.6784, -74.11926],
        [4.68456, -74.12493],
        [4.68807, -74.11806],
        [4.692, -74.12038],
        [4.71758, -74.15523],
        [4.70997, -74.15454],
        [4.70595, -74.16098],
        [4.70278, -74.17643],
        [4.69868, -74.17016],
        [4.69414, -74.17231],
        [4.6885, -74.16827],
        [4.68217, -74.17325],
        [4.67626, -74.17428],
        [4.66865, -74.17016],
        [4.66737, -74.1608]


    ],{color: 'red'}).addTo(map);

    fontibon.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Fontibon",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    var engativa = L.polygon([

        [4.65411, -74.10321],
        [4.6784, -74.11926],
        [4.68456, -74.12493],
        [4.68807, -74.11806],
        [4.692, -74.12038],
        [4.71758, -74.15523],
        [4.7198, -74.15977],
        [4.72468, -74.15686],
        [4.72271, -74.15102],
        [4.72819, -74.14261],
        [4.73015, -74.13033],
        [4.72827, -74.12707],
        [4.73332, -74.1275],

        [4.7405, -74.13154],
        [4.73914, -74.11986],
        [4.72288, -74.10356],
        [4.71604, -74.09489],
        [4.70727, -74.08952],
        [4.69927, -74.08785],
        [4.6914, -74.08072],
        [4.68533, -74.07746]

    ],{color: 'grey'}).addTo(map);

    engativa.on('click', function (event) {
        if(marker != undefined){
            map.removeLayer(marker);
        }

        var datosLocalidad = getDataByLocality("Engativa",filteredData);

        marker = L.marker(event.latlng,{
            icon: new L.DivIcon({
                className: 'my-div-icon',
                html: ' <div class="card control dialogo" > <div class="card-body px-1 py-1"><p class="pAges text-center font-weight-bold text-info">'+datosLocalidad.length+' casos'+'</p>' +
                    '<div class="row"><div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Evolución contagios</p></div> <div class="col-md-4 sinPadding"><p class="pPequeno text-center font-weight-bold text-dark my-0"> Casos por edad </p></div> <div class="col-md-4 sinPadding"> <p class="my-0 pPequeno text-center font-weight-bold text-dark">Estados</p></div></div> ' +
                    '<div class="row"><div class="col-md-4 sinPadding text-center"> <i class="fa fa-line-chart fa-2x" aria-hidden="true"></i></div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-address-card-o fa-2x" aria-hidden="true"></i> </div> <div class="col-md-4 sinPadding text-center"> <i class="fa fa-heart fa-2x" aria-hidden="true"></i></div></div>' +
                    '</div></div> '
            })
        } ).addTo(map);


    });

    return [antonioNarino,barriosUnidos,bosa,candelaria,chapinero,ciudadBolivar,engativa,fontibon,kennedy,martires,puenteAranda,rafaelUribeUribe,sanCristobal,santaFe,suba,teusaquillo,tunjuelito,usaquen,usme];

}

