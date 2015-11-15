var mathbox = mathBox({
   plugins: ['core', 'controls', 'cursor', 'mathbox'],
   controls: {
     // Orbit controls, i.e. Euler angles, with gimbal lock
     klass: THREE.OrbitControls,

     // Trackball controls, i.e. Free quaternion rotation
     //klass: THREE.TrackballControls,
   },
});
if (mathbox.fallback) throw "WebGL not supported";

var three = mathbox.three;
three.renderer.setClearColor(new THREE.Color(0x151318), 1.0);



// Place camera
var camera =
mathbox
.camera({
  proxy: true,
  position: [0, 0, 3],
});

// 2D cartesian
var view =
mathbox
.cartesian({
  range: [[-50, 50], [-50, 50], [-50, 50]],
  scale: [.5, .5, .5],
});

// Calibrate focus distance for units
mathbox.set('focus', 3);


var fetch = function (url, type, callback) {
   var xhr = new XMLHttpRequest();
   xhr.open('GET', url, true);
   xhr.responseType = type;
   console.log("Fetching "+url);
   xhr.addEventListener('load', function () {
      console.log("Loaded file.");
      callback(xhr.status === 404, xhr);
   });
   xhr.send();
}

var pingData = function () {
   console.log("ping that data");
   fetch(filePath || 'data/can_292.json', 'json', function (err, xhr) {
      if (xhr.response && xhr.response.edges) {
        console.log("Putting data in array?");
        var my_data = xhr.response.edges;
        console.log("Received "+my_data.length+" edges!");

        datas.set("length", my_data.length);
        datas.set("expr", function (emit, i) {
            var edge = my_data[i];
            var p = edge.positions;
            emit(p[0].x, p[0].y, p[0].z);
            emit(p[1].x, p[1].y, p[1].z);
        });

        colors.set("length", my_data.length);
        colors.set("expr", function (emit, i) {
            var edge = my_data[i];
            var c = edge.color;
            emit(c.r, c.g, c.b, c.a);
        });
     }
  });
}

// Draw vectors
var datas =
   view.array({
     length: 1,
     channels: 3,
     items: 2,
     id: "vectorData",
     expr: function (emit, i) {
     emit(0, 0, i);
     emit(0, 1, i);
     },
   });
var colors =
   view.array({
        length: 1,
        channels: 4,
        items: 1,
        id: "colorData",
        expr: function (emit, i) {
        emit(1, 0, 0, 1);
        },
   });
var vector =
   view.vector({
   points: "#vectorData",
   colors: "#colorData",
   end: false,
   width: .5,
   color: '#ffffff',
   });


setTimeout(pingData, 500);
console.log('got here!!');
