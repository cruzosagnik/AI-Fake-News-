document
.getElementById("checkBtn")
.addEventListener(
"click",

async ()=>{

const news=

document
.getElementById("newsText")
.value;

if(news===""){

document
.getElementById("result")
.innerText=

"Paste some news first";

return;

}

document
.getElementById("result")
.innerText=

"Checking...";

}
);