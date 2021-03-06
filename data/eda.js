//*****************************************************************************
//**********************************STARTUP************************************
//*****************************************************************************

window.addEventListener('load', function(e) {
  window.addEventListener("mousewheel",mouseWheelHandler,true);
  window.addEventListener('DOMMouseScroll', mouseWheelHandler, true); 

  document.addEventListener("keypress",handlerKeyPress,true);

  mode=1;
  rx=0;
  ry=0;
  moving=0;
  document.getElementById('mega').onmousedown=function(){return false};
  document.getElementById('functionlist').onmousedown=function(){return false};

  refreshFunctionList();

  if(location.hash!=null&&location.hash!="") {		//for refresh
    refreshFunction(location.hash.replace("#",""));
  }
}, false);

//*****************************************************************************
//*******************************KEYBOARD**************************************
//*****************************************************************************

var mode;  //0 is text, 1 is graph
var renaming=null;
var rbox; 


var renameOldValue;

function terminateRename() {
  if(renaming!=null) {
    renaming.innerHTML=renameOldValue;
    renaming=null;
  }
}

function handlerKeyPress(e) {
  //alert(e.keyCode);
  //alert(String.fromCharCode(e.keyCode));
  if(e.keyCode==110) {  //'n' for rename
    if(renaming==null && selected!=null && (selected.className=="location" || selected.className=="addr")) {
      renaming=selected;
      renameOldValue=selected.innerHTML;
      rbox=document.createElement('input');
      rbox.setAttribute("type","text");
      rbox.setAttribute("id","rename");
      rbox.setAttribute("value",renameOldValue);
      renaming.innerHTML="";
      renaming.appendChild(rbox);
      rbox.focus();
      e.returnValue=false;
    }
  }
  if(e.keyCode==13) {    //enter
    if(renaming!=null && rbox.value.length>0) {
      renaming.innerHTML=rbox.value;
      //push this to server
      sendRename(renameOldValue, renaming.innerHTML);
      renaming=null;
    }
  }
  if(e.keyCode==96) {  //bootleg escape
    terminateRename();
  }
  /*if(e.keyCode==32)
  {
    var el = document.getElementById('mega');
    if(mode==0)  //switch to graph7
    {
      mode=1;
      setStyleByClass("boringbox","codebox");
      
      el.style.left=rx+"px";
      el.style.top=ry+"px";
    }
    else    //switch to text
    {
      setStyleByClass("codebox","boringbox");
      mode=0;
      el.style.left="0px";
      el.style.top="0px";
    }
  }*/
}

//*****************************************************************************
//*********************************NAVIGATION**********************************
//*****************************************************************************

var oldhash;
setInterval(function() {
	if(oldhash!=null && oldhash!=location.hash && location.hash!="")
		refreshFunction(location.hash.replace("#",""));
	oldhash=location.hash;
}, 50);


var selected=null;
function setSelectedStyle(t) {
  t.style.backgroundColor="orange";
  t.style.color="black";
}

function resetSelectedStyle(t) {
  t.style.backgroundColor="";
  t.style.color="";
}

function handleMousedownNavigate(e) {
  if(selected!=null)
    resetSelectedStyle(selected);
  
  //alert(e.target.className);
  if(e.target.className=="location" || e.target.className=="addr") {
    selected=e.target;
    setSelectedStyle(selected);
  }
    //alert(e.target.innerHTML);
    //refreshFunction(e.target.innerHTML);
}

window.addEventListener('dblclick', function(e) {
  //alert("got double click");
  if(e.target.className=="location") {
    refreshFunction(selected.innerHTML);
  }
},false);

//*****************************************************************************
//****************************SERVER COMMUNICATION*****************************
//*****************************************************************************


function sendRename(a,b) {
  var req = new XMLHttpRequest();
  req.open("GET", "Bank/rename/"+a+"/"+b, true); req.send("");
}

