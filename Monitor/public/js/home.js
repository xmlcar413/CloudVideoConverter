async function getVMList() {
    console.log("BUTTON WORKS")
    const response = await fetch(location.protocol + '//' + location.host +  '/list-vm');
    const myJson = await response.json();
    console.log(myJson);
    document.getElementById("vm-container").innerHTML = "";
    myJson[0].forEach(element => {
            console.log(element);
            document.getElementById("vm-container").innerHTML += element.id + ' at ' +  element.zone.name;
            document.getElementById("vm-container").innerHTML += '<button onClick="deleteVM(\''+element.id+'\',\''+element.zone.name+'\')">delete</button>';
        }
    );
}
async function startMonitor() {
    console.log("BUTTON WORKS")
    const response = await fetch(location.protocol + '//' + location.host +'/start-monitor', {
        method: 'POST'
    });
}

var cpuChartOptions = {
    title: {
        display: true,
        text: 'Cpu usage (%)'
    },
    scales: {
        xAxes: [{
            type:       "time",
            time:       {
                parser: "epoch",
                tooltipFormat: 'll'
            },
            scaleLabel: {
                display:     true,
                labelString: 'Date'
            }
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true,
                max: 100
            }
        }]
    }
};
var driveChartOptions = {
    title: {
        display: true,
        text: 'Used disk(%)'
    },
    scales: {
        xAxes: [{
            type:       "time",
            time:       {
                parser: "epoch",
                tooltipFormat: 'll'
            },
            scaleLabel: {
                display:     true,
                labelString: 'Date'
            }
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true,
                max: 100
            }
        }]
    }
};
var memChartOptions = {
    title: {
        display: true,
        text: 'Used mem(%)'
    },
    scales: {
        xAxes: [{
            type:       "time",
            time:       {
                parser: "epoch",
                tooltipFormat: 'll'
            },
            scaleLabel: {
                display:     true,
                labelString: 'Date'
            }
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true,
                max: 100
            }
        }]
    }
};
var procChartOptions = {
    title: {
        display: true,
        text: 'Number of open process'
    },
    scales: {
        xAxes: [{
            type:       "time",
            time:       {
                parser: "epoch",
                tooltipFormat: 'll'
            },
            scaleLabel: {
                display:     true,
                labelString: 'Date'
            }
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true,
            }
        }]
    }
};

var ctxCPU = document.getElementById('cpuChart').getContext('2d');
var ctxDrive = document.getElementById('driveChart').getContext('2d');
var ctxMem = document.getElementById('memChart').getContext('2d');
var ctxProc = document.getElementById('procChart').getContext('2d');

let cpuChart = new Chart(ctxCPU, {
    type: 'line',
    data: {
        datasets: []
    },
    options: cpuChartOptions
});
let driveChart = new Chart(ctxDrive, {
    type: 'line',
    data: {
        datasets: []
    },
    options: driveChartOptions
});
let memChart = new Chart(ctxMem, {
    type: 'line',
    data: {
        datasets: []
    },
    options: memChartOptions
});
let procChart = new Chart(ctxProc, {
    type: 'line',
    data: {
        datasets: []
    },
    options: procChartOptions
});

async function updateCharts(){

    const response = await fetch(location.protocol + '//' + location.host + '/vm-data')
        .then((response) => {
        return response.json();
        }).then((myJson) => {
            console.log(myJson);
            var cpuDataset = [];
            var driveDataset = [];
            var memDataset = [];
            var procDataset = [];


            Object.keys(myJson).forEach(function (key) {
                var cpuUsage = myJson[key].data.cpuUsage;
                var driveInfo = myJson[key].data.driveInfo;
                var memInfo = myJson[key].data.memInfo;
                var procOpen = myJson[key].data.procOpen;

                var cpuSet = {
                    label: key,
                    data: [],
                    backgroundColor: dynamicColors()
                };
                var driveSet = {
                    label: key,
                    data: [],
                    backgroundColor: dynamicColors()
                };
                var memSet = {
                    label: key,
                    data: [],
                    backgroundColor: dynamicColors()
                };
                var procSet = {
                    label: key,
                    data: [],
                    backgroundColor: dynamicColors()
                };

                for (let i = 0; i < cpuUsage.length; i++) {
                    cpuSet.data.push({x:parseInt(cpuUsage[i].date), y: cpuUsage[i].info});
                }
                for (let i = 0; i < driveInfo.length; i++) {
                    driveSet.data.push({x:parseInt(driveInfo[i].date), y: driveInfo[i].info});
                }
                for (let i = 0; i < memInfo.length; i++) {
                    memSet.data.push({x:parseInt(memInfo[i].date), y: memInfo[i].info});
                }
                for (let i = 0; i < procOpen.length; i++) {
                    procSet.data.push({x:parseInt(procOpen[i].date), y: procOpen[i].info});
                }
                
                cpuDataset.push(cpuSet);
                driveDataset.push(driveSet);
                memDataset.push(memSet);
                procDataset.push(procSet);
            });

            console.log(cpuDataset);
            console.log(driveDataset);
            console.log(memDataset);
            console.log(procDataset);

            cpuChart.data.datasets = cpuDataset;
            cpuChart.update();

            driveChart.data.datasets = driveDataset;
            driveChart.update();

            memChart.data.datasets = memDataset;
            memChart.update();

            procChart.data.datasets = procDataset;
            procChart.update();

        });

/*
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'cpu 2',
                    data: [{
                        x: 1576103014178,
                        y: 1
                    }, {
                        x: 1576103024178,
                        y: 10
                    }, {
                        x: 1576103034180,
                        y: 5
                    }]

                }
            ]
        },
        options: {
            scales: {
                xAxes: [{
                    type:       "time",
                    time:       {
                        format: "epoch",
                        tooltipFormat: 'll'
                    },
                    scaleLabel: {
                        display:     true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        max: 100
                    }
                }]
            }
        }
    });*/
}

var dynamicColors = function() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgb(" + r + "," + g + "," + b + ",0.1)";
}

async  function deleteVM(name, zone) {
    console.log(name)
    console.log(zone)
    const response = await fetch(location.protocol + '//' + location.host +'/delete-vm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name:name,zone:zone})

    });
    const myJson = await response.json();
}