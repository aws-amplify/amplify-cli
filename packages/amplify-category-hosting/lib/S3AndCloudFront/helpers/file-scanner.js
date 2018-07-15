"use strict";
const fs = require('fs-extra')
const path = require('path')

let _ignoredDirs = []
let _ignoredFiles = []

//get the last modification time of the directory including its files and subdirectories
function getDirContentMTime(dirPath, ignoredDirs, ignoredFiles){
    let mtime
    if(fs.existsSync(dirPath)){
        _ignoredDirs.push.apply(_ignoredDirs, ignoredDirs)
        _ignoredFiles.push.apply(_ignoredFiles, ignoredFiles)
        mtime = recursiveGetDirContentMTime(dirPath)
    }
    return mtime
}

function recursiveGetDirContentMTime(dirPath){
    let mtime = fs.lstatSync(dirPath).mtime
    let files = fs.readdirSync(dirPath)
	for(let i = 0; i < files.length; i++) {
		let stat = fs.lstatSync(path.join(dirPath, files[i]))
		if(stat.isDirectory()) {
            if(_ignoredDirs.indexOf(files[i]) < 0){
                let subDirMtime = recursiveGetDirContentMTime(path.join(dirPath, files[i]))
                mtime = (mtime > subDirMtime) ? mtime : subDirMtime
            }
        }else  if(_ignoredFiles.indexOf(files[i]) < 0) {
            let fileMtime = stat.mtime
            mtime = (mtime > fileMtime) ? mtime : fileMtime
		}
    }
    return mtime
}

function scan(dir, ignoredDirs, ignoredFiles){
    let fileList = []
    if(fs.existsSync(dir)){
        _ignoredDirs.push.apply(_ignoredDirs, ignoredDirs)
        _ignoredFiles.push.apply(_ignoredFiles, ignoredFiles)
        fileList = recursiveScan(dir, [])
    }
    return fileList
}

function findFile(dir, filename){
    let result
    if(fs.existsSync(dir)){
        let filelist = recursiveFindFile(dir, filename,[])
        if(filelist.length > 0){
            result = filelist[0]
        }
    }
    return result
}

function recursiveFindFile(dir, filename, filelist){
    let files = fs.readdirSync(dir)
    filelist = filelist || []
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = recursiveFindFile(path.join(dir, file), filename, filelist)
        }
        else if(file == filename){
            filelist.push(path.join(dir, file))
        }
    })
    return filelist
}

function recursiveScan(dir, filelist) {
    let files = fs.readdirSync(dir)
    filelist = filelist || []
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            if(_ignoredDirs.indexOf(file) < 0){
                filelist = recursiveScan(path.join(dir, file), filelist)
            }
        }
        else if (_ignoredFiles.indexOf(file) < 0) {
            filelist.push(path.join(dir, file))
        }
    })
    return filelist
}

module.exports = {
    getDirContentMTime,
    scan,
    findFile
}

