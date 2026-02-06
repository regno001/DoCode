const runBTn= document.createElement("button");
runBTn.innerText="RunCode";
runBTn.style.margin="8px";
document.querySelector(".panel-header").appendChild(runBTn);

runBTn.onClick=()=>{
    const code = document.getElementById("HostEditor").value;
    const lang = document.getElementById("Language").value;

    fetch("http://localhost:3000/run",{
     method: "POST",
     headers: {"Content-Type":"application/json"},
     bosy:JSON.stringify({code,lang})

    })
    .then(res=> res.text())
    .then(output=>{
        document.getElemnetById("HostTerminal").value = output;
    });
};