//pull the function instructions+branch tree down from the server
function refreshFunction(address) {
  //alert("refreshfunction "+address);

  onPage=document.getElementById(address);
  if(onPage!=null)
  {
    //move the screen
    
    //alert("found on page");
    gx=(-onPage.offsetLeft)+500;
    gy=(-onPage.offsetTop)+500;
    glideInterval=setInterval("glide()",20);
    return;
  }

  selected=null;  //selections no longer valid, this is a real update

  var req = new XMLHttpRequest(), reqBD = new XMLHttpRequest();
  req.open("GET", "Bank/getFunction/"+address, true); req.send("");

  req.onreadystatechange = function(){
  if (req.readyState == 4) {
//*****Got Response*****

//nested to allow drag everywhere
  bigdiv=document.createElement("div");
  bigdiv.innerHTML=req.responseText;
  //alert(bigdiv.innerHTML);

  //document.getElementById("mega").appendChild(field);

//now request the branch data to draw the graph
  reqBD.open("GET", "Bank/getFunctionBranchData/"+address, true); reqBD.send("");
//******Cleanup******
  }
  }

  reqBD.onreadystatechange = function(){
  if (reqBD.readyState == 4) {
//*****Got Response*****
  graphDraw(reqBD.responseXML.documentElement.childNodes, bigdiv.childNodes);
//******Cleanup******
  }
  }

  oldhash="#"+address;
  location.hash=address;
}

// pull the function list from the server
function refreshFunctionList() {
  req = new XMLHttpRequest()
  req.open("GET", "Bank/getFunctionList", true);
  req.send("");
  req.onreadystatechange = function(){
  if (req.readyState == 4) {
//*****Got Response*****
  var m=req.responseXML.documentElement.childNodes;
  var box=document.getElementById("functionlist");
  spit="";
  for(a=0;a<m.length;a++)
  {
    if(m[a].attributes)
    {
      //alert(m[a].childNodes[0].nodeValue);
      spit+='<div class="function" ondblclick="refreshFunction('+
        //"'"+m[a].attributes[0].value+"'"+')">'+
        "'"+m[a].childNodes[0].nodeValue+"'"+')">'+
        m[a].childNodes[0].nodeValue+'</div>';
    }
  }
  box.innerHTML=spit;
//******Cleanup******
  }
  }
}

//*****************************************************************************
//*******************************SCREEN MOVEMENT*******************************
//*****************************************************************************

var glideInterval;

function glide() {
  var ratiox,ratioy;
  var glideRate=50;  //set gliderate here

  if(Math.abs(gx-rx)<=glideRate && Math.abs(gy-ry)<=glideRate) {
    rx=gx;
    ry=gy;
    clearInterval(glideInterval);
  }
  else {
    ratiox=(gx-rx)/Math.abs((gx-rx)+(gy-ry));
    ratioy=(gy-ry)/Math.abs((gx-rx)+(gy-ry));

    rx+=glideRate*ratiox;
    ry+=glideRate*ratioy;
  }
  
  updateScreen();

  
}

var gx,gy;
var x,y;
var rx,ry;
var moving;

function mouseWheelHandler(e) {
  //alert("Scroll");
  //alert(navigator.userAgent);
  var ue=navigator.userAgent.toLowerCase()
  if(ue.indexOf("chrome") != -1)
    ry=(ry+e.wheelDelta/120);   //for chrome
  else if(ue.indexOf("firefox") != -1)
    ry=ry-(e.detail*40);         //for firefox
  else
    ry=ry+e.wheelDelta;         //for safari

  updateScreen();
}


function movescreen(e) {
  
  rx=rx+(e.clientX-x);
  ry=ry+(e.clientY-y);
  x=e.clientX;
  y=e.clientY;
  updateScreen();
}

function updateScreen() {
  var el = document.getElementById('mega');
  el.style.left=rx+"px";
  el.style.top=ry+"px";
}

window.addEventListener('mousedown', function(e) {
  terminateRename();
  if(e.target.id=="root" || 
      e.target.parentNode.getAttribute("class")=="frame" ||
      e.target.getAttribute("class")=="bg") {
    x=e.clientX;
    y=e.clientY;
    window.addEventListener('mousemove', movescreen, false);
    moving=1;
  }
  return false;
},false);

window.addEventListener('mouseup', function(e) {
  if(mode==1) {
    window.removeEventListener('mousemove', movescreen, false);
    if(moving!=1) {
      handleMousedownNavigate(e);
    }
    moving=0;
  }
},false);


