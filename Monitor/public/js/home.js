

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

async function updateCharts(){

    const response = await fetch(location.protocol + '//' + location.host + '/downloadList')
        .then((response) => {
        return response.json();
        }).then((myJson) => {
            console.log(myJson);
        });


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
    });
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

var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
            {
                label: 'cpu 2',
                data: [12, 40, 3, 32, 2, 3],
            },
            {
                label: 'cpu 1',
                data: [11, 19, 3, 5, 3, 9],
            },
        ]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    max: 100
                }
            }]
        }
    }
});