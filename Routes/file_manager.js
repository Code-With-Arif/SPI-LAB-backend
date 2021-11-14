const express = require("express");
const Router = express.Router();
const path = require("path");
const fs = require("fs");
const authVerify = require("../DB/authMiddleWare");
const mime = require("mime");

const admin_file_path = path.resolve(process.env.SERVER_ROOT, process.env.ADMIN_FILE_PATH);



Router.post("/admin/vault/getVault", authVerify, async (req, res) => {

      async function getFiles(dir) {
            var files = {
                  size: 0,
            };

            fs.readdirSync(dir).forEach(async file => {


                  var stats = fs.statSync(path.resolve(dir, file));
                  if (stats.isDirectory()) {
                        files[file] = {
                              name: file,
                              type: "dir",
                              path: process.env.BACKEND_HOST + path.resolve(dir, file).replace(admin_file_path, "").replace(/\\/g, "/").replace(/\//, ""),
                              lastModified: stats.mtime,
                              ...await getFiles(path.resolve(dir, file))
                        }
                        files.size += files[file].size;
                  } else {
                        files.size += stats.size;

                        files[file] = {
                              name: file,
                              type: "file",
                              path: process.env.BACKEND_HOST + path.resolve(dir, file).replace(admin_file_path, "").replace(/\\/g, "/").replace(/\//, ""),
                              size: stats.size,
                              lastModified: stats.mtime
                        };
                  }

            });

            return files;
      }
      const vault = await getFiles(admin_file_path);

      return res.status(200).json({
            name: "",
            type: "root-dir",
            path: process.env.BACKEND_HOST + path.resolve(admin_file_path).replace(admin_file_path, "").replace(/\\/g, "/").replace(/\//, ""),
            ...vault
      });
})


Router.post("/admin/vault/createFile", authVerify, async (req, res) => {
      const { fileName, filePath } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, ""), fileName);
      if (fs.existsSync(file)) {
            return res.status(200).json({
                  status: 400,
                  error: "File already exists"
            });
      }

      fs.writeFileSync(file, "");

      return res.status(200).json({
            error: false,
            status: 200,
            message: "File created successfully"
      });
});

Router.post("/admin/vault/createDir", authVerify, async (req, res) => {
      const { fileName, filePath } = req.body;
      const dir = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, ""), fileName);
      if (fs.existsSync(dir)) {
            return res.status(200).json({
                  status: 400,
                  error: "Directory already exists"
            });
      }

      fs.mkdirSync(dir);

      return res.status(200).json({
            error: false,
            status: 200,
            message: "Directory created successfully"
      });
});

Router.post("/admin/vault/rename", authVerify, async (req, res) => {
      const { filePath, fileName, newName } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      const newFile = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), newName);
      if (!fs.existsSync(file) || filePath === "http://localhost:5000/public" || filePath === "http://localhost:5000/private") {
            return res.status(200).json({
                  status: 400,
                  error: "File does not exist"
            });
      }
      if (fs.existsSync(newFile)) {
            return res.status(200).json({
                  status: 400,
                  error: "File already exist"
            });
      }

      fs.renameSync(file, newFile);

      return res.status(200).json({
            error: false,
            status: 200,
            message: "File renamed successfully"
      });
});

Router.post("/admin/vault/delete", authVerify, async (req, res) => {
      const { filePath, fileName } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      if (!fs.existsSync(file) || filePath === "http://localhost:5000/public" || filePath === "http://localhost:5000/private") {
            return res.status(200).json({
                  status: 400,
                  error: "File does not exist"
            });
      }

      if (fs.lstatSync(file).isDirectory()) {
            fs.rmdirSync(file);
      } else {
            fs.unlinkSync(file);
      }

      return res.status(200).json({
            error: false,
            status: 200,
            message: "File deleted successfully"
      });
});