//*****************************************************************************
//***********************************DRAWING***********************************
//*****************************************************************************

//place the codeboxes and draw the lines

var nodes;  //so I can get debug data on it

function graphDraw(data, divlist)
{
  //get all the boxes on the field
  nodes = new Array();
  var lines = new Array();  //memory is cheap
  var segments = new Array(); //segments[end]=start;
 
  firstaddr=-1;
 
  for(a=0;a<divlist.length;a++) {
    if(divlist[a].nodeType==1 && divlist[a].childNodes.length>3)  {
      //alert(divlist[a].nodeName);
      //alert(divlist[a].childNodes[3].className);
      //alert(divlist[a].childNodes[2].id);
      
      //alert("got node at: "+divlist[a].childNodes[3].id);
      if(firstaddr==-1) firstaddr=divlist[a].childNodes[3].id;
      nodes[divlist[a].childNodes[3].id]={ 
        box: divlist[a],
        level: null, 
        parents: new Array(),   //from parents
        children: new Array(),  //to children
        lineage: new Array(),
        xwidth: 0, 
        xcenter: 0,
        xweight: 0};
      segments[divlist[a].lastChild.previousSibling.id]=divlist[a].childNodes[3].id;
    }
  }
 
  for(a=0;a<data.length;a++) {
    m=data[a].attributes;
    if(m) {
      //[0] is color, [1] is to, [2] is from
      if(nodes[segments[m[2].value]]==null) alert(m[2].value + "  "+segments[m[2].value]);
      nodes[segments[m[2].value]].children.push(m[1].value);
      if(nodes[m[1].value]==null) alert(m[1].value);
      nodes[m[1].value].parents.push(segments[m[2].value]);

      lines.push({to: m[1].value, from: segments[m[2].value], color: m[0].value});
    }
  }
//do initial traverse, build edges
  graphRemoveLoops(nodes,firstaddr);

//place all childless nodes in bottom level
  var inLevel = new Array();
  for(a in nodes) {
    if(nodes[a].children.length==0) {
      nodes[a].level=0;
      inLevel.push(a);
    }
  }
//do Y placement

//should insert fake nodes for routing
  doYPlacement(nodes, 0,inLevel);

//create level array
  var level = new Array();
  
  for(a in nodes) {
    //alert(nodes[a].level);
    if(level[nodes[a].level]==null) {
      /*level[nodes[a].level]=document.createElement("div");
      level[nodes[a].level].className="level";
      level[nodes[a].level].id="L_"+nodes[a].level;*/
      level[nodes[a].level]=new Array();
    }
    //level[nodes[a].level].appendChild(nodes[a].box);
    level[nodes[a].level].push(a);
  }
  /*if(level[null]!=null)
  {
    level[null].style.backgroundColor="red";
    field.appendChild(level[null]);
  }*/

//sort levels, ghetto crossing minimization
  var levelsSorted = new Array();
  for(a=0;a<level.length;a++) {
    levelsSorted[a]=level[a].sort();
  }

  //alert("sorted: "+levelsSorted.length);


//clear the field
  field=document.getElementById("mega");
  field.innerHTML="<canvas id=\"line_canvas\" width=\"3000px\" height=\"3000px\"></canvas>";
//draw the levels
  //levels start minus
  var levelDiv = new Array();
  for(a=(levelsSorted.length-1);a>=0;a--) {
    if(levelsSorted[a]==null) alert("level "+a+" not found");
    else {
      levelDiv[a]=document.createElement("div");
      levelDiv[a].className="level";
      levelDiv[a].id="L_"+a;
      for(n=0;n<levelsSorted[a].length;n++) {
        //alert(levelsSorted[a][n]);
        levelDiv[a].appendChild(nodes[levelsSorted[a][n]].box);
      }
      field.appendChild(levelDiv[a]);
    }
  }

//X placement here

//populate node xwidths
  for(a in nodes) {
    nodes[a].xwidth=nodes[a].box.offsetWidth; //since boxes are placed
  }
//place bottom node(s)
  for(a in levelsSorted[0]) {
    nodes[levelsSorted[0][a]].xcenter=500;
    nodes[levelsSorted[0][a]].xweight=1;
  }

//place higher up nodes
//for each level
  for(a=1;a<level.length;a++) {
    //for each node in that level
    for(b=0;b<levelsSorted[a].length;b++) {
      //get average of all children of b placements
      var averageXCenter=0, averageXCount=0;
      for(c in nodes[levelsSorted[a][b]].children) {
        averageXCenter+=nodes[nodes[levelsSorted[a][b]].children[c]].xcenter;
        averageXCount++;
      }
      averageXCenter/=averageXCount;

      //alert("node "+levelsSorted[a][b]+" wants to be placed at "+averageXCenter);

      //my ideal placement is averageXCenter
      nodes[levelsSorted[a][b]].xcenter=averageXCenter;

      //but others have a say too
      //alert("a,b "+a+" "+b);

      for(c=(b-1);c>=0;c--) {
        //if(c==-1) break;
        //alert("c" + c);
        //if left edge less than last right edge
        var leftedge_this=(nodes[levelsSorted[a][c+1]].xcenter-((nodes[levelsSorted[a][c+1]].xwidth)/2));
        var rightedge_last=(nodes[levelsSorted[a][c]].xcenter+((nodes[levelsSorted[a][c]].xwidth)/2));
        //alert(leftedge_this+" "+rightedge_last);
        if( leftedge_this < rightedge_last )
        {
          nodes[levelsSorted[a][c+1]].xcenter+=(rightedge_last-leftedge_this)+20;
        }
      }
    }
    
//    alert(" ");
  }

  graphRenderX(nodes, levelsSorted);


 
//draw the lines
  for(a in lines) {
    routeLine(
      ((nodes[lines[a].to].box.offsetLeft)+(nodes[lines[a].to].box.offsetWidth/2)),
      nodes[lines[a].to].box.offsetTop,
      ((nodes[lines[a].from].box.offsetLeft)+(nodes[lines[a].from].box.offsetWidth/2)),
      (nodes[lines[a].from].box.offsetTop+nodes[lines[a].from].box.offsetHeight),
      lines[a].color);
  }
}

