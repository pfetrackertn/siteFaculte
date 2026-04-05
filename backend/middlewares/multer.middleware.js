const multer = require("multer");
const fs = require("fs");
const path = require("path");

const mediaDirectory = path.join(__dirname, "..", "media");

if (!fs.existsSync(mediaDirectory)) {
  fs.mkdirSync(mediaDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
