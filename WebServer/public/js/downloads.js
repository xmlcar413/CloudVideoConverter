
async function getDownloadList() {
    console.log("BUTTON WORKS");
    const response = await fetch(location.protocol + '//' + location.host + '/downloadList');
    const myJson = await response.json();
    console.log(myJson);
    var text = '';
    text = '<ul style="list-style-type:none;">';
    myJson.forEach(element => {
        console.log(element);
        text += '<li>';
        if(element.jobFinished === -1){
            text += '<p>TEMP</p>';
            text += '<p>Status: '+element.state+'</p>';
        }
        else{
            text += '<p>'+element.fileInfo.filename+'</p>';
            text += '<button onClick="downloadFile(\''+element.fileInfo.id.fid+'\',\''+element.fileInfo.filename+'\',\''+element.id+'\')">download</button>';
            text += '<p>Status: '+element.state+'</p>';
        }
        text += '</li>';
    });
    text += '</ul>';
    document.getElementById("downloadLinkContainer").innerHTML = text;
}

async function downloadFile(fileID, filename, id) {
    console.log(fileID);
    console.log(filename);
    const response = await fetch(location.protocol + '//' + location.host + '/downloadFile',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({fileID:fileID, filename:filename, id:id})
    }).then(function(resp) {
        return resp.blob();
    }).then(function(blob) {
        download(blob,filename);
    });
}