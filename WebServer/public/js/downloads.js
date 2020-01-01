
async function getDownloadList() {
    console.log("BUTTON WORKS")
    const response = await fetch(location.protocol + '//' + location.host + '/downloadList');
    const myJson = await response.json();
    console.log(myJson);
    document.getElementById("downloadLinkContainer").innerHTML = "";
    myJson.forEach(element => {
            console.log(element);
            document.getElementById("downloadLinkContainer").innerHTML += element.fileInfo.filename;
            document.getElementById("downloadLinkContainer").innerHTML += '<button onClick="downloadFile(\''+element.fileInfo.id.fid+'\',\''+element.fileInfo.filename+'\')">download</button>';
        }
    );
}

async function downloadFile(fileID, filename) {
    console.log(fileID)
    console.log(filename)
    const response = await fetch(location.protocol + '//' + location.host + '/downloadFile',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({fileID:fileID, filename:filename})
    }).then(function(resp) {
        return resp.blob();
    }).then(function(blob) {
        download(blob,filename);
    });
}