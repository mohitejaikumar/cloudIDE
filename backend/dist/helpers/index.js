"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilesIncrementally = exports.getAllFiles = void 0;
exports.getFileLanguage = getFileLanguage;
exports.appyPatchtoFile = appyPatchtoFile;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const diff_1 = require("diff");
const getAllFiles = (dirPath) => __awaiter(void 0, void 0, void 0, function* () {
    let fileTree = {};
    const result = yield promises_1.default.readdir(dirPath);
    for (const file of result) {
        const filePath = dirPath + '/' + file;
        const stat = yield promises_1.default.stat(filePath);
        if (stat.isDirectory()) {
            fileTree[file] = {
                name: file,
                type: "dir",
                children: (yield (0, exports.getAllFiles)(filePath))
            };
        }
        else {
            fileTree[file] = {
                name: file,
                type: "file",
            };
        }
    }
    return fileTree;
});
exports.getAllFiles = getAllFiles;
const getFilesIncrementally = (dirPath, currentDir) => __awaiter(void 0, void 0, void 0, function* () {
    let fileTree = {};
    const result = yield promises_1.default.readdir(dirPath);
    for (const file of result) {
        const filePath = dirPath + '/' + file;
        const stat = yield promises_1.default.stat(filePath);
        if (stat.isDirectory()) {
            fileTree[file] = {
                name: file,
                type: "dir",
                children: {},
            };
        }
        else {
            fileTree[file] = {
                name: file,
                type: "file",
            };
        }
    }
    return {
        [currentDir]: {
            name: currentDir,
            type: "dir",
            children: fileTree
        }
    };
});
exports.getFilesIncrementally = getFilesIncrementally;
function getFileLanguage(filePath) {
    const extension = path_1.default.extname(filePath);
    switch (extension) {
        case '.js':
            return 'JavaScript';
        case '.html':
            return 'HTML';
        case '.css':
            return 'CSS';
        case '.java':
            return 'Java';
        case '.py':
            return 'Python';
        case '.ts':
            return 'TypeScript';
        case '.php':
            return 'PHP';
        default:
            return 'Unknown Language';
    }
}
function appyPatchtoFile(filePath, patch) {
    return __awaiter(this, void 0, void 0, function* () {
        const originalFileContent = yield promises_1.default.readFile(filePath);
        //@ts-ignore
        const patchedFileContent = (0, diff_1.applyPatch)(originalFileContent.toString(), patch, { autoConvertLineEndings: true });
        if (patchedFileContent)
            yield promises_1.default.writeFile(filePath, patchedFileContent);
    });
}