function graphRenderX(nodes, levelsSorted) {
//apply xcenters on field, hack uses marginLeft
  for(a=0;a<levelsSorted.length;a++) {
    for(b=0;b<levelsSorted[a].length;b++) {
      var calcpad;
      if(b==0)
        calcpad=nodes[levelsSorted[a][b]].xcenter-((nodes[levelsSorted[a][b]].xwidth)/2);
      else
      {
        //alert(nodes[levelsSorted[a][b-1]].box.offsetLeft+nodes[levelsSorted[a][b-1]].box.offsetWidth);
        calcpad=nodes[levelsSorted[a][b]].xcenter-((nodes[levelsSorted[a][b]].xwidth)/2)-(nodes[levelsSorted[a][b-1]].box.offsetLeft+nodes[levelsSorted[a][b-1]].box.offsetWidth);
      }
      nodes[levelsSorted[a][b]].box.style.marginLeft=calcpad+"px";
    }
  }
}

 
function routeLine(sx, sy, ex, ey, c) {  //start has the arrow
  var line=new Array();
  line.push({x: sx, y: sy});
  line.push({x: sx, y: (sy+ey)/2}); //come up
  line.push({x: ex, y: (sy+ey)/2}); //come over
  line.push({x: ex, y: ey});  //and up
  //alert(sx + ", " +sy + " - " + ex + ", " + ey);
  drawlinearray(line, c);
}
 
