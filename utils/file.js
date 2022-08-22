const fs = require("fs");

const deleteFile = (path) => {

  return fs.unlink(path, (err) => {
    if (err) {
      console.log(err)
      if (err === "ENODENT") {
        return 0;
      } else
        return 0;
    }
  });
};

module.exports = deleteFile;
