var Jimp = require("jimp");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { Parser } = require("json2csv");
const { PythonShell } = require("python-shell");

exports.index = (req, res) => {
  res.render("home", {
    title: "Home",
  });
};

exports.finishProcess = async (req, res) => {
  let { gpsPositions } = req.body;
  gpsPositions = JSON.parse(gpsPositions);
  await deleteAllFilesFromDirectory("public/csv");
  let processedGpsPositions = await processGpsPositions(gpsPositions);
  let csvString = await generateCsv(processedGpsPositions);
  await saveFileToSystem("public/csv/distances.csv", csvString);

  let options = {
    mode: "text",
    pythonPath: "python",
    pythonOptions: ["-u"], // get print results in real-time
  };

  PythonShell.run("correlation.py", options, (err) => {
    if (err) {
      console.log(`Error Occured in home.js PythonShell.run("correlation.py")`);
      console.log(err);
      return err;
    }
    console.log("finished");
    res.send({ message: "success" });
  });
};

exports.cutSingleImage = async (req, res) => {
  let { realPositions, gpsPositions, imagePath, index } = req.body;

  if (index == 0) {
    await deleteAllFilesFromDirectory("public/images");
  }

  await cropImage(
    imagePath,
    `public/images/result${index}.png`,
    realPositions.x1,
    realPositions.y1,
    realPositions.x2 - realPositions.x1,
    realPositions.y2 - realPositions.y1
  );

  await cropImage(
    imagePath,
    `public/attacked_images/result${index}.png`,
    gpsPositions.x1,
    gpsPositions.y1,
    gpsPositions.x2 - gpsPositions.x1,
    gpsPositions.y2 - gpsPositions.y1
  );

  res.send({ message: "success" });
};

async function cropImage(origin, destination, x, y, width, height) {
  return new Promise(async (resolve, reject) => {
    Jimp.read(origin)
      .then((image) => {
        resolve(
          image
            .clone()
            .quality(100) // set JPEG quality
            .crop(parseInt(x), parseInt(y), parseInt(width), parseInt(height))
            .write(destination) // save
        );
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function deleteAllFilesFromDirectory(directoryPath) {
  return new Promise(async (resolve, reject) => {
    // fs.readdir(directoryPath, async(err, files) => {
    //   if (err) reject(err);

    //   for (const file of files) {
    //     await fs.unlinkSync(path.join(directoryPath, file), err => {
    //       if (err) reject(err);
    //     });
    //   }
    //   resolve();
    // });

    fse.emptyDir(directoryPath, () => {
      resolve();
    });
  });
}

async function generateCsv(data) {
  return new Promise(async (resolve, reject) => {
    const fields = ["frame1", "frame2", "distance"];
    const opts = { fields };
    try {
      const parser = new Parser(opts);
      const csv = parser.parse(data);
      resolve(csv);
    } catch (err) {
      console.error(err);
      reject();
    }
  });
}

async function saveFileToSystem(path, data) {
  return new Promise(async (resolve, reject) => {
    fs.writeFile(path, data, function (err) {
      if (err) reject(err);
      console.log(`file saved to:${path}`);
      resolve("file saved");
    });
  });
}

async function processGpsPositions(gpsPositions) {
  return new Promise(async (resolve, reject) => {
    let processedGpsPositions = [];
    for (let i = 0; i < gpsPositions.length; i++) {
      for (let j = 0; j < gpsPositions.length; j++) {
        // console.log(`gpsPositions[i]:${JSON.stringify(gpsPositions[i])}`);
        // console.log(`gpsPositions[j]:${JSON.stringify(gpsPositions[j])}`);

        let d = await getDistance(
          (gpsPositions[i].x1 + gpsPositions[i].x2) / 2,
          (gpsPositions[j].x1 + gpsPositions[j].x2) / 2,
          (gpsPositions[i].y1 + gpsPositions[i].y2) / 2,
          (gpsPositions[j].y1 + gpsPositions[j].y2) / 2
        );

        processedGpsPositions.push({
          frame1: i,
          frame2: j,
          distance: d,
        });
      }
    }
    resolve(processedGpsPositions);
  });
}

async function getDistance(x1, x2, y1, y2) {
  return new Promise(async (resolve, reject) => {
    try {
      let distanceX = (x2 - x1) * (x2 - x1);
      let distanceY = (y2 - y1) * (y2 - y1);
      let sumDistances = distanceX + distanceY;
      let distance = Math.sqrt(sumDistances);
      resolve(distance);
    } catch (e) {
      reject(e);
    }
  });
}