Router.post("/admin/vault/copy", authVerify, (req, res) => {
      const { filePath, fileName, newPath } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      const newFile = path.resolve(admin_file_path, newPath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      if (!fs.existsSync(file) || filePath === "http://localhost:5000/public" || filePath === "http://localhost:5000/private") {
            return res.status(200).json({
                  status: 400,
                  error: "File does not exist"
            });
      }

      if (fs.lstatSync(file).isDirectory()) {
            function copy(src, dest) {
                  fs.mkdirSync(dest);
                  fs.readdirSync(src).forEach(child => {
                        if (fs.lstatSync(path.resolve(src, child)).isDirectory()) {
                              copy(path.resolve(src, child), path.resolve(dest, child));
                        } else {
                              fs.copyFileSync(path.resolve(src, child), path.resolve(dest, child));
                        }
                  });
            }
            copy(file, newFile);
      } else {
            fs.copyFileSync(file, newFile);
      }

      return res.status(200).json({
            error: false,
            status: 200,
            message: "File copied successfully"
      });
});

Router.post("/admin/vault/move", authVerify, (req, res) => {
      const { filePath, fileName, newPath } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      const newFile = path.resolve(admin_file_path, newPath.replace(process.env.BACKEND_HOST, "").replace(fileName, ""), fileName);
      if (!fs.existsSync(file) || filePath === "http://localhost:5000/public" || filePath === "http://localhost:5000/private") {
            return res.status(200).json({
                  status: 400,
                  error: "File does not exist"
            });
      }

      fs.renameSync(file, newFile);

      return res.status(200).json({
            error: false,
            status: 200,
            message: "File moved successfully"
      });
})

Router.post("/admin/vault/upload", authVerify, (req, res, next) => {
      const multer = require("multer");
      const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                  cb(null, admin_file_path);
            },
            filename: function (req, file, callback) {
                  callback(null, file.originalname);
            }
      });
      const upload = multer({ storage: storage }).single("file");
      upload(req, res, (err) => {
            if (err) {
                  return res.status(500).json({
                        status: 500,
                        error: err
                  });
            }
            const uploadPath = req.body.path;
            const filePath = req.file.path;
            fs.renameSync(filePath, path.resolve(admin_file_path, uploadPath.replace(process.env.BACKEND_HOST, ""), req.file.originalname));
            return res.status(200).json({
                  status: 200,
                  message: "File uploaded successfully"
            });
      }
      );
});

Router.post("/admin/vault/getProperties", async (req, res) => {
      const { filePath } = req.body;
      const file = path.resolve(admin_file_path, filePath.replace(process.env.BACKEND_HOST, ""));
      if (!fs.existsSync(file)) {
            return res.status(200).json({
                  status: 400,
                  error: "File does not exist"
            });
      }

      function getFiles(dir) {
            var size = 0, filesCount = 0, foldersCount = 0;
            fs.readdirSync(dir).forEach(file => {
                  var stats = fs.statSync(path.resolve(dir, file));
                  if (stats.isDirectory()) {
                        foldersCount++;
                        size += (getFiles(path.resolve(dir, file))).size;
                  } else {
                        size += stats.size;
                        filesCount++;
                  }
            });
            return { size, filesCount, foldersCount };
      }

      const stats = fs.lstatSync(file);

      var size, filesCount, foldersCount;
      if (stats.isDirectory()) {
            const dirData = getFiles(file);
            size = dirData.size;
            filesCount = dirData.filesCount;
            foldersCount = dirData.foldersCount;
      }

      const fileProperties = {
            name: path.basename(file),
            fileType: mime.getType(file),
            path: filePath,
            size: size ? size : stats.size,
            filesCount,
            foldersCount,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            isSymbolicLink: stats.isSymbolicLink(),
            isSocket: stats.isSocket(),
            isBlockDevice: stats.isBlockDevice(),
            isCharacterDevice: stats.isCharacterDevice(),
            isFIFO: stats.isFIFO(),
            atime: stats.atimeMs,
            mtime: stats.mtimeMs,
            ctime: stats.ctimeMs,
            fileCreatedOn: stats.ctimeMs,
            fileCreatedBy: stats.uid,
            fileLastModifiedOn: stats.mtimeMs,
            fileLastModifiedBy: stats.uid,
            creationTime: stats.birthtimeMs
      };

      return res.status(200).json(fileProperties);
});




module.exports = Router;