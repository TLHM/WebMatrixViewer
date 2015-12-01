'use strict';

//Create a mathbox! Copied boiler plate
//Though at some point I'll look into controls
var mathbox = mathBox({
   plugins: ['core', 'controls', 'cursor', 'mathbox'],
   controls: {
     // Orbit controls, i.e. Euler angles, with gimbal lock
     //klass: THREE.OrbitControls,

     // Trackball controls, i.e. Free quaternion rotation
     klass: THREE.TrackballControls,
   },
});
if (mathbox.fallback)
{
   throw "WebGL not supported";
}

//Set up Three to render for us
var three = mathbox.three;
three.renderer.setClearColor(new THREE.Color(0x151318), 1.0);


// Place camera
var camera =
mathbox
.camera({
  proxy: true,
  position: [0, 0, 3],
});

// 2D cartesian space
var view =
mathbox
.cartesian({
  range: [[-20, 20], [-20, 20], [-20, 20]],
  scale: [1, 1, 1],
});

// Calibrate focus distance for units
mathbox.set('focus', 3);

//For rotating the view, doesn't play that nicely with controls atm
//Hopefully make those better at some point
//Copied from a mathbox example
var time = 0;
var clock;
three.on('update', function () {
  clock = three.Time.clock;
  time = clock / 4;

  var t = Math.max(clock - 1, 0) / 12;
  t = t < 0.5 ? t * t : t - 0.25;

  //var o = 0.5 - 0.5 * Math.cos(Math.min(1, t) * π);

  var c = Math.cos(t);
  var s = Math.sin(t);
  view.set('quaternion', [0, -s, 0, c]);
});

//Sends a request for the data at url we specify
//Calls the function in pingData on completion
var fetch = function (url, type, callback) {
   var xhr = new XMLHttpRequest();
   var myProgress=0;

   xhr.open('GET', url, true);
   xhr.responseType = type;
   console.log("Fetching "+url);
   //Call callback when loaded
   xhr.addEventListener('load', function () {
      console.log("Loaded file.");
      callback(xhr.status === 404, xhr);
   });
   //Update progress bar as we load
   xhr.addEventListener('progress', function(oEvent){
      myProgress = ( oEvent.loaded / oEvent.total ) * 60;
   });

   xhr.send();

   //Make the loading bar keep track of progress
   load.set("expr", function(emit){
      emit(-30,-8);
      emit(-30+myProgress,-8);
   });
};

//Uses fetch to get data
//Contains the callback for onLoad
var pingData = function () {
   var filePath;
   var query = window.location.search.substring(1);
   var vars = query.split("&");
    for (var i=0;i<vars.length;i++)
    {
      var pair = vars[i].split("=");
      if(pair[0] === 'data')
      {
         filePath = pair[1];
      }
    }
   console.log(filePath);
   if(filePath)
   {
      filePath='data/'+filePath;
   }

   console.log("ping that data");
   fetch(filePath || 'data/can_292.json', 'json', function (err, xhr) {
      //If we get a proper response
      if (xhr.response && xhr.response.edges) {
        console.log("Putting data in array?");
        //Save our data in an arry of edges
        var my_data = xhr.response.edges;
        console.log("Received "+my_data.length+" edges!");

        //How many edges do we have?
        var countNeeded = Math.ceil(my_data.length/2048.0);
        //Create an array so we can use foreach, and not have scoping issues
        //with i, etc. each run through needs its own int that won't change
        var ns = [];
        for(var k=0;k<countNeeded;k++)
        {
           ns.push(k);
        }
        //For each dat array!
        ns.forEach(function(n)
        {
           //Calculate the index range we'll be taking care of with this iteration
           //Max 2048 edges per array obj in mathbox, it seems
           var offset = n*2048;
           var thisLen = Math.min(my_data.length-offset, 2048);

           //Set data array to proper length
           data[n].set("length", thisLen);
           data[n].set("expr", function (emit, i) {
               //Just pull the position data from the edge
               var edge = my_data[offset+i];
               /*if(!edge){
                  console.log(n+": Ack "+offset+" "+i+"="+(offset+i)+" : "+my_data.length);
                  edge=my_data[0];
               }*/

               var p = edge.positions;
               emit(p[0].x, p[0].y, p[0].z);
               emit(p[1].x, p[1].y, p[1].z);
           });

           //Do same with color
           colors[n].set("length", thisLen);
           colors[n].set("expr", function (emit, i) {
               var edge = my_data[offset+i];
               var c = edge.color;
               emit(c.r, c.g, c.b, c.a);
           });

        });
     }

     //Kill loading bar, loading is done!
     /*load.set('expr', function(emit,i){
        emit(-9999, -8);
        emit(-9999, -8);
     });
     mathbox.select('#loadingBarBG').set('expr', function(emit,i){
        emit(-9999,0,0);
        emit(-9999,1,0);
     });*/
  });
};

// Set up some vectors and data to fill
//Current edge max, according to these resources is 40,960 edges
var data = [];
var colors = [];
var vectors = [];
var offsets = [];
for(var n=0;n<20;n++)
{
   data.push(view.array({
     length: 1,
     channels: 3,
     items: 2,
     id: "vectorData"+n,
     expr: function (emit, i) {
        emit(9999, 0, i);
        emit(9999, 1, i);
     },
  }));
   colors.push(view.array({
        length: 1,
        channels: 4,
        items: 1,
        id: "colorData"+n,
        expr: function (emit) {
           emit(1, 0, 0, 1);
        },
   }));
   vectors.push(view.vector({
      points: "#vectorData"+n,
      colors: "#colorData"+n,
      end: false,
      width: 1,
      color: '#ffffff',
   }));

   offsets.push(0);
}

//Loading bar
var load = view.array({
   length:1,
   channels: 2,
   items:2,
   id: "loadingBar",
   expr: function(emit){
      emit(9999, 0);
      emit(9999, 1);
   }
});
view.vector({
   points: "<",
   end: false,
   width: 10,
   color: '#8aabc1',
});
//Loading Bar BG
view.array({
   length:1,
   channels: 3,
   items:2,
   id: "loadingBarBG",
   expr: function(emit){
      emit(-30.3, -8,-0.1);
      emit(30.3, -8,-0.1);
   }
});
view.vector({
   points: "<",
   end: false,
   width: 14,
   color: '#0a5094',
});

//Load our data shortly
setTimeout(pingData, 500);
console.log('got here!!');
