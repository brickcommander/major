window.onload = function () {
  //PARAMETERS

  //if you change image size, please Update this by the new legend
  let metersInLegend = 200;
  let legendPixels = 278;
  let photoWidth = 1920;
  let photoHeight = 1080;
  var imageUrl = "new_york.jpg";
  let cameraAngle = 79;

  var stepSize = 5; //default , 5 meters per second

  var oneMeterInPixels = legendPixels / metersInLegend; //it's 1 meter in the reality
  var rectW = 100 * oneMeterInPixels;
  var rectH = 100 * oneMeterInPixels;
  console.log(`oneMeterInPixels:${oneMeterInPixels}`);

  $("#controlPanel").hide();
  $("#clickText").hide();
  var canvas = 10; // placeholder
  var contect = 50; // placeholder
  var gpsPosition = { x: null, y: null };
  var realPosition = { x: null, y: null };
  var imageObj = new Image();

  let realPositions = [];
  let gpsPositions = [];

  var attacked = false;

  $("#heightSubmit").on("click", () => {
    stepSize = parseFloat($("#droneSpeedInput").val());

    let range = getRangeFromHeight(
      cameraAngle,
      parseFloat($("#heightInput").val())
    );
    console.log(`range:${range}`);
    $("#preForm").hide();
    rectW = range * oneMeterInPixels;
    rectH = range * oneMeterInPixels;

    generateCanvas();
    setCanvasBackground();
    $("#clickText").show();
  });

  function showControlPanel() {
    $("#controlPanel").show();
    $("#controlMoveUp").on("click", () => {
      moveUp();
      controlBtnClicked();
    });
    $("#controlMoveDown").on("click", () => {
      moveDown();
      controlBtnClicked();
    });
    $("#controlMoveRight").on("click", () => {
      moveRight();
      controlBtnClicked();
    });
    $("#controlMoveLeft").on("click", () => {
      moveLeft();
      controlBtnClicked();
    });
  }

  function generateCanvas() {
    var x = document.createElement("CANVAS");
    x.width = photoWidth;
    x.height = photoHeight;
    x.id = "mainCanvas";
    x.addEventListener("click", onCanvasClick);
    console.log(x);
    document.getElementById("main").appendChild(x);

    canvas = document.getElementById("mainCanvas");
    console.log(canvas);
    context = canvas.getContext("2d");
    console.log(context);
  }

  function setCanvasBackground() {
    console.log("setCanvasBackground");
    var background = new Image();
    background.src = imageUrl;

    background.onload = function () {
      context.beginPath();
      context.drawImage(background, 0, 0);
      drawGpsRect();
      drawRealRect();
    };
  }

  function onCanvasClick(event) {
    realPosition.x = event.pageX - this.offsetLeft;
    realPosition.y = event.pageY - this.offsetTop;

    gpsPosition.x = event.pageX - this.offsetLeft;
    gpsPosition.y = event.pageY - this.offsetTop;

    // blank();
    // drawRect();
    drawGpsRect();
    drawRealRect();
    $("#clickText").hide();
    showControlPanel();
  }

  $("#mainCanvas").on("click", onCanvasClick);

  document.onkeydown = checkKey;

  function checkKey(e) {
    console.log("checkKey function started");
    e = e || window.event;
    if (e.keyCode == "38") {
      moveUp();
      controlBtnClicked();
    } else if (e.keyCode == "40") {
      moveDown();
      controlBtnClicked();
    } else if (e.keyCode == "37") {
      moveLeft();
      controlBtnClicked();
    } else if (e.keyCode == "39") {
      moveRight();
      controlBtnClicked();
    } else if (e.keyCode == "13") {
      //enter pressed
      generatePhotos();
    }
  }

  function controlBtnClicked() {
    blank();
    // drawGpsRect();
    // drawRealRect();
  }

  function drawRealRect() {
    context.globalAlpha = 0.5;
    if (realPosition.x && realPosition.y) {
      context.beginPath();
      context.lineWidth = 4;
      //   context.strokeStyle = "black";
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(
        realPosition.x - rectW / 2,
        realPosition.y - rectH / 2,
        rectW,
        rectH
      );
      // context.globalAlpha(0.5);
      context.stroke();

      rememberRealPosition();
    }
  }

  function drawGpsRect() {
    context.globalAlpha = 0.4;
    if (gpsPosition.x && gpsPosition.y) {
      context.beginPath();
      context.lineWidth = 4;
      //   context.strokeStyle = "red";
      if (attacked) context.fillStyle = "rgba(255, 99, 71, 0.5)";
      context.fillRect(
        gpsPosition.x - rectW / 2,
        gpsPosition.y - rectH / 2,
        rectW,
        rectH
      );
      context.stroke();

      rememberGpsPosition();
    }
  }

  function blank() {
    console.log("blank");
    context.clearRect(0, 0, canvas.width, canvas.height);
    setCanvasBackground();
  }

  function moveRight() {
    console.log("moveRight function started");
    gpsPosition.x += stepSize;
    realPosition.x += stepSize;
  }

  function moveLeft() {
    console.log("moveLeft function started");
    gpsPosition.x -= stepSize;
    realPosition.x -= stepSize;
    // rectX -= stepSize;
  }

  function moveUp() {
    console.log("moveUp function started");
    gpsPosition.y -= stepSize;
    realPosition.y -= stepSize;
    // rectY -= stepSize;
  }

  function moveDown() {
    console.log("moveDown function started");
    gpsPosition.y += stepSize;
    realPosition.y += stepSize;
    // rectY += stepSize;
  }

  function generatePhotos() {
    alert(
      `number of frames: ${gpsPositions.length}\n now click OK and wait ...`
    );
    finishProcessByServer();
    // sendPositionsToServer();
  }

  function rememberRealPosition() {
    let x1 = Math.round((realPosition.x - rectW / 2) * 10) / 10;
    let x2 = Math.round((realPosition.x + rectW / 2) * 10) / 10;
    let y1 = Math.round((realPosition.y - rectH / 2) * 10) / 10;
    let y2 = Math.round((realPosition.y + rectH / 2) * 10) / 10;
    console.log(`rememberRealPosition() - push ${x1},${x2},${y1},${y2}`);
    realPositions.push({ x1, x2, y1, y2 });
    console.log(realPositions.length, gpsPositions.length);
    AddOneToframesCounter();
    sendPositionToServer();
  }

  function rememberGpsPosition() {
    let x1 = Math.round((gpsPosition.x - rectW / 2) * 10) / 10;
    let x2 = Math.round((gpsPosition.x + rectW / 2) * 10) / 10;
    let y1 = Math.round((gpsPosition.y - rectH / 2) * 10) / 10;
    let y2 = Math.round((gpsPosition.y + rectH / 2) * 10) / 10;
    // console.log(`rememberGpsPosition() - push ${x1},${x2},${y1},${y2}`);
    gpsPositions.push({ x1, x2, y1, y2 });
  }

  $("#attackBtn").on("click", () => {
    var metersX = parseFloat($("#attackMetersX").val()) || 0;
    var metersY = parseFloat($("#attackMetersY").val()) || 0;
    gpsPosition.x += metersX;
    gpsPosition.y += metersY;
    if (metersX || metersY) attacked = true;
  });

  function finishProcessByServer() {
    // e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/finish",
      dataType: "json",
      data: {
        gpsPositions: JSON.stringify(gpsPositions),
      },
      success: function (data) {
        alert("Success");
      },
      error: function (error) {
        alert("Error*:" + JSON.stringify(error));
      },
    });
  }

  function sendPositionsToServer() {
    console.log(`sending to server:${JSON.stringify(gpsPositions)}`);
    // e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/cutimage",
      dataType: "json",
      data: {
        gpsPositions: JSON.stringify(gpsPositions),
        realPositions: JSON.stringify(realPositions),
        imagePath: "public/" + imageUrl,
      },
      success: function (data) {
        alert("Success");
      },
      error: function (error) {
        alert("Error**:" + JSON.stringify(error));
      },
      //   complete: function () {
      //     window.location.href = "www.google.com";
      //   },
    });
  }

  function sendPositionToServer() {
    console.log(`sending too server:${JSON.stringify(gpsPositions)}`);
    // e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/cutsingleimage",
      dataType: "json",
      data: {
        realPositions: realPositions[realPositions.length - 1],
        gpsPositions: gpsPositions[gpsPositions.length - 1],
        imagePath: "public/" + imageUrl,
        index: realPositions.length - 1,
      },
      success: function (data) {
        console.log("Success");
      },
      error: function (error) {
        alert("Error saving image:" + JSON.stringify(error));
      },
      //   complete: function () {
      //     window.location.href = "www.google.com";
      //   },
    });
  }

  function getTanFromDegrees(degrees) {
    return Math.tan((degrees * Math.PI) / 180);
  }

  function getRangeFromHeight(cameraAngle, height) {
    return getTanFromDegrees(cameraAngle / 2) * height * 2;
  }

  function AddOneToframesCounter() {
    let count = parseInt($("#framesCounter").text());
    count++;
    $("#framesCounter").text(count);
  }
};