function graphRemoveLoops(nodes, thisnodeindex) {
  //iterate through all children
  for(a in nodes[thisnodeindex].children)
  {
    var runChild=true;
    for(l in nodes[thisnodeindex].lineage) {
      //search my lineage for this children
      if(nodes[thisnodeindex].lineage[l]==nodes[thisnodeindex].children[a]) {
        runChild=false;
        break;
      }    
    }
    if(runChild==false) {
      //my child was found in my lineage, we have a problem

      var it=nodes[nodes[thisnodeindex].children[a]];
      var it_nodeindex=nodes[thisnodeindex].children[a];

      for(c in it.parents) {
        //i'm not it's parent anymore
        if(it.parents[c] == thisnodeindex)
        {
          it.parents.splice(c,1);
          break;
        }
      }
      nodes[thisnodeindex].children.splice(a,1);  //and it's not my child anymore

      //insert the other way
      nodes[thisnodeindex].parents.splice(0,0,it_nodeindex); //it's actually my parent
      it.children.splice(0,0,thisnodeindex);          //and i am it's child

    }
    else {
      nodes[nodes[thisnodeindex].children[a]].lineage=nodes[thisnodeindex].lineage.concat(
        nodes[nodes[thisnodeindex].children[a]].lineage, thisnodeindex);
      graphRemoveLoops(nodes, nodes[thisnodeindex].children[a]);
    }
  }
}

function doYPlacement(nodes,level,inLevel) {
//i guess it's not really recursive
  if(level>50)
  {
    alert("WTF");
    return;
  }
//  alert("placing level: "+level);
//build set of node indexes in level
  var inLevelnext = new Array();
//for all nodes in this level
  for(a in inLevel) {
    //place all nodes parents in the next level
    for(p in nodes[inLevel[a]].parents) {
      nodes[nodes[inLevel[a]].parents[p]].level=level+1;
      inLevelnext.push(nodes[inLevel[a]].parents[p]);
    }
  }
  if(inLevelnext.length>0)
    doYPlacement(nodes, level+1, inLevelnext);
}


/*function doYPlacement(nodes,levels)
//function is stupid for now
{
  for(a=0;(a<levels.length&&a<10);a++)
  {
    for(nodename in levels[a])
    {
      thisnode=nodes[levels[a][nodename]];
      //place all children in the level below this one
      for(child in thisnode.children)
      {
        //if(nodes[thisnode.children[child]].level==null) //unplaced
        //{
          if(levels[a+1]==null) levels[a+1]=new Array();
          nodes[thisnode.children[child]].level=a+1;
          levels[a+1].push(thisnode.children[child]);
        //}
      }
    }
  }
  return 0;
}*/

//*****************************************************************************
//***************************LOW LEVEL DRAWING*********************************
//*****************************************************************************

function drawarrow(x,y,c) {
	ctx=document.getElementById('line_canvas').getContext('2d');
	ctx.beginPath();
	if(c=="red")
		ctx.fillStyle='rgba(255,0,0,255)';
	else if(c=="green")
		ctx.fillStyle='rgba(0,128,0,255)';
	else if(c=="blue")
		ctx.fillStyle='rgba(0,0,255,255)';
	ctx.moveTo(x,y);
	ctx.lineTo(x-5, y-10);
	ctx.lineTo(x+5, y-10);
	ctx.lineTo(x,y);
	ctx.fill();
}

function drawline(x,y,w,h,c) {
	animatedctx=document.getElementById('line_canvas').getContext('2d');
	animatedctx.beginPath();
	//animatedctx.fillStyle=rgba(255,255,255,0);
	if(c==0)
		animatedctx.fillStyle='rgba(255,0,0,128)';
	else if(c==1)
		animatedctx.fillStyle='rgba(0,128,0,128)';
	else if(c==2)
		animatedctx.fillStyle='rgba(0,0,255,128)';
	if(w<0)
	{
		x=x+w;		//move x left
		w=-w;
	}
	else
		w++;
	if(h<0)
	{
		y=y+h;		//move y up
		h=-h;
	}
	else
		h++;

	animatedctx.rect(x,y,w,h);
	animatedctx.fill();
}

function drawlinearray(a,c) {		//a is {x,y}, c is the color
	//this should draw an arrow too
	drawarrow(a[0].x,a[0].y,c);

	for(var i=1;i<a.length;i++)
	{
		if(a[i].x==a[i-1].x)		//x is the same
			drawline(a[i-1].x, a[i-1].y, 0, a[i].y-a[i-1].y,c);

		if(a[i].y==a[i-1].y)		//y is the same
			drawline(a[i-1].x, a[i-1].y, a[i].x-a[i-1].x, 0,c);
	}
}